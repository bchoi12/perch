
const { profanity, CensorType } = require('@2toad/profanity');

class ReqParser {

	constructor() {
		// base + password + hostVars + query
		this.numParams = 4;
	}

	valid(req) {
		if (!req || !req.url) {
			return false;
		}

		const url = req.url;
		const parts = url.split("/");

		if (parts.length < this.numParams + 1) {
		  return false;
		}
		if (parts[1] !== "peer") {
		  return false;
		}
		if (!parts[parts.length - 1].startsWith("peerjs")) {
		  return false;
		}
		return true;
	}

	parse(req) {
		let result = {
			password: "",

			host: false,
			public: false,
			maxPlayers: 0,

			name: "",
			id: "",
			token: "",
			latlng: "",
		}

		let url = req.url;
		if (!url) {
			console.error("Missing URL");
			return result;
		}

		// Ignore absurdly long requests
		if (url.length > 500) {
			console.error("URL too long", req.url);
			return result;
		}

		if (url.startsWith("/")) {
			url = url.slice(1);
		}

		const parts = url.split("/");
		if (parts.length !== this.numParams) {
			console.error("Invalid number of params", req.url);
			return result;
		}

		result.password = this.truncate(parts[1], 10);

		let decodedParams = decodeURIComponent(parts[2]);
		let hostParams = decodedParams.replace(/[^a-zA-Z0-9,!-\s*\[\]]/g, "").split("!");
		if (hostParams.length === 4) {
			result.host = true;
			result.public = hostParams[0] === "pub";
			const maxPlayers = Number(hostParams[1]);
			if (!Number.isNaN(maxPlayers)) {
				if (maxPlayers > 0) {
					result.maxPlayers = maxPlayers;
				}
			}
			result.name = profanity.censor(this.truncate(hostParams[2], 16));
			result.latlng = hostParams[3];
		} else {
			result.host = false;
		}

		const slug = parts[parts.length - 1];
		if (!slug.startsWith("peerjs")) {
			console.error("Malformed slug", req.url);
			return result;
		}

		const slugParts = slug.split(/\?(.*)/s);
		if (slugParts.length <= 1) {
			console.error("Missing query params", req.url);
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