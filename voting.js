
class Voter {

	constructor(name) {
		this._name = name;
		this._answer = "";
		this._version = 0;
		this._score = 0;
		this._bonus = 0;
	}

	name() {
		return this._name;
	}

	setBonus(bonus) {
		this._bonus = bonus;
	}
	addPoint() {
		this._score++;
		this._score += this._bonus;
		this._bonus = 0;
	}
	score() { 
		return this._score;
	}

	answer() { return this._answer; }
	setAnswer(answer, version) {
		if (version < this._version) {
			console.error("Bad version %s, %d < %d", this._name, version, this._version);
			return;
		}

		this._answer = answer;
		this._version = version;
	}
	version() {
		return this._version;
	}
}

class Voting {
	
	constructor() {

		this._voters = new Map();

		this._version = 0;
		this._question = "";
		this._answer = "";
		this._answers = {};
		this._bonus = 0;
	}

	start() {
		console.log("Started new game");

		this._voters = new Map();

		this._version = 0;
		this._question = "";
		this._answer = "";
		this._answers = {};
		this._bonus = 0;
	}

	register(id, name) {
		if (this._voters.has(id)) {
			console.log("Already registered", id, name);
			return;
		}

		console.log("New player", id, name);
		this._voters.set(id, new Voter(name));
	}

	ask(question, answer) {
		let bestAnswer = "";
		if (this._answer === "") {
			let max = 0;
			for (let key in this._answers) {
				if (!this._answers.hasOwnProperty(key)) {
					continue;
				}

				const entries = this._answers[key];
				if (entries.length > max) {
					bestAnswer = key;
					max = entries.length;
				} else if (entries.length === max) {
					bestAnswer = "";
				}
			}
		} else {
			bestAnswer = this._answer;
		}

		if (bestAnswer.length > 0) {
			console.log("Best answer", bestAnswer);
			this._voters.forEach((voter) => {
				if (voter.answer() === bestAnswer && voter.version() === this._version) {
					console.log("Add point", voter.name());
					voter.addPoint();
				}
			});
		}

		this._version++;
		this._question = question;
		this._answer = answer;
		this._answers = {};
		this._bonus = 0;

		console.log("Asked", question, answer);
	}

	vote(version, id, answer) {
		if (this._version !== Number(version)) {
			console.error("Version mismatch", this._version, version, id);
			return false;
		}
		if (!this._voters.has(id)) {
			console.error("Missing ID", id);
			return false;
		}
		if (answer === null || answer.length <= 0) {
			console.error("Bad answer", id);
			return false;
		}

		let voter = this._voters.get(id);
		if (voter.version() >= this._version) {
			console.log("Double vote", id);
			return true;
		}

		voter.setAnswer(answer, this._version);

		if (this._answers.hasOwnProperty(answer)) {
			this._answers[answer].push(this.getName(id));
		} else {
			this._answers[answer] = [this.getName(id)];
		}

		if (this._answer === answer) {
			voter.setBonus(Math.max(0, this._bonus));
			this._bonus--;
		}

		console.log("Voted", answer, voter.name(), id);

		return true;
	}

	refresh(version, id) {
		if (Number(version) !== this._version && this._voters.has(id)) {
			return {
				question: this._question,
				version: this._version,
				score: this._voters.get(id).score(),
			}
		}
		return this.refreshAnswers()
	}

	refreshAnswers() {
		return this._answers;
	}

	standings() {
		let ranking = {};
		this._voters.forEach((voter, id) => {
			// 2 is buffer
			if (this._version > voter.version() + 2) {
				return;
			}

			ranking[id] = {
				name: voter.name(),
				score: voter.score(),
			};
		});

		return ranking;
	}

	getName(id) {
		return this._voters.has(id) ? this._voters.get(id).name() : "unknown";
	}
}

module.exports = { Voting };