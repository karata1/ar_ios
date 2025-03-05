class ARCore {
    constructor(targetLatitude, targetLongitude) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.gpsManager = new GPSManager();
        this.surfaceDetector = new SurfaceDetector();
        this.cube = null;
        this.video = null;
        this.targetCoords = { latitude: targetLatitude, longitude: targetLongitude };
        
        this.init();
    }

    async init() {
        // Настройка рендерера
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Настройка камеры
        this.camera.position.z = 5;

        // Добавление освещения
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0);
        this.scene.add(directionalLight);

        // Создание куба
        this.createCube();

        // Инициализация видео
        await this.initVideo();

        // Инициализация детектора поверхностей
        await this.surfaceDetector.init();

        // Инициализация GPS
        this.gpsManager.init(this.targetCoords.latitude, this.targetCoords.longitude);
        this.gpsManager.addListener(this.handleGPSUpdate.bind(this));

        // Обработчики событий
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));

        // Запуск анимации
        this.animate();

        // Скрываем загрузчик
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    async initVideo() {
        this.video = document.createElement('video');
        this.video.setAttribute('autoplay', '');
        this.video.setAttribute('playsinline', '');
        this.video.style.display = 'none';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            this.video.srcObject = stream;
            await this.video.play();
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    }

    createCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }

    handleGPSUpdate(data) {
        if (!this.cube || !data.relativePosition) return;

        // Обновляем позицию куба с учетом фильтра Калмана
        const position = data.relativePosition;
        this.cube.position.set(position.x, position.y, position.z);

        // Обновляем информацию на экране
        const debug = document.getElementById('debug');
        if (debug) {
            debug.innerHTML = `
                Расстояние: ${data.distance?.toFixed(2)}м<br>
                Направление: ${data.bearing?.toFixed(2)}°<br>
                Компас: ${data.heading?.toFixed(2)}°
            `;
        }

        // Обновляем компас
        const arrow = document.getElementById('arrow');
        if (arrow) {
            const rotation = data.bearing - data.heading;
            arrow.style.transform = `rotate(${rotation}deg)`;
        }
    }

    async updateSurfaces() {
        if (!this.video || !this.surfaceDetector) return;

        const surfaces = await this.surfaceDetector.detectSurface(this.video);
        if (!surfaces || !this.cube) return;

        // Находим ближайшую поверхность к кубу
        const cubePosition = this.cube.position;
        let closestSurface = null;
        let minDistance = Infinity;

        surfaces.forEach(surface => {
            const distance = Math.sqrt(
                Math.pow(surface.x - cubePosition.x, 2) +
                Math.pow(surface.z - cubePosition.z, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestSurface = surface;
            }
        });

        if (closestSurface) {
            // Плавно обновляем высоту куба
            this.cube.position.y = THREE.MathUtils.lerp(
                this.cube.position.y,
                closestSurface.y,
                0.1
            );
        }
    }

    handleDeviceMotion(event) {
        if (!this.cube) return;

        // Стабилизация положения куба при движении устройства
        const acceleration = event.accelerationIncludingGravity;
        if (!acceleration) return;

        // Применяем небольшую корректировку позиции для компенсации тряски
        const stabilityFactor = 0.98;
        this.cube.position.x = THREE.MathUtils.lerp(
            this.cube.position.x,
            this.cube.position.x - acceleration.x * 0.001,
            stabilityFactor
        );
        this.cube.position.z = THREE.MathUtils.lerp(
            this.cube.position.z,
            this.cube.position.z - acceleration.z * 0.001,
            stabilityFactor
        );
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Обновляем поверхности
        this.updateSurfaces();

        // Плавное вращение куба
        if (this.cube) {
            this.cube.rotation.y += 0.01;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Инициализация при загрузке страницы
window.onload = () => {
    const ar = new ARCore(51.145929, 71.471594); // Ваши координаты
}; 