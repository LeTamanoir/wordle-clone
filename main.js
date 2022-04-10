document.addEventListener("alpine:init", () => {
  Alpine.data("wordleClone", () => ({
    async init() {
      this.words = await this.getWords();
      this.word = this.getRandomWord();
    },
    word: "",
    words: [],
    guess: "",
    win: false,
    lost: false,
    found: new Set(),
    misplaced: new Set(),
    incorrect: new Set(),
    alerts: [],
    attempt_id: 1,
    attempts: [],

    addLetter(letter) {
      if (this.attempt_id > 6) return;

      let _len = this.guess.length;
      if (_len < 5) {
        this.guess += letter;

        this.$refs[`attempt-${this.attempt_id}`].children[_len].classList.add(
          "bubble",
          "typed"
        );

        setTimeout(() => {
          if (this.attempt_id > 6) return;

          this.$refs[`attempt-${this.attempt_id}`].children[
            _len
          ].classList.remove("bubble");
        }, 500);
      }
    },

    handleText(att_id, place_id) {
      if (att_id === this.attempt_id) {
        return this.guess.at(place_id) ?? "";
      }

      if (att_id < this.attempt_id) {
        return JSON.parse(JSON.stringify(this.attempts))[att_id - 1][place_id];
      }
    },

    textClass(att_id, place_id) {
      if (att_id < this.attempt_id) {
        let row = JSON.parse(JSON.stringify(this.attempts))[att_id - 1];
        let letter = row[place_id];

        if (this.word.includes(letter)) {
          if (letter === this.word[place_id]) {
            return "filled found";
          }

          if (place_id !== this.word.indexOf(letter)) {
            return "filled misplaced";
          }
        }

        return "filled";
      }
    },

    shake() {
      if (this.attempt_id > 6) return;

      let _id = Date.now();

      this.$refs[`attempt-${this.attempt_id}`].classList.add("shake");
      setTimeout(() => {
        if (this.attempt_id > 6) return;
        this.$refs[`attempt-${this.attempt_id}`].classList.remove("shake");
      }, 500);

      if (this.alerts.length < 6) {
        this.alerts.push({ message: "Not enough letters", id: _id });
        setTimeout(() => {
          this.alerts = this.alerts.filter((al) => al.id !== _id);
        }, 2000);
      }
    },

    submitWord() {
      if (this.attempt_id > 6) return;

      if (this.guess.length !== this.word.length) {
        this.shake();
        return;
      }

      for (letter of this.guess) {
        if (this.word.includes(letter)) {
          if (this.word.indexOf(letter) === this.guess.indexOf(letter)) {
            this.found.add(letter);
          } else {
            this.misplaced.add(letter);
          }
        } else {
          this.incorrect.add(letter);
        }
      }

      let _guess = this.guess;
      this.attempts.push([...this.guess]);
      this.guess = "";
      this.handleTransition();

      if (this.word === _guess) {
        setTimeout(() => {
          this.win = true;
        }, 1100);
      } else if (this.attempt_id === 6) {
        setTimeout(() => {
          this.lost = true;
        }, 1100);
      }

      this.attempt_id += 1;
    },

    handleTransition() {
      if (this.attempt_id > 6) return;

      this.$refs[`attempt-${this.attempt_id}`].classList.add("reveal");
    },

    kbdClass(letter) {
      return this.found.has(letter)
        ? "found"
        : this.misplaced.has(letter)
        ? "misplaced"
        : this.incorrect.has(letter)
        ? "incorrect"
        : "";
    },

    deleteLetter() {
      if (this.attempt_id > 6) return;

      this.guess = this.guess.slice(0, -1);
      this.$refs[`attempt-${this.attempt_id}`].children[
        this.guess.length
      ].classList.remove("typed");
    },

    async getWords() {
      return (await (await fetch("list.json")).json()).words;
    },

    getRandomWord() {
      let word = this.words[Math.floor(Math.random() * 212)];
      console.log(word);
      return word;
    },

    playAgain() {
      this.word = this.getRandomWord();
      this.guess = "";
      this.win = false;
      this.lost = false;
      this.found = new Set();
      this.misplaced = new Set();
      this.incorrect = new Set();
      this.alerts = [];
      this.attempt_id = 1;
      this.attempts = [];

      for (let i = 1; i < 7; i++) {
        this.$refs[`attempt-${i}`].classList.remove("reveal", "shake");

        for (child of this.$refs[`attempt-${i}`].children) {
          child.classList.remove("typed");
        }
      }
    },
  }));
});
