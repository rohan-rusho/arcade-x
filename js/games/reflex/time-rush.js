import { Game } from '../../game-interface.js';

export default class TimeRushGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.score = 0;
        this.timeLeft = 10;
        this.timer = null;
        this.currentTask = null;
    }

    init() {
        this.container.innerHTML = `
            <div class="tr-container">
                <div class="tr-bar"><div id="tr-progress" class="tr-progress"></div></div>
                <div class="tr-score">Score: <span id="tr-score">0</span></div>
                <div id="tr-question" class="tr-question">Ready?</div>
                <div id="tr-options" class="tr-options"></div>
            </div>
            <style>
                .tr-container { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; width: 100%; max-width: 400px; margin: 0 auto; }
                .tr-bar { width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden; }
                .tr-progress { width: 100%; height: 100%; background: var(--primary); transition: width 0.1s linear; }
                .tr-score { font-size: 1.5rem; color: var(--accent); }
                .tr-question { font-size: 2rem; font-weight: bold; text-align: center; min-height: 80px; display: flex; align-items: center; justify-content: center; }
                .tr-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; width: 100%; }
                .tr-btn {
                    padding: 1.5rem; background: rgba(255,255,255,0.1); border: none; border-radius: 12px;
                    font-size: 1.2rem; font-weight: bold; color: white; cursor: pointer;
                    transition: transform 0.1s, background 0.2s;
                }
                .tr-btn:active { transform: scale(0.95); }
                .tr-btn:hover { background: rgba(255,255,255,0.2); }
                .tr-btn.correct { background: var(--success); }
                .tr-btn.wrong { background: var(--danger); }
            </style>
        `;

        this.ui = {
            progress: this.container.querySelector('#tr-progress'),
            score: this.container.querySelector('#tr-score'),
            question: this.container.querySelector('#tr-question'),
            options: this.container.querySelector('#tr-options')
        };
    }

    start() {
        super.start();
        this.score = 0;
        this.timeLeft = 10;
        this.updateScore(0);
        this.nextTask();
        this.startTimer();
    }

    stop() {
        super.stop();
        clearInterval(this.timer);
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft -= 0.1;
            this.updateUI();

            if (this.timeLeft <= 0) {
                this.gameOver({ score: this.score, won: true });
            }
        }, 100);
    }

    updateUI() {
        const pct = Math.max(0, (this.timeLeft / 10) * 100);
        this.ui.progress.style.width = `${pct}%`;
        if (this.timeLeft < 3) this.ui.progress.style.background = 'var(--danger)';
        else this.ui.progress.style.background = 'var(--primary)';
    }

    nextTask() {
        // Generate random simple math task
        const ops = ['+', '-', '*'];
        // If difficult, maybe larger numbers
        const diff = this.config.difficulty === 'easy' ? 10 : 20;

        const a = Math.floor(Math.random() * diff) + 1;
        const b = Math.floor(Math.random() * diff) + 1;
        const op = ops[Math.floor(Math.random() * ops.length)];

        let ans;
        if (op === '+') ans = a + b;
        else if (op === '-') ans = a - b;
        else ans = a * b; // multiplication

        this.currentTask = ans;
        this.ui.question.textContent = `${a} ${op} ${b} = ?`;

        // Options
        const opts = [ans];
        while (opts.length < 4) {
            const fake = ans + Math.floor(Math.random() * 10) - 5;
            if (fake !== ans && !opts.includes(fake)) opts.push(fake);
        }
        opts.sort(() => 0.5 - Math.random());

        this.ui.options.innerHTML = '';
        opts.forEach(val => {
            const btn = document.createElement('button');
            btn.className = 'tr-btn';
            btn.textContent = val;
            btn.onclick = () => this.handleInput(val, btn);
            this.ui.options.appendChild(btn);
        });
    }

    handleInput(val, btn) {
        if (!this.isPlaying) return;

        if (val === this.currentTask) {
            // Correct
            this.score += 50;
            this.timeLeft = Math.min(10, this.timeLeft + 2); // Cap at 10s
            this.updateScore(this.score);
            this.ui.score.textContent = this.score;
            this.nextTask();
        } else {
            // Wrong
            this.timeLeft -= 3;
            btn.classList.add('wrong');

            // Highlight correct?
            // Or just penalty?
            // If time drops below 0:
            if (this.timeLeft <= 0) {
                this.gameOver({ score: this.score, won: true });
            }
        }
    }
}
