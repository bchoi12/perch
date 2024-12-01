const express = require("express");
const { ExpressPeerServer } = require("peer");
const { Database, Room } = require ("./database.js");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res, next) => res.send("Hello world!"));

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});

const database = new Database();

const peerServer = ExpressPeerServer(server, {
  allow_discovery: true,
  path: "/",
});
peerServer.on('connection', (client) => {
  database.addClient(client);
});
peerServer.on('disconnect', (client) => {
  database.removeClient(client);
});

app.use("/peer", peerServer);
app.get("/rooms", (req, res, next) => {
  res.send(database.roomJSON());
});