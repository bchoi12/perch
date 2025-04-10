const express = require("express");
const { ExpressPeerServer } = require("peer");
const { WebSocketServer } = require("ws");
const { Database, Room } = require ("./database.js");
const { ReqParser } = require("./req_parser.js");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res, next) => res.send("Hello world!"));

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});

const database = new Database();
const parser = new ReqParser();

const wssShouldHandle = (req) => {
  if (!req || !req.url) {
    console.error("Null request");
    return false;
  }

  const result = parser.parse(req.url);
  const [gameId, roomId, userId] = Database.parseId(result.id);

  console.log(result);

  if (roomId === "") {
    return false;
  }
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
    if (!database.testJoin(roomId, result.password)) {
      return false;
    }
  }
  return true;
}
const createWebSocketServer = (options) => {
  const wss = new WebSocketServer(options);
  console.log("Initialize WebSocketServer");

  wss.shouldHandle = wssShouldHandle;

  wss.on("connection", (socket, req) => {
    if (!req || !req.url) {
      socket.close();
      return;
    }

    const result = parser.parse(req.url);
    const ok = database.handle(result);

    if (!ok) {
      console.error("Failed to handle result", result);
      socket.close();
    }

    /*
    socket.on("message", (data) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const message = JSON.parse(data.toString());
        console.log(message);
      } catch (e) {
        this.emit("error", e);
      }
    });
    */
  });
  return wss;
};

const peerServer = ExpressPeerServer(server, {
  allow_discovery: false,
  path: "/",
  // https://github.com/websockets/ws/blob/master/lib/websocket-server.js
  createWebSocketServer: createWebSocketServer,
});
peerServer.on('disconnect', (client) => {
  database.removeClient(client);
});

// base + password + max players (0 if client)
app.use("/peer/:pw/:p", peerServer);
app.get("/rooms", (req, res) => {
  res.send(database.roomJSON());
});

// update num players, id used for verification
app.put("/room", (req, res) => {
  if (!req.query || !req.query.id || !req.query.p) {
    return;
  }
  database.updatePlayers(req.query.id, req.query.p);
});