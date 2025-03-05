class SurfaceDetector {
    constructor() {
        this.initialized = false;
        this.surfacePoints = [];
        this.lastUpdate = 0;
        this.updateInterval = 100; // мс между обновлениями
    }

    async init() {
        try {
            // Инициализация детектора поверхностей
            this.initialized = true;
            console.log('Surface detector initialized');
        } catch (error) {
            console.error('Failed to initialize surface detector:', error);
        }
    }

    async detectSurface(video) {
        if (!this.initialized) return null;
        
        const now = Date.now();
        if (now - this.lastUpdate < this.updateInterval) {
            return this.surfacePoints;
        }
        
        try {
            // Получаем данные с видео
            const imageData = this.getImageData(video);
            
            // Находим поверхности через анализ глубины и контраста
            const surfaces = await this.analyzeSurfaces(imageData);
            
            this.surfacePoints = surfaces;
            this.lastUpdate = now;
            
            return surfaces;
        } catch (error) {
            console.error('Surface detection error:', error);
            return null;
        }
    }

    getImageData(video) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    async analyzeSurfaces(imageData) {
        // Упрощенный алгоритм определения поверхностей
        // В реальном приложении здесь будет более сложная логика
        const surfaces = [];
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Анализ контраста и яркости для определения поверхностей
        for (let y = 0; y < height; y += 10) {
            for (let x = 0; x < width; x += 10) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                
                if (this.isSurfacePoint(brightness, x, y, data, width)) {
                    surfaces.push({
                        x: (x / width) * 2 - 1,
                        y: (y / height) * 2 - 1,
                        z: brightness / 255
                    });
                }
            }
        }
        
        return this.filterAndSmoothSurfaces(surfaces);
    }

    isSurfacePoint(brightness, x, y, data, width) {
        // Простая эвристика для определения точек поверхности
        const threshold = 30;
        const idx = (y * width + x) * 4;
        
        // Проверяем разницу яркости с соседними пикселями
        if (x > 0 && y > 0) {
            const leftIdx = (y * width + (x - 1)) * 4;
            const topIdx = ((y - 1) * width + x) * 4;
            const leftBrightness = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
            const topBrightness = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
            
            return Math.abs(brightness - leftBrightness) > threshold ||
                   Math.abs(brightness - topBrightness) > threshold;
        }
        
        return false;
    }

    filterAndSmoothSurfaces(surfaces) {
        // Фильтрация шума и сглаживание поверхностей
        const filtered = surfaces.filter(point => {
            // Удаляем явно выбивающиеся точки
            return point.z > 0.1 && point.z < 0.9;
        });
        
        // Сглаживание через усреднение с соседними точками
        return filtered.map(point => {
            const neighbors = this.findNeighbors(point, filtered);
            return {
                x: this.average(neighbors.map(n => n.x)),
                y: this.average(neighbors.map(n => n.y)),
                z: this.average(neighbors.map(n => n.z))
            };
        });
    }

    findNeighbors(point, points, radius = 0.1) {
        return points.filter(p => 
            Math.sqrt(
                Math.pow(p.x - point.x, 2) +
                Math.pow(p.y - point.y, 2)
            ) < radius
        );
    }

    average(values) {
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
} 