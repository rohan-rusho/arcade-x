import { Game } from '../../game-interface.js';

export default class TypingTestGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.texts = {
            easy: [
                "The quick brown fox jumps over the lazy dog.",
                "A journey of a thousand miles begins with a single step.",
                "To be or not to be, that is the question.",
                "All that glitters is not gold."
            ],
            medium: [
                "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                "In the middle of difficulty lies opportunity. Einstein knew this well.",
                "It does not matter how slowly you go as long as you do not stop.",
                "The best way to predict the future is to create it."
            ],
            hard: [
                "The fundamental concept of the algorithm is to iterate through the array efficiently.",
                "Photosynthesis is the process by which green plants and some other organisms use sunlight.",
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
                "Quantum mechanics is a fundamental theory in physics that provides a description of nature."
            ]
        };
        this.currentText = '';
        this.startTime = null;
        this.timer = null;
        this.timeLeft = 60;
        this.wpm = 0;
        this.accuracy = 100;
        this.isFinished = false;
    }

    init() {
        this.container.innerHTML = `
            <div class="tt-container">
                <div class="tt-stats">
                    <div class="tt-stat-box">
                        <div class="label">Time</div>
                        <div class="value" id="tt-time">60</div>
                    </div>
                    <div class="tt-stat-box">
                        <div class="label">WPM</div>
                        <div class="value" id="tt-wpm">0</div>
                    </div>
                    <div class="tt-stat-box">
                        <div class="label">Accuracy</div>
                        <div class="value" id="tt-acc">100%</div>
                    </div>
                </div>

                <div class="tt-text-display glass-panel" id="tt-display"></div>
                
                <textarea id="tt-input" class="tt-input" placeholder="Start typing here..."></textarea>
                
                <button id="tt-retry" class="glass-btn hidden">Try Another</button>
            </div>
            <style>
                .tt-container { display: flex; flex-direction: column; gap: 1.5rem; width: 100%; max-width: 800px; margin: 0 auto; }
                .tt-stats { display: flex; justify-content: space-around; gap: 1rem; }
                .tt-stat-box { background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; text-align: center; min-width: 100px; }
                .tt-stat-box .label { font-size: 0.8rem; color: var(--text-muted); }
                .tt-stat-box .value { font-size: 1.5rem; font-weight: bold; color: var(--accent); }
                
                .tt-text-display { 
                    padding: 1.5rem; font-size: 1.2rem; line-height: 1.6; min-height: 100px; 
                    user-select: none; color: var(--text-muted);
                }
                .tt-char { transition: color 0.1s; }
                .tt-char.correct { color: var(--success); }
                .tt-char.incorrect { color: var(--danger); background: rgba(239, 68, 68, 0.2); }
                .tt-char.current { border-bottom: 2px solid var(--accent); }

                .tt-input { 
                    width: 100%; height: 100px; background: rgba(255,255,255,0.05); 
                    border: 1px solid var(--glass-border); border-radius: 8px; padding: 1rem;
                    color: white; font-size: 1.2rem; resize: none; outline: none;
                }
                .tt-input:focus { border-color: var(--primary); }
            </style>
        `;

        this.ui = {
            display: this.container.querySelector('#tt-display'),
            input: this.container.querySelector('#tt-input'),
            time: this.container.querySelector('#tt-time'),
            wpm: this.container.querySelector('#tt-wpm'),
            acc: this.container.querySelector('#tt-acc'),
            retry: this.container.querySelector('#tt-retry')
        };

        this.handleInput = this.handleInput.bind(this);
        this.ui.input.addEventListener('input', this.handleInput);
        this.ui.retry.addEventListener('click', () => this.start());
    }

    start() {
        super.start();
        clearInterval(this.timer);
        this.startTime = null;
        this.isFinished = false;
        this.timeLeft = 60;
        this.ui.time.textContent = this.timeLeft;
        this.ui.wpm.textContent = '0';
        this.ui.acc.textContent = '100%';
        this.ui.input.value = '';
        this.ui.input.disabled = false;
        this.ui.input.focus();
        this.ui.retry.classList.add('hidden');

        // Pick text
        const diff = this.config.difficulty;
        const list = this.texts[diff] || this.texts.medium;
        this.currentText = list[Math.floor(Math.random() * list.length)];

        this.renderText();
    }

    renderText() {
        this.ui.display.innerHTML = this.currentText.split('').map(char =>
            `<span class="tt-char">${char}</span>`
        ).join('');
    }

    handleInput() {
        if (this.isFinished) return;

        if (!this.startTime) {
            this.startTime = Date.now();
            this.startTimer();
        }

        const inputVal = this.ui.input.value;
        const inputChars = inputVal.split('');
        const textChars = this.ui.display.querySelectorAll('.tt-char');

        let correctCols = 0;

        textChars.forEach((span, index) => {
            const char = inputChars[index];
            if (char == null) {
                span.classList.remove('correct', 'incorrect');
                if (index === inputChars.length) span.classList.add('current');
                else span.classList.remove('current');
            } else if (char === span.textContent) {
                span.classList.add('correct');
                span.classList.remove('incorrect', 'current');
                correctCols++;
            } else {
                span.classList.add('incorrect');
                span.classList.remove('correct', 'current');
            }
        });

        // Calculate Stats
        const timeElapsed = (Date.now() - this.startTime) / 1000 / 60; // in minutes
        const wordsTyped = inputVal.length / 5;
        this.wpm = Math.round(wordsTyped / timeElapsed) || 0;
        this.accuracy = Math.round((correctCols / inputVal.length) * 100) || 100;

        this.ui.wpm.textContent = this.wpm;
        this.ui.acc.textContent = this.accuracy + '%';

        // Check completion
        if (inputVal === this.currentText) {
            this.finish();
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.ui.time.textContent = this.timeLeft;
            if (this.timeLeft <= 0) {
                this.finish();
            }
        }, 1000);
    }

    finish() {
        this.isFinished = true;
        clearInterval(this.timer);
        this.ui.input.disabled = true;
        this.ui.retry.classList.remove('hidden');

        const finalScore = Math.round(this.wpm * (this.accuracy / 100));
        this.gameOver({ score: finalScore, won: true });
    }

    stop() {
        super.stop();
        clearInterval(this.timer);
    }
}
