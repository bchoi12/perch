const express = require("express");
const cors = require("cors");
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
let origins = [
  "http://bchoi12.itch.io",
  "https://bchoi12.itch.io",
  "http://birdtown.net",
  "https://birdtown.net",
  "http://brianchoi.net",
  "https://brianchoi.net",
  "http://1351422251404365835.discordsays.com",
  "https://1351422251404365835.discordsays.com",
];
const isDev = process.env.NODE_ENV === "development";

if (isDev) {
  console.log("Allowing localhost:8080 origin");
  origins.push("http://localhost:8080");
}
const corsOptions = {
  origin: origins,
}

const wssShouldHandle = (req) => {
  if (!req || !req.url) {
    console.error("Null request");
    return false;
  }

  const result = parser.parse(req);
  if (!result.valid) {
    console.error("Invalid result", result);
    return false;
  }

  if (result.room === "") {
    console.error("Empty room", result);
    return false;
  }
  if (result.host) {
    if (result.maxPlayers <= 0) {
      console.error("Invalid max", result);
      return false;
    }
    if (database.hasRoom(result.room)) {
      console.error("Room exists", result);
      return false;
    }
  } else {
    if (!database.hasRoom(result.room)) {
      console.error("Room does not exist", result);
      return false;
    }
    if (!database.testJoin(result.room, result)) {
      console.error("Cannot join", result);
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

    const result = parser.parse(req);
    if (!result.valid) {
      console.error("Invalid result", result);
      return false;
    }

    const ok = database.handle(result);
    if (!ok) {
      socket.close();
      return;
    }
    console.log("Handled request", req.url, result);
    socket.on("close", () => {
      database.removeRoom(result.room);
    });
  });
  return wss;
};

const peerServer = ExpressPeerServer(server, {
  allow_discovery: false,
  path: "/",
  // https://github.com/websockets/ws/blob/master/lib/websocket-server.js
  createWebSocketServer: createWebSocketServer,
  corsOptions: corsOptions,
  concurrentLimit: 5000,
  proxied: !isDev,
});
peerServer.on('disconnect', (client) => {
  database.removeClient(client);
});

app.use(cors(corsOptions));

// room + password + host params
app.use("/peer/:room/:pw/:params", peerServer);
app.get("/rooms", (req, res) => {
  res.send(database.roomJSON());
});
app.get("/stats", (req, res) => {
  res.send(database.statsJSON());
});

// update num players, token used for verification
app.put("/room", (req, res) => {
  if (!req.query || !req.query.id || !req.query.t || !req.query.p) {
    res.sendStatus(400);
    return;
  }
  const numPlayers = Number(req.query.p);
  if (Number.isNaN(numPlayers) || numPlayers < 0) {
    res.sendStatus(400);
    return;
  }

  if (!database.updatePlayers(req.query.id, req.query.t, numPlayers)) {
    res.sendStatus(400);
    return;
  }
  res.sendStatus(200);
});