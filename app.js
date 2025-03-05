window.onload = () => {
    const debug = document.querySelector('#debug');

    // Функция для обновления отладочной информации
    function updateDebugInfo(info) {
        debug.textContent = JSON.stringify(info, null, 2);
    }

    // Удаляем загрузочный экран после инициализации
    let loader = document.querySelector('.arjs-loader');
    
    // Проверяем геолокацию
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(function(position) {
            const currentCoords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            updateDebugInfo({
                userLocation: currentCoords,
                targetLocation: {
                    latitude: 51.145939,
                    longitude: 71.471574
                },
                distance: calculateDistance(
                    currentCoords.latitude,
                    currentCoords.longitude,
                    51.145939,
                    71.471574
                )
            });
        }, function(error) {
            updateDebugInfo({
                error: 'Ошибка получения геолокации: ' + error.message
            });
        }, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 27000
        });
    }

    // Функция для расчета расстояния между координатами
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // радиус Земли в метрах
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return (R * c).toFixed(2) + ' meters'; // расстояние в метрах
    }

    // Ждем загрузки сцены
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', function () {
        updateDebugInfo({
            status: 'Сцена загружена'
        });
        if (loader) {
            loader.remove();
        }
    });

    // Обработчик ошибок
    scene.addEventListener('arjs-video-error', function() {
        updateDebugInfo({
            error: 'Ошибка инициализации видео AR'
        });
    });

    // Обработчик успешной инициализации видео
    scene.addEventListener('arjs-video-loaded', function() {
        updateDebugInfo({
            status: 'Видео AR загружено'
        });
    });

    // Обработчик для камеры
    const camera = document.querySelector('[gps-camera]');
    camera.addEventListener('gps-camera-update-position', function(event) {
        updateDebugInfo({
            cameraPosition: event.detail,
            status: 'Позиция камеры обновлена'
        });
    });

    // Обработчик для AR объекта
    const box = document.querySelector('a-box');
    box.addEventListener('loaded', function() {
        updateDebugInfo({
            status: 'AR объект загружен'
        });
    });

    // Обработчики событий AR
    window.addEventListener('camera-init', (e) => {
        updateDebugInfo({
            event: 'camera-init',
            status: 'Камера инициализирована'
        });
    });

    window.addEventListener('camera-error', (e) => {
        updateDebugInfo({
            event: 'camera-error',
            error: e
        });
    });

    // Регистрируем компонент
    AFRAME.registerComponent('gps-entity-place', {
        schema: {
            latitude: {
                type: 'number',
                default: 51.145939,
            },
            longitude: {
                type: 'number',
                default: 71.471574,
            },
            'static-tracking': {
                type: 'boolean',
                default: true
            }
        },
        
        init: function() {
            this.originalPosition = this.el.object3D.position.clone();
            
            // Добавляем обработчик события загрузки
            this.el.addEventListener('loaded', () => {
                updateDebugInfo({
                    msg: 'AR object loaded',
                    position: this.originalPosition
                });
            });
        },
        
        update: function() {
            this.originalPosition = this.el.object3D.position.clone();
        }
    });
}; 