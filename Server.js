/* eslint-disable no-console */
import http from 'http';
import express from 'express';
import { join } from 'path';
import {bookingWorker, bookingNotificationsWorker} from "./task"


const normalizePort = (val) => {
  const port = parseInt(val, 10);

  if (typeof (port) !== 'number') {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};


bookingWorker()
bookingNotificationsWorker()

const app = express()

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

//static files
app.use(express.static(__dirname + '/build'));
app.get("/*", (req, res)=> {
  res.sendFile('index.html', { root: join(__dirname, "/build") });     
});

const server = http.createServer(app);
const address = server.address();

const errorHandler = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof address === 'string' ? `pipe  ${address}` : `port: ${port}`;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges.`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use.`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

server.on('error', errorHandler);
server.on('listening', () => {
  const bind = typeof address === 'string' ? `pipe ${address}` : `port ${port}`;
  console.log(`Listening on ${bind}`);
});

server.listen(port);
