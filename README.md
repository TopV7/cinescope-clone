# CineScope - Кинотеатральный сервис

Микросервисное приложение для онлайн-кинотеатра с функцией покупки билетов.

## Архитектура проекта

```
cinescope-clone/
├── frontend/          # React приложение
├── backend/           # Микросервисы
│   ├── auth-service/     # Сервис аутентификации
│   ├── movies-service/   # Сервис фильмов
│   ├── payment-api/      # Шлюз оплаты
│   ├── payment-checker/  # Валидация карт
│   └── payment-registry/ # Реестр платежей
├── docker/            # Docker конфигурации
├── scripts/           # Скрипты развертывания
└── docs/              # Документация
```

## Технологии

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Базы данных**: PostgreSQL, MongoDB
- **Брокер сообщений**: Apache Kafka
- **Контейнеризация**: Docker, Kubernetes
- **CI/CD**: Jenkins
- **Мониторинг**: Kibana

## Микросервисы

1. **Auth Service** - аутентификация и авторизация пользователей
2. **Movies Service** - управление каталогом фильмов
3. **Payment API** - шлюз для приема платежей
4. **Payment Card Checker** - валидация платежных карт
5. **Payment Registry** - реестр транзакций

## Запуск проекта

```bash
# Запуск всех сервисов
docker-compose up -d

# Запуск frontend
cd frontend && npm start

# Запуск бэкенда
cd backend && docker-compose up
```

## Среды разработки

- **Dev**: dev.cinescope.store
- **Prod**: prod.cinescope.store
