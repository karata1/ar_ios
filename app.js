window.onload = () => {
    // Удаляем загрузочный экран после инициализации
    let loader = document.querySelector('.arjs-loader');
    if (loader) {
        loader.remove();
    }

    // Добавляем обработчик для фиксации положения объекта
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