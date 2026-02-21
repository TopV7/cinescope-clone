import { describe, it, before, after } from 'node:test';
import assert from 'assert';
import http from 'http';

// Базовый URL для тестов
const BASE_URL = 'http://localhost';

// Вспомогательная функция для HTTP запросов
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 80,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

describe('Интеграционные тесты API Gateway', () => {
  before(async () => {
    console.log('🧪 Начинаем интеграционные тесты...');
    // Ждем запуска всех сервисов
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  it('Health check должен работать', async () => {
    const response = await makeRequest({
      path: '/health',
      method: 'GET'
    });

    assert.strictEqual(response.statusCode, 200, 'Health check должен вернуть 200');
    
    const body = JSON.parse(response.body);
    assert.strictEqual(body.status, 'OK', 'Статус должен быть OK');
    assert.strictEqual(body.service, 'api-gateway', 'Сервис должен быть api-gateway');
    
    console.log('✅ Health check работает');
  });

  it('POST запрос на /api/auth/login должен проксироваться', async () => {
    const loginData = JSON.stringify({
      email: 'admin@cinescope.com',
      password: 'admin123'
    });

    const response = await makeRequest({
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      },
      body: loginData
    });

    console.log(`📊 Статус ответа: ${response.statusCode}`);
    console.log(`📊 Заголовки:`, response.headers);
    console.log(`📊 Тело ответа:`, response.body);

    // Проверяем, что запрос дошел до Gateway (не 404 от Nginx)
    assert.notStrictEqual(response.statusCode, 404, 'Запрос не должен возвращать 404');
    
    // Проверяем, что это не HTML ошибка
    const contentType = response.headers['content-type'] || '';
    assert.ok(contentType.includes('application/json'), 'Ответ должен быть JSON, не HTML');
    
    console.log('✅ POST запрос на /api/auth/login успешно проксирован');
  });

  it('GET запрос на /api/movies должен проксироваться', async () => {
    const response = await makeRequest({
      path: '/api/movies',
      method: 'GET'
    });

    console.log(`📊 Статус ответа: ${response.statusCode}`);
    console.log(`📊 Заголовки:`, response.headers);

    // Проверяем, что запрос дошел до Gateway
    assert.notStrictEqual(response.statusCode, 404, 'Запрос не должен возвращать 404');
    
    console.log('✅ GET запрос на /api/movies успешно проксирован');
  });

  it('Прямой запрос к Gateway должен работать', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/health',
      method: 'GET'
    });

    assert.strictEqual(response.statusCode, 200, 'Прямой доступ к Gateway должен работать');
    
    const body = JSON.parse(response.body);
    assert.strictEqual(body.service, 'api-gateway', 'Должен быть ответ от Gateway');
    
    console.log('✅ Прямой доступ к API Gateway работает');
  });

  after(() => {
    console.log('🏁 Интеграционные тесты завершены');
  });
});
