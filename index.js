const express = require("express");
const { ExpressPeerServer } = require("peer");
const { WebSocketServer } = require("ws");
const { ConnectionParser } = require("./connection_parser.js");
const { Database, Room } = require ("./database.js");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res, next) => res.send("Hello world!"));

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});

const database = new Database();
const parser = new ConnectionParser();

const wssShouldHandle = (req) => {
  if (!req || !req.url) {
    console.error("Null request");
    return false;
  }

  const result = parser.parse(req.url);
  if (result.room === "") {
    return false;
  }

  const [gameId, roomId, userId] = Database.parseId(client.getId());
  if (result.host) {
    if (result.maxPlayers <= 0) {
      return false;
    }
    if (database.hasRoom(roomId)) {
      return false;
    }
  } else {
    if (!database.hasRoom(roomId)) {
      return false;
    }
    if (!database.testJoin(result.room, result.password)) {
      return false;
    }
  }

  return true;
}
const createWebSocketServer = (options) => {
  const wss = new WebSocketServer(options);

  wss.shouldHandle = wssShouldHandle;

  wss.on("connection", (socket, req) => {
    if (!req || !req.url) {
      socket.close();
      return;
    }

    const result = parser.parse(req.url);
    const ok = database.handle(result);

    if (!ok) {
      socket.close();
    }
  });

  wss.on("connection", (socket, req) => {
    socket.on("message", (data) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const message = JSON.parse(data.toString());
        console.log(message);
      } catch (e) {
        this.emit("error", e);
      }
    });
  });
  return wss;
};

const peerServer = ExpressPeerServer(server, {
  allow_discovery: false,
  path: "/",
  createWebSocketServer: (options) => {
    // https://github.com/websockets/ws/blob/master/lib/websocket-server.js
    let wss = new WebSocketServer({
      ...options,
      createWebSocketServer: createWebSocketServer,
    });
    return wss;
  },
});
peerServer.on('connection', (client) => {
  database.addClient(client);
});
peerServer.on('disconnect', (client) => {
  database.removeClient(client);
});
app.use("/peer/:pw", peerServer);
app.get("/rooms", (req, res, next) => {
  res.send(database.roomJSON());
});

// TODO: also need way to update room metadata (update only, no put)