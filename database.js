
class Database {

	constructor() {
		this.rooms = new Map();
		this.json = {};
	}

	static parseId(id) {
		let parts = id.split("-");
		if (parts.length === 2) {
			return [parts[0], parts[1], ""];
		}
		if (parts.length === 3) {
			return [parts[0], parts[1], parts[2]];
		}
		return ["", "", ""];
	}

	hasRoom(roomId) {
		if (roomId === "") {
			return true;
		}
		return this.rooms.has(roomId);
	}

	testJoin(roomId, password) {
		if (!this.hasRoom(roomId)) {
			return false;
		}

		return this.rooms.get(roomId).testJoin(password);
	}

	handle(result) {
		const [gameId, roomId, userId] = Database.parseId(result.id);

		if (roomId.length === 0) {
			console.error("Cannot add invalid client", client.getId());
			return false;
		}

		if (!this.rooms.has(roomId)) {
			this.rooms.set(roomId, new Room(roomId, userId));
		}

		const ok = this.rooms.get(roomId).handle(result);
		if (!ok) {
			return false;
		}

		this.updateJSON(roomId);
		return true;
	}

	updatePlayers(id, token, numPlayers) {
		const [gameId, roomId, userId] = Database.parseId(id);

		if (!this.hasRoom(roomId)) {
			return false;
		}

		let room = this.rooms.get(roomId);
		if (token !== room.hostToken) {
			return false;
		}

		room.setNumPlayers(numPlayers);
		this.updateJSON(roomId);
		return true;
	}

	removeClient(client) {
		const [gameId, roomId, userId] = Database.parseId(client.getId());

		if (roomId.length === 0) {
			console.error("Cannot remove invalid client", client.getId());
			return;
		}

		if (this.rooms.has(roomId)) {
			let room = this.rooms.get(roomId);
			room.removeClient(client);

			if (room.empty()) {
				this.rooms.delete(roomId);
			}
		}

		this.updateJSON(roomId);
	}

	updateJSON(roomId) {
		if (!this.rooms.has(roomId)) {
			delete this.json[roomId];
			return;
		}

		const room = this.rooms.get(roomId);
		if (room.empty() || !room.public) {
			delete this.json[roomId];
			return;
		}

		if (!this.json.hasOwnProperty(roomId)) {
			this.json[roomId] = {};
		}

		let obj = this.json[roomId];
		obj.p = room.numPlayers;
		obj.m = room.maxPlayers;
		obj.r = room.region;
		obj.c = room.creationTime;
	}

	roomJSON() {
		return this.json;
	}
}

class Room {

	constructor(roomId, hostId) {
		this.roomId = roomId;
		this.hostId = hostId;

		this.hostToken = null;
		this.password = "";
		this.numPlayers = 0;
		this.maxPlayers = 0;
		this.public = false;
		this.region = "";

		this.creationTime = Date.now();
	}

	id() { return this.roomId; }
	hostId() { return this.hostId; }

	full() { return this.numPlayers >= this.maxPlayers; }
	empty() { return this.numPlayers === 0 || this.hostToken === null; }

	handle(result) {
		if (result.host) {
			if (this.hostToken !== null) {
				console.error("Tried to rehost existing room:", this.hostToken, result);
				return false;
			}

			this.public = result.public;
			this.hostToken = result.token;
			this.password = result.password;
			this.numPlayers = 1;
			this.maxPlayers = result.maxPlayers;
			this.region = result.region;
		} else {
			if (this.empty()) {
				console.error("Tried to join empty room:", result);
				return false;
			}
			if (this.full() || !this.testJoin(result.password)) {
				return false;
			}

			this.numPlayers++;
		}

		return true;
	}

	setNumPlayers(numPlayers) {
		this.numPlayers = numPlayers;
	}

	removeClient(client) {
		if (client.getToken() === this.hostToken) {
			this.hostToken = null;
		}
	}

	testJoin(password) {
		if (this.full()) {
			return false;
		}
		if (this.password === "") {
			return true;
		}
		return this.password === password;
	}
}

module.exports = { Database, Room };