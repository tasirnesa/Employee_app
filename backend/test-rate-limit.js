const http = require('http');

const performRequest = (i) => {
  return new Promise((resolve) => {
    const data = JSON.stringify({ username: "wrong", password: "wrong" });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Request ${i}: Status ${res.statusCode}, Body: ${body.substring(0, 50)}`);
        resolve();
      });
    });
    req.write(data);
    req.end();
  });
};

(async () => {
  for (let i = 1; i <= 10; i++) {
    await performRequest(i);
  }
})();
