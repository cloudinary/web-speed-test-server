const http = require('http');
const logger = require('./logger').logger;
const app = require('./app');

const listenPort = process.env.PORT || 5000;

const server = http.createServer(app);
server.setTimeout(3 * 60 * 1000);
server.on('error', (e) => {
    console.log(e);
})

server.listen(listenPort, () => {
    logger.info('Server started listing on port ' + listenPort);
    console.log('Listening on port ' + listenPort);
});
