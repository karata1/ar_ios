class GPSManager {
    constructor() {
        this.currentPosition = null;
        this.targetPosition = null;
        this.heading = 0;
        this.listeners = new Set();
        this.kalmanFilter = new PositionKalmanFilter();
    }

    init(targetLatitude, targetLongitude) {
        this.targetPosition = {
            latitude: targetLatitude,
            longitude: targetLongitude
        };

        // Запрашиваем разрешение на использование датчиков
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        this.startOrientationTracking();
                    }
                })
                .catch(console.error);
        } else {
            this.startOrientationTracking();
        }

        // Запускаем отслеживание GPS
        this.startGPSTracking();
    }

    startOrientationTracking() {
        window.addEventListener('deviceorientation', (event) => {
            if (event.webkitCompassHeading) {
                this.heading = event.webkitCompassHeading;
            } else if (event.alpha) {
                this.heading = 360 - event.alpha;
            }
            this.notifyListeners();
        });
    }

    startGPSTracking() {
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(
                (position) => {
                    this.currentPosition = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    this.notifyListeners();
                },
                (error) => {
                    console.error('GPS Error:', error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 27000
                }
            );
        }
    }

    calculateDistance() {
        if (!this.currentPosition || !this.targetPosition) return null;

        const R = 6371e3; // радиус Земли в метрах
        const φ1 = this.currentPosition.latitude * Math.PI/180;
        const φ2 = this.targetPosition.latitude * Math.PI/180;
        const Δφ = (this.targetPosition.latitude - this.currentPosition.latitude) * Math.PI/180;
        const Δλ = (this.targetPosition.longitude - this.currentPosition.longitude) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // расстояние в метрах
    }

    calculateBearing() {
        if (!this.currentPosition || !this.targetPosition) return null;

        const φ1 = this.currentPosition.latitude * Math.PI/180;
        const φ2 = this.targetPosition.latitude * Math.PI/180;
        const λ1 = this.currentPosition.longitude * Math.PI/180;
        const λ2 = this.targetPosition.longitude * Math.PI/180;

        const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
                Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

        let bearing = Math.atan2(y, x) * 180/Math.PI;
        bearing = (bearing + 360) % 360;

        return bearing;
    }

    calculateRelativePosition() {
        const distance = this.calculateDistance();
        const bearing = this.calculateBearing();
        
        if (distance === null || bearing === null) return null;

        // Конвертируем полярные координаты в декартовы
        const x = distance * Math.sin(bearing * Math.PI/180);
        const z = distance * Math.cos(bearing * Math.PI/180);
        
        // Применяем фильтр Калмана
        return this.kalmanFilter.update({
            x: x,
            y: 0, // Высота будет определяться детектором поверхности
            z: z
        });
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        const data = {
            position: this.currentPosition,
            heading: this.heading,
            distance: this.calculateDistance(),
            bearing: this.calculateBearing(),
            relativePosition: this.calculateRelativePosition()
        };

        this.listeners.forEach(callback => callback(data));
    }
} 