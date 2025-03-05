window.onload = () => {
    // Удаляем загрузочный экран после инициализации
    let loader = document.querySelector('.arjs-loader');
    if (loader) {
        loader.remove();
    }

    // Запрашиваем разрешение на использование геолокации
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            // Получаем текущие координаты
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Находим тестовый куб
            let testCube = document.querySelector('#test-cube');
            
            // Устанавливаем координаты куба
            testCube.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude};`);
            
            // Добавляем обработчик события для отслеживания загрузки модели
            testCube.addEventListener('loaded', () => {
                window.dispatchEvent(new CustomEvent('gps-entity-place-loaded'));
            });
        });
    } else {
        console.error("Геолокация не поддерживается в вашем браузере");
    }

    // Добавляем обработчик для фиксации положения объекта
    AFRAME.registerComponent('gps-entity-place', {
        schema: {
            latitude: {
                type: 'number',
                default: 0,
            },
            longitude: {
                type: 'number',
                default: 0,
            }
        },
        
        init: function() {
            // Фиксируем начальное положение объекта
            this.originalPosition = this.el.object3D.position.clone();
            
            this.el.addEventListener('componentchanged', (evt) => {
                if (evt.detail.name === 'position') {
                    // Возвращаем объект в исходное положение
                    this.el.object3D.position.copy(this.originalPosition);
                }
            });
        },
        
        update: function() {
            // Сохраняем новое положение при обновлении координат
            this.originalPosition = this.el.object3D.position.clone();
        }
    });
}; 