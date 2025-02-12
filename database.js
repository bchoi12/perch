
class Database {

	constructor() {
		this.rooms = new Map();
		this.json = {};
	}

	addClient(client) {
		const [gameId, roomId, userId] = this.parseId(client.getId());

		if (roomId.length === 0) {
			console.error("Cannot add invalid client", client.getId());
			return;
		}

		if (!this.rooms.has(roomId)) {
			this.rooms.set(roomId, new Room(roomId));
		}

		this.rooms.get(roomId).addClient(client);

		this.updateJSON(gameId, roomId, userId);
	}

	removeClient(client) {
		const [gameId, roomId, userId] = this.parseId(client.getId());

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

		this.updateJSON(gameId, roomId, userId);
	}

	parseId(id) {
		let parts = id.split("-");
		if (parts.length === 2) {
			return [parts[0], parts[1], ""];
		}
		if (parts.length === 3) {
			return [parts[0], parts[1], parts[2]];
		}
		return ["", "", ""];
	}

	updateJSON(gameId, roomId, userId) {
		if (!this.rooms.has(roomId) || this.rooms.get(roomId).empty()) {
			delete this.json[roomId];
			return;
		}

		if (!this.json.hasOwnProperty(roomId)) {
			this.json[roomId] = {};
		}

		let obj = this.json[roomId];
		const room = this.rooms.get(roomId);
		obj.p = room.size();
	}

	roomJSON() {
		return this.json;
	}
}

class Room {

	constructor(id) {
		this.id = id;
		this.clients = new Map();
		this.hostToken = null;
	}

	size() { return this.clients.size; }
	empty() { return this.clients.size === 0 || this.hostToken === null; }

	addClient(client) {
		this.clients.set(client.getToken(), client);

		if (this.hostToken === null) {
			this.hostToken = client.getToken();
		}
	}

	removeClient(client) {
		this.clients.delete(client.getToken());

		if (client.getToken() === this.hostToken) {
			this.hostToken = null;
		}
	}
}

module.exports = { Database, Room };