# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем curl для health checks
RUN apk add --no-cache curl

# Устанавливаем рабочую директорию
WORKDIR /app

# Создаем директорию для логов
RUN mkdir -p /app/logs

# Копируем package.json и package-lock.json для воспроизводимой установки
COPY package.json package-lock.json ./

# Устанавливаем все зависимости (prod + dev), чтобы внутри контейнера были jest/supertest для тестов
RUN npm ci

# Копируем исходный код
COPY src/ ./src/

# Копируем тесты
COPY tests/ ./tests/

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["node", "src/index.js"]
