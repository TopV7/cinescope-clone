# CineScope - Кинотеатральный сервис

Микросервисное приложение для онлайн-кинотеатра с функцией покупки билетов.

## Архитектура проекта

```
cinescope-clone/
├── frontend/          # React приложение (Vite, TypeScript, TailwindCSS)
├── backend/           # Микросервисы на Node.js
│   ├── api-gateway/      # API Gateway для маршрутизации запросов
│   ├── auth-service/     # Сервис аутентификации пользователей
│   ├── movies-service/   # Сервис управления каталогом фильмов
│   └── payment-service/  # Сервис обработки платежей
├── docker/            # Docker конфигурации
├── scripts/           # Скрипты развертывания
├── docs/              # Документация
└── nginx/             # Nginx конфигурация для фронтенда
```

## Технологии

- **Frontend**: React 19, TypeScript, TailwindCSS, Vite
- **Backend**: Node.js, Express 5, PostgreSQL, JWT, bcrypt
- **Брокер сообщений**: (планируется Kafka)
- **Контейнеризация**: Docker, Docker Compose
- **CI/CD**: (планируется Jenkins)
- **Мониторинг**: (планируется Kibana)
- **Тестирование**: Jest, Supertest

## Микросервисы

1. **API Gateway** - центральный шлюз для всех запросов, маршрутизация, аутентификация между сервисами
2. **Auth Service** - регистрация, вход, управление пользователями, JWT токены
3. **Movies Service** - каталог фильмов, поиск, жанры, сеансы
4. **Payment Service** - обработка платежей, валидация карт, комиссии, возвраты

## Безопасность

- JWT аутентификация для пользователей
- Межсервисная аутентификация с внутренними JWT токенами
- Шифрование чувствительных данных (AES-256)
- Валидация переменных окружения
- Rate limiting
- CORS защита
- Helmet для безопасности заголовков

## Запуск проекта

### Локальная разработка

1. Установите переменные окружения в .env файлах для каждого сервиса (копируйте из .env.example)
2. Запустите сервисы:
   ```bash
   # Все сервисы одновременно
   npm run dev

   # Или по отдельности
   cd backend/auth-service && npm run dev
   cd backend/movies-service && npm run dev
   cd backend/payment-service && npm run dev
   cd backend/api-gateway && npm run dev
   cd frontend && npm run dev
   ```

### Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Запуск frontend
cd frontend && npm start

# Запуск бэкенда
cd backend && docker-compose up
```

## API Документация

Swagger документация доступна по адресу: http://localhost:8080/api-docs

## Тестирование

```bash
# Запуск тестов для каждого сервиса
cd backend/auth-service && npm test
cd backend/movies-service && npm test
cd backend/payment-service && npm test
```

## Переменные окружения

Каждый сервис требует настройки переменных окружения. Смотрите .env.example файлы.

Обязательные переменные:
- JWT секреты (не используйте дефолтные в продакшене)
- Ключи шифрования
- Настройки базы данных PostgreSQL
- URL сервисов

## База данных

Проект использует PostgreSQL. Схемы инициализируются автоматически при запуске через Docker или вручную.

## Развертывание

Проект настроен для развертывания с Docker и Kubernetes (планируется).

## Разработка

- Код стилизован с ESLint
- Используются ES модули
- Аутентификация между сервисами через JWT
- Шифрование чувствительных данных
- Валидация входных данных

## Лицензия

ISC
