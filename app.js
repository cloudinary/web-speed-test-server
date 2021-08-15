const config = require('config');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const logger = require('./logger').logger;
const app = express();
app.use(bodyParser.json());


//@for working with localhost
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  if ('OPTIONS' === req.method) {
    //respond with 200
    res.send(200);
  }
  else {
    //move on
    next();
  }
});

app.use(logger.errorHandler());

//app.use(bodyParser.urlencoded({ extended: false }));


const wpt = require('./routes/wpt');
wpt(app);


// catch 404 and forward to error handler
app.all('*', function (req, res) {
  res.send('what???', 404);
});

app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
});
const listenPort = process.env.PORT || 5000;

const server = http.createServer(app);
server.setTimeout(3 * 60 * 1000)
server.on('error', (e) => {
  console.log(e);
})

server.listen(listenPort, () => {
  logger.info('Server started listing on port ' + listenPort);
  console.log('Listening on port ' + listenPort);
});

