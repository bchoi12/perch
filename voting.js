
class Voting {
	
	constructor() {

		this.version = 0;
		this.question = "";
		this.answers = {};
	}

	ask(question) {
		this.version++;
		this.question = question;
		this.answers = {};
	}

	vote(version, name, answer) {
		if (this.version !== Number(version)) {
			return false;
		}

		if (this.answers.hasOwnProperty(answer)) {
			this.answers[answer].push(name);
		} else {
			this.answers[answer] = [name];
		}
		return true;
	}

	refresh(version) {
		if (Number(version) !== this.version) {
			return {
				question: this.question,
				version: this.version,
			}
		}

		return this.answers
	}
}

module.exports = { Voting };