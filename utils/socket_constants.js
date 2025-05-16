// src/constants/socket_constants.ts

// Socket server URL - replace with your actual server URL
// export const SOCKET_SERVER_URL = 'https://server.oorbis.top';
export const SOCKET_SERVER_URL = 'http://localhost:5000';

// Socket events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  ORDER_CREATED: 'order_created',
};

// Socket options
export const SOCKET_OPTIONS = {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true,
};