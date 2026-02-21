# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем curl для health checks
RUN apk add --no-cache curl

# Устанавливаем рабочую директорию
WORKDIR /app

# Создаем директорию для логов
RUN mkdir -p /app/logs

# Копируем package.json
COPY package.json ./

# Устанавливаем зависимости
RUN npm install --omit=dev

# Копируем исходный код
COPY src/ ./src/

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["node", "src/index.js"]
