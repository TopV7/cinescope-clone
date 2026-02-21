import http from 'http';

// Тестируем разные URL
const testUrls = [
  '/api/auth/login',
  '/api/auth/register', 
  '/api/movies',
  '/api/unknown'
];

async function testUrl(url) {
  console.log(`\n🧪 Тестируем URL: ${url}`);
  
  const loginData = JSON.stringify({
    email: 'admin@cinescope.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 80,
    path: url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  if (url === '/api/movies' || url === '/api/unknown') {
    options.method = 'GET';
    delete options.headers['Content-Type'];
    delete options.headers['Content-Length'];
  }

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 Статус: ${res.statusCode}`);
        console.log(`📊 Content-Type: ${res.headers['content-type'] || 'не указан'}`);
        console.log(`📊 Тело (первые 100 символов): ${data.substring(0, 100)}...`);
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Ошибка: ${err.message}`);
      resolve({ error: err.message });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function main() {
  console.log('🔍 === ОТЛАДКА URL ===');
  
  for (const url of testUrls) {
    await testUrl(url);
    await new Promise(resolve => setTimeout(resolve, 500)); // Небольшая пауза
  }
  
  console.log('\n🏁 Тестирование завершено');
}

main().catch(console.error);
