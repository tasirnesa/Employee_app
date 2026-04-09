const http = require('http');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const app = require('./app');
const socketService = require('./services/socketService');

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
socketService.init(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
