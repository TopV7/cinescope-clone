# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем curl для health checks
RUN apk add --no-cache curl

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json
COPY package.json ./

# Устанавливаем все зависимости (включая jest для тестов)
RUN npm install

# Копируем исходный код
COPY src/ ./src/

# Копируем тесты
COPY tests/ ./tests/

# Открываем порт
EXPOSE 3003

# Запускаем приложение
CMD ["node", "src/index.js"]
