class KalmanFilter {
    constructor() {
        this.Q = 0.005;  // Шум процесса
        this.R = 0.1;    // Шум измерений
        this.P = 1.0;    // Оценка ошибки
        this.X = 0.0;    // Значение
        this.K = 0.0;    // Усиление Калмана
    }

    update(measurement) {
        // Предсказание
        this.K = this.P / (this.P + this.R);
        
        // Обновление
        this.X = this.X + this.K * (measurement - this.X);
        this.P = (1 - this.K) * this.P + this.Q;
        
        return this.X;
    }

    reset() {
        this.P = 1.0;
        this.X = 0.0;
        this.K = 0.0;
    }
}

class PositionKalmanFilter {
    constructor() {
        this.x = new KalmanFilter();
        this.y = new KalmanFilter();
        this.z = new KalmanFilter();
    }

    update(position) {
        return {
            x: this.x.update(position.x),
            y: this.y.update(position.y),
            z: this.z.update(position.z)
        };
    }

    reset() {
        this.x.reset();
        this.y.reset();
        this.z.reset();
    }
} 