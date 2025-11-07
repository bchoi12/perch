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

Add a file `secret.js` with the following

```
export const turnApiKey = <API_KEY>
export const turnToken = <TURN_TOKEN_ID>
export const turnPassword = <PERCH_PASSWORD>
```