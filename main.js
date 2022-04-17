//prettier-ignore
let letters = [
  "Q","W","E","R","T","Y","U","I","O","P",
    "A","S","D","F","G","H","J","K","L",
        "Z","X","C","V","B","N","M"
];

document.addEventListener("alpine:init", () => {
  Alpine.data("wordleClone", () => ({
    letters,
    keys: Object.fromEntries(
      letters.map((key) => [
        key,
        {
          correct: false,
          misplaced: false,
          incorrect: false,
        },
      ])
    ),

    guesses: [...Array(6)].map((_, _id_1) => ({
      class: {
        shake: false,
        reveal: false,
        success: false,
      },
      letters: [...Array(5)].map((_, _id_2) => ({
        text: "",
        _id: _id_2,
        class: {
          reveal: false,
          bubble: false,
          active: false,
          correct: false,
          misplaced: false,
          incorrect: false,
        },
      })),
      _id: _id_1,
    })),

    alerts: [],
    secrect_word: "",
    words: [],
    allowed: [],
    current_row: 0,
    current_letter: 0,

    modal: {
      show: false,
      text: "",
      destroy() {
        this.show = false;
        this.text = "";
      },
    },

    replay() {
      for (let _row = 0; _row < 6; _row++) {
        this.guesses[_row].class.reveal = false;
        this.guesses[_row].class.success = false;
        this.guesses[_row].class.shake = false;
        for (let _letter = 0; _letter < 5; _letter++) {
          this.guesses[_row].letters[_letter].class = {
            reveal: false,
            bubble: false,
            active: false,
            correct: false,
            misplaced: false,
            incorrect: false,
          };
          this.guesses[_row].letters[_letter].text = "";
        }
      }

      this.letters.forEach((l) => {
        this.keys[l].correct = false;
        this.keys[l].misplaced = false;
        this.keys[l].incorrect = false;
      });

      this.modal.destroy();
      this.secrect_word = this.getRandomWord();
      this.current_row = 0;
      this.current_letter = 0;
    },

    getRandomWord() {
      return this.words[Math.floor(this.words.length * Math.random())];
    },

    async init() {
      const { words } = await (await fetch("list.json")).json();
      const { allowed } = await (await fetch("allowed.json")).json();
      this.words = words;
      this.allowed = allowed;
      this.secrect_word = words[Math.floor(words.length * Math.random())];
    },

    handleKey(e) {
      if (this.modal.show) return;
      let key = e.key.toUpperCase();
      if (this.letters.includes(key)) this.addKey(key);
      else if (e.key === "Backspace") this.deleteLetter();
      else if (e.key === "Enter") this.submitWord();
    },

    addKey(key) {
      if (this.guesses[this.current_row].class.reveal) return;

      if (
        this.guesses[this.current_row].letters[this.current_letter].text !== ""
      ) {
        if (this.current_letter < 4) this.current_letter++;
        else return;
      }

      let _row = this.current_row;
      let _letter = this.current_letter;

      this.guesses[_row].letters[_letter].class.bubble = true;
      this.guesses[_row].letters[_letter].class.active = true;
      this.guesses[_row].letters[_letter].text = key;
      if (this.current_letter < 4) this.current_letter++;
    },

    submitWord() {
      if (this.guesses[this.current_row].class.reveal) return;

      let _row = this.current_row;
      let _secret_helper = this.secrect_word;
      let _correct_index_helper = [];
      let _keys_helper = { incorrect: [], misplaced: [], correct: [] };
      let win = true;

      for (let letter of this.guesses[_row].letters) {
        if (letter.text === "") {
          this.guesses[_row].class.shake = true;

          document
            .querySelector(`#row_${_row}`)
            .addEventListener("animationend", () => {
              this.guesses[_row].class.shake = false;
            });

          return;
        }
      }

      let _guess = this.guesses[_row].letters.reduce(
        (prev, letter) => prev + letter.text,
        ""
      );

      if (!this.allowed.includes(_guess)) {
        this.guesses[_row].class.shake = true;
        document
          .querySelector(`#row_${_row}`)
          .addEventListener("animationend", () => {
            this.guesses[_row].class.shake = false;
          });

        this.addAlert("Not in word list");
        return;
      }

      this.guesses[_row].class.reveal = true;

      for (let i = 0; i < 5; i++) {
        let letter = this.guesses[_row].letters[i].text;
        let secret_letter = this.secrect_word[i];

        if (letter === secret_letter) {
          this.guesses[_row].letters[i].class.correct = true;
          _correct_index_helper.push(i);
          _secret_helper = _secret_helper.replace(letter, "");
          _keys_helper.correct.push(letter);
        } else {
          win = false;
        }
      }

      for (let i = 0; i < 5; i++) {
        let letter = this.guesses[_row].letters[i].text;

        if (!_correct_index_helper.includes(i)) {
          if (_secret_helper.includes(letter)) {
            this.guesses[_row].letters[i].class.misplaced = true;
            _secret_helper = _secret_helper.replace(letter, "");

            if (!_keys_helper.correct.includes(letter)) {
              _keys_helper.misplaced.push(letter);
            }
          }
          //
          else {
            this.guesses[_row].letters[i].class.incorrect = true;

            if (
              !_keys_helper.correct.includes(letter) &&
              !_keys_helper.misplaced.includes(letter)
            ) {
              _keys_helper.incorrect.push(letter);
            }
          }
        }
      }

      setTimeout(() => {
        Object.keys(_keys_helper).forEach((key) => {
          _keys_helper[key].forEach((k) => (this.keys[k][key] = true));
        });

        if (win) {
          this.guesses[_row].class.success = true;
          this.addAlert("Genius");

          setTimeout(() => this.handleWin(), 1000);
        } else if (this.current_row === 5) {
          this.handleLose();
        } else {
          this.current_row++;
          this.current_letter = 0;
        }
      }, 2000);
    },

    addAlert(message) {
      let _id = Date.now();
      this.alerts.push({ message, _id });

      setTimeout(() => {
        this.alerts = this.alerts.filter((e) => e._id !== _id);
      }, 3000);
    },

    handleWin() {
      this.modal.text = "You won 🏆";
      this.modal.show = true;
    },

    handleLose() {
      this.modal.text = `You lost 😕, the word was : ${this.secrect_word}`;
      this.modal.show = true;
    },

    deleteLetter() {
      if (this.guesses[this.current_row].class.reveal) return;

      if (
        this.guesses[this.current_row].letters[this.current_letter].text === ""
      ) {
        if (this.current_letter > 0) this.current_letter--;
        else return;
      }

      let _row = this.current_row;
      let _letter = this.current_letter;

      this.guesses[_row].letters[_letter].class.bubble = false;
      this.guesses[_row].letters[_letter].class.active = false;
      this.guesses[_row].letters[_letter].text = "";
      if (this.current_letter > 0) this.current_letter--;
    },
  }));
});
