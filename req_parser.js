
// const { lookup } = require('ip-location-api');

class ReqParser {

	constructor() {
		// base + password + hostVars + query
		this.numParams = 4;
	}

	valid(url) {
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

			id: "",
			token: "",
			region: "",
		}

		let url = req.url;
		if (!url) {
			return result;
		}

		if (url.startsWith("/")) {
			url = url.slice(1);
		}

		const parts = url.split("/");
		if (parts.length < this.numParams) {
			return result;
		}

		result.password = this.truncate(parts[1], 10);

		const hostParams = parts[2].split(",");
		if (hostParams.length >= 2) {
			result.host = true;
			result.public = hostParams[0] === "pub";
			const maxPlayers = Number(hostParams[1]);
			if (!Number.isNaN(maxPlayers)) {
				if (maxPlayers > 0) {
					result.maxPlayers = maxPlayers;
				}
			}
		} else {
			result.host = false;
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

		// Not working...
		/*
	    const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	    if (ip) {
		    const location = lookup(ip);
		    if (location && location.country) {
		    	result.region = location.country;
		    }
	    }
	    */

		return result;
	}

	truncate(str, len) {
		return str.substring(0, len);
	}
}

module.exports = { ReqParser };