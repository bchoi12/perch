
class ReqParser {

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
		console.log(url);
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
		if (parts.length < 4) {
			return result;
		}

		result.password = truncate(parts[1], 10);
		const maxPlayers = Number(parts[2]);
		if (!Number.isNaN(maxPlayers)) {
			if (maxPlayers > 0) {
				result.maxPlayers = maxPlayers;
				result.host = true;
			} else {
				result.host = false;
			}
		}

		const slug = parts[parts.length - 1];
		if (!slug.startsWith("peerjs")) {
			return result;
		}

		const slugParts = slug.split("?");
		if (slugParts.length <= 1) {
			return result;
		}
		const query = slugParts[1];
		const pairs = query.split("&");

		pairs.forEach((pair) => {
			const values = pair.split("=");
			if (values.length !== 2) {
				return;
			}

			if (values[0] === "id") {
				result.id = values[1];
			} else if (values[0] === "token") {
				result.token = values[1];
			}
		});
		return result;
	}

	truncate(str, len) {
		return str.substring(0, len);
	}
}

module.exports = { ReqParser };