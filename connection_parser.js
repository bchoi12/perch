
class ConnectionParser {

	constructor() {}

	valid(url) {
		const parts = url.split("/");

		if (parts.length < 4) {
		  return false;
		}
		if (parts[1] !== "peer") {
		  return false;
		}
		if (parts[2] === "") {
		  return false;
		}
		if (!parts[parts.length - 1].startsWith("peerjs")) {
		  return false;
		}
		return true;
	}

	parse(url) {
		let result = {
			host: false,
			maxPlayers: 0,
			password: "",
			id: "",
			token: "",
		}

		if (url.startsWith("/")) {
			url = url.slice(1);
		}

		const parts = url.split("/");
		if (parts.length < 2) {
			return result;
		}

		if (parts.length >= 2) {
			result.password = parts[1];
		}

		// Hosting
		if (parts.length >= 4) {
			result.host = true;

			const maxPlayers = Number(parts[2]);
			if (!Number.isNaN(maxPlayers)) {
				result.maxPlayers = maxPlayers;
			}
		}

		const slug = parts[parts.length - 1];
		if (!slug.startsWith("peerjs")) {
			return result;
		}

		slug = slug.slice(7);
		const pairs = slug.split("&");

		pairs.forEach((key, value) => {
			if (key === "id") {
				result.id = value;
			} else if (key === "token") {
				result.token = value;
			}
		});
		return result;
	}
}

module.exports = { ConnectionParser };