window.onload = () => {
    const debug = document.querySelector('#debug');

    // Функция для обновления отладочной информации
    function updateDebugInfo(info) {
        debug.textContent = JSON.stringify(info);
    }

    // Удаляем загрузочный экран после инициализации
    let loader = document.querySelector('.arjs-loader');
    if (loader) {
        loader.remove();
    }

    // Проверяем геолокацию
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(function(position) {
            const currentCoords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            // Показываем текущие координаты
            updateDebugInfo({
                current: currentCoords,
                target: {
                    latitude: 51.146041,
                    longitude: 71.471613
                },
                distance: calculateDistance(
                    currentCoords.latitude,
                    currentCoords.longitude,
                    51.146041,
                    71.471613
                )
            });
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

    // Обработчик события для объектов AR
    window.addEventListener('gps-camera-update-position', e => {
        updateDebugInfo({
            ...e.detail,
            msg: 'camera updated'
        });
    });

    // Регистрируем компонент
    AFRAME.registerComponent('gps-entity-place', {
        schema: {
            latitude: {
                type: 'number',
                default: 51.146041,
            },
            longitude: {
                type: 'number',
                default: 71.471613,
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