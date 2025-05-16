
class Database {

	constructor() {
		this.rooms = new Map();
		this.numPlayers = 0;
		this.json = {};

		this.currentHour = -1;
		this.hourlyRooms = new Map();
		this.hourlyPlayers = new Map();
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

	testJoin(roomId, result) {
		if (!this.hasRoom(roomId)) {
			return false;
		}

		return this.rooms.get(roomId).testJoin(result);
	}

	handle(result) {
		const [gameId, roomId, userId] = Database.parseId(result.id);

		if (result.room.length === 0) {
			console.error("Cannot add invalid client", client.getId());
			return false;
		}

		const hour = new Date().getHours();
		if (!this.hourlyRooms.has(hour) || this.currentHour !== hour) {
			this.hourlyRooms.set(hour, this.rooms.size);
		}
		if (!this.hourlyPlayers.has(hour) || this.currentHour != hour) {
			this.hourlyPlayers.set(hour, this.numPlayers);
		}
		this.currentHour = hour;

		let newRoom = false;
		if (!this.rooms.has(result.room)) {
			this.rooms.set(result.room, new Room(result.room, userId));
			newRoom = true;
		}

		const ok = this.rooms.get(result.room).handle(result);
		if (!ok) {
			return false;
		}
		this.numPlayers++;

		if (newRoom) {
			this.hourlyRooms.set(hour, this.hourlyRooms.get(hour) + 1);
		}
		this.hourlyPlayers.set(hour, this.hourlyPlayers.get(hour) + 1);

		this.updateJSON(result.room);
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

		this.numPlayers -= room.numPlayers - numPlayers;
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

		if (!this.rooms.has(roomId)) {
			return;
		}

		let room = this.rooms.get(roomId);
		room.removeClient(client);

		if (room.empty()) {
			this.removeRoom(roomId);
		} else {
			this.numPlayers--;
		}

		this.updateJSON(roomId);
	}
	checkRemoveRoom(roomId) {
		if (!this.rooms.has(roomId)) {
			return;
		}

		let room = this.rooms.get(roomId);
		if (room.empty()) {
			this.removeRoom(roomId);
		}
	}
	removeRoom(roomId) {
		if (!this.rooms.has(roomId)) {
			return;
		}

		let room = this.rooms.get(roomId);
		this.numPlayers -= room.numPlayers;
		this.rooms.delete(roomId);

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
		obj.n = room.name;
		if (room.password !== "") {
			obj.pw = 1;
		}
		obj.p = room.numPlayers;
		obj.m = room.maxPlayers;
		obj.l = room.latlng;
		obj.c = room.creationTime;
		obj.v = room.version;
		obj.t = room.hostToken;
	}

	roomJSON() {
		return this.json;
	}

	statsJSON() {
		return {
			games: this.rooms.size,
			players: this.numPlayers,
			hourlyGames: Object.fromEntries(this.hourlyRooms),
			hourlyPlayers: Object.fromEntries(this.hourlyPlayers),
		}
	}
}

class Room {

	constructor(roomId, hostId) {
		this.roomId = roomId;
		this.hostId = hostId;

		this.name = "Birdtown Game";
		this.hostToken = null;
		this.tokens = new Set();
		this.password = "";
		this.numPlayers = 0;
		this.maxPlayers = 0;
		this.public = false;
		this.latlng = "";
		this.version = "";

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

			this.name = result.name;
			this.public = result.public;
			this.hostToken = result.token;
			this.password = result.password;
			this.numPlayers = 1;
			this.maxPlayers = result.maxPlayers;
			this.latlng = result.latlng;
			this.version = result.version;
		} else {
			if (this.empty()) {
				console.error("Tried to join empty room:", result);
				return false;
			}
			if (this.full()) {
				console.error("Room is full:", result);
				return false;
			}
			if (!this.testJoin(result)) {
				console.error("Token exists or password is incorrect:", result);
				return false;
			}

			this.numPlayers++;
		}

		this.tokens.add(result.token);

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

	testJoin(result) {
		if (this.tokens.has(result.token)) {
			return false;
		}
		if (this.full()) {
			return false;
		}
		if (this.password === "") {
			return true;
		}
		return this.password === result.password;
	}
}

module.exports = { Database, Room };