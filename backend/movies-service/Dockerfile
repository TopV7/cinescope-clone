# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем curl для health checks
RUN apk add --no-cache curl

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --omit=dev

# Копируем исходный код
COPY src/ ./src/

# Копируем .env файл
COPY .env ./.env

# Открываем порт
EXPOSE 3002

# Запускаем приложение
CMD ["node", "src/index.js"]
