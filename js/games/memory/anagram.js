import { Game } from '../../game-interface.js';

export default class AnagramGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.words = {
            easy: ['CAT', 'DOG', 'SUN', 'MAP', 'HAT', 'BOX', 'RED', 'SKY', 'JOY', 'FUN'],
            medium: ['APPLE', 'TIGER', 'CHAIR', 'BEACH', 'DANCE', 'MUSIC', 'PLANT', 'WATER', 'SPACE', 'ROBOT'],
            hard: ['ELEPHANT', 'COMPUTER', 'UNIVERSE', 'SYMPHONY', 'DAUGHTER', 'LANGUAGE', 'MOUNTAIN', 'PYRAMID']
        };
        this.currentWord = '';
        this.scrambledWord = '';
        this.score = 0;
        this.timeLeft = 60;
        this.timer = null;
    }

    init() {
        this.container.innerHTML = `
            <div class="ag-container">
                <div class="ag-info">
                    <div class="ag-timer">Time: <span id="ag-time">60</span>s</div>
                    <div class="ag-score-live">Score: <span id="ag-score">0</span></div>
                </div>
                
                <div id="ag-scramble" class="ag-scramble"></div>
                
                <div class="ag-input-area">
                    <input type="text" id="ag-input" class="glass-input" placeholder="Type here..." autocomplete="off">
                    <button id="ag-submit" class="glass-btn primary">Submit</button>
                    <button id="ag-skip" class="glass-btn secondary">Skip (-10)</button>
                </div>
                
                <div style="width: 100%; display: flex; justify-content: center;">
                    <button id="ag-hint" class="glass-btn primary" style="min-width: 120px;">
                        <i class="fa-solid fa-lightbulb"></i> Hint
                    </button>
                </div>

                <div id="ag-feedback" class="ag-feedback"></div>
            </div>
            <style>
                .ag-container { 
                    display: flex; flex-direction: column; align-items: center; gap: 2rem; width: 100%; max-width: 500px; margin: 0 auto; 
                }
                .ag-info { display: flex; justify-content: space-between; width: 100%; font-size: 1.2rem; color: var(--text-muted); }
                .ag-scramble { 
                    font-size: 3rem; font-weight: 800; letter-spacing: 0.5rem; color: var(--accent); 
                    text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
                    text-transform: uppercase;
                    min-height: 80px;
                    display: flex; align-items: center; justify-content: center;
                }
                .ag-input-area { display: flex; gap: 0.5rem; width: 100%; }
                .glass-input {
                    flex: 1; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); 
                    color: white; padding: 0.8rem; border-radius: var(--radius-md); font-size: 1.2rem;
                    text-align: center; text-transform: uppercase; outline: none;
                }
                .glass-input:focus { border-color: var(--primary); box-shadow: 0 0 10px var(--primary-glow); }
                .ag-feedback { height: 24px; color: var(--success); font-weight: bold; }
            </style>
        `;

        this.ui = {
            scramble: this.container.querySelector('#ag-scramble'),
            input: this.container.querySelector('#ag-input'),
            submit: this.container.querySelector('#ag-submit'),
            skip: this.container.querySelector('#ag-skip'),
            hint: this.container.querySelector('#ag-hint'),
            time: this.container.querySelector('#ag-time'),
            score: this.container.querySelector('#ag-score'),
            feedback: this.container.querySelector('#ag-feedback')
        };

        this.ui.submit.addEventListener('click', () => this.checkAnswer());
        this.ui.skip.addEventListener('click', () => this.skipWord());
        this.ui.hint.addEventListener('click', () => this.useHint());
        this.ui.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkAnswer();
        });
    }

    destroy() {
        if (this.hintTimer) clearInterval(this.hintTimer);
        super.destroy();
    }

    start() {
        super.start();
        this.score = 0;
        this.timeLeft = 60;
        this.hintAvailable = true;
        this.hintCooldown = 0;
        this.updateHintUI();

        this.updateScore(0);
        this.nextWord();
        this.startTimer();
    }

    stop() {
        super.stop();
        clearInterval(this.timer);
        if (this.hintTimer) clearInterval(this.hintTimer);
    }

    startTimer() {
        this.ui.time.textContent = this.timeLeft;
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.ui.time.textContent = this.timeLeft;
            if (this.timeLeft <= 0) {
                this.gameOver({ score: this.score, won: false });
            }
        }, 1000);
    }

    useHint() {
        if (!this.isPlaying || !this.hintAvailable) return;

        // Reveal the first letter?
        const firstLetter = this.currentWord[0];
        this.showFeedback(`Hint: Starts with ${firstLetter}`, 'warning');

        // Cooldown
        this.startHintCooldown();
    }

    startHintCooldown() {
        this.hintAvailable = false;
        this.hintCooldown = 40;
        this.updateHintUI();

        this.hintTimer = setInterval(() => {
            this.hintCooldown--;
            this.updateHintUI();
            if (this.hintCooldown <= 0) {
                this.hintAvailable = true;
                clearInterval(this.hintTimer);
                this.updateHintUI();
            }
        }, 1000);
    }

    updateHintUI() {
        if (!this.ui.hint) return;
        if (this.hintAvailable) {
            this.ui.hint.disabled = false;
            this.ui.hint.innerHTML = `<i class="fa-solid fa-lightbulb"></i> Hint`;
            this.ui.hint.style.opacity = '1';
        } else {
            this.ui.hint.disabled = true;
            this.ui.hint.innerHTML = `<i class="fa-solid fa-hourglass"></i> ${this.hintCooldown}s`;
            this.ui.hint.style.opacity = '0.5';
        }
    }

    nextWord() {
        const difficulty = this.config.difficulty;
        const list = this.words[difficulty] || this.words.medium;

        this.currentWord = list[Math.floor(Math.random() * list.length)];
        this.scrambledWord = this.shuffle(this.currentWord);

        while (this.scrambledWord === this.currentWord) {
            this.scrambledWord = this.shuffle(this.currentWord);
        }

        this.ui.scramble.textContent = this.scrambledWord;
        this.ui.input.value = '';
        this.ui.input.focus();
    }

    shuffle(word) {
        return word.split('').sort(() => 0.5 - Math.random()).join('');
    }

    checkAnswer() {
        const input = this.ui.input.value.toUpperCase().trim();
        if (input === this.currentWord) {
            this.showFeedback('Correct!', 'success');
            const points = input.length * 10;
            this.updateScore(this.score + points);
            this.ui.score.textContent = this.score;
            this.nextWord();
        } else {
            this.showFeedback('Try Again', 'danger');
            this.ui.input.classList.add('shake');
            setTimeout(() => this.ui.input.classList.remove('shake'), 400);
        }
    }

    skipWord() {
        this.score = Math.max(0, this.score - 10);
        this.updateScore(this.score);
        this.ui.score.textContent = this.score;
        this.showFeedback('Skipped', 'warning');
        this.nextWord();
    }

    showFeedback(msg, type) {
        this.ui.feedback.textContent = msg;
        this.ui.feedback.style.color = `var(--${type})`;
        // Don't auto clear if hint? 
        if (type !== 'warning' || !msg.includes('Hint')) {
            setTimeout(() => this.ui.feedback.textContent = '', 1000);
        } else {
            setTimeout(() => this.ui.feedback.textContent = '', 3000);
        }
    }
}
