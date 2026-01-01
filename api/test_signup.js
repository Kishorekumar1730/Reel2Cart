const http = require('http');
const data = JSON.stringify({ email: 'test' + Date.now() + '@example.com' });
const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/signup',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};
const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Response:', body);
        process.exit(0);
    });
});
req.on('error', (e) => {
    console.error('Problem:', e);
    process.exit(1);
});
req.write(data);
req.end();
