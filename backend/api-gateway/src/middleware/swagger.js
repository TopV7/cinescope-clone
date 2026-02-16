import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Swagger конфигурация
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CineScope API Gateway',
      version: '1.0.0',
      description: 'API Gateway for CineScope microservices architecture',
      contact: {
        name: 'CineScope Team',
        email: 'support@cinescope.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            password: {
              type: 'string',
              description: 'User password'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        Movie: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Movie ID'
            },
            title: {
              type: 'string',
              description: 'Movie title'
            },
            description: {
              type: 'string',
              description: 'Movie description'
            },
            duration: {
              type: 'integer',
              description: 'Duration in minutes'
            },
            rating: {
              type: 'number',
              description: 'Movie rating'
            },
            genre: {
              type: 'string',
              description: 'Movie genre'
            },
            release_year: {
              type: 'integer',
              description: 'Release year'
            }
          }
        },
        Payment: {
          type: 'object',
          required: ['userId', 'amount'],
          properties: {
            id: {
              type: 'integer',
              description: 'Payment ID'
            },
            userId: {
              type: 'integer',
              description: 'User ID'
            },
            amount: {
              type: 'number',
              description: 'Payment amount'
            },
            currency: {
              type: 'string',
              description: 'Currency code'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded'],
              description: 'Payment status'
            },
            transactionId: {
              type: 'string',
              description: 'Transaction ID'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type'
            },
            message: {
              type: 'string',
              description: 'Error message'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication operations'
      },
      {
        name: 'Movies',
        description: 'Movie management operations'
      },
      {
        name: 'Payments',
        description: 'Payment processing operations'
      },
      {
        name: 'Gateway',
        description: 'API Gateway operations'
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Путь к файлам с документацией
};

// Создаем Swagger спецификацию
export const specs = swaggerJsdoc(swaggerOptions);

// Swagger UI опции
export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2563eb }
    .swagger-ui .scheme-container { background: #f8fafc }
  `,
  customSiteTitle: 'CineScope API Documentation'
};

// Middleware для Swagger
export const swaggerMiddleware = swaggerUi.serve;

// Настройка Swagger UI
export const swaggerSetup = swaggerUi.setup(specs, swaggerUiOptions);
