# Perch

## Overview

Perch is a lightweight server for facilitating P2P connections through WebRTC. Players can directly connect to each other by sharing a URL or short room code.

Built with node.js, express.js, and peerjs-server.

## Features

In addition to peerjs-server features:
 * lobby system with public/private rooms
 * password protection
 * maximum player limits
 * room metadata (name, latlng)

 ## Dev Notes

/turn generates short-term credentials for using Cloudflare TURN server

Add a file `.env` with the following

```
TURN_API_KEY=<TURN_API_KEY>
TURN_TOKEN=<TURN_TOKEN>
TURN_PASSWORD=<TURN_PASSWORD>
```