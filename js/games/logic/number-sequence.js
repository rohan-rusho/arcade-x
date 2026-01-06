import { Game } from '../../game-interface.js';

export default class NumberSequenceGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.score = 0;
        this.currentSequence = [];
        this.correctAnswer = 0;
        this.round = 1;
    }

    init() {
        this.container.innerHTML = `
            <div class="ns-container">
                <div class="ns-score">Score: <span id="ns-score">0</span></div>
                <div class="ns-problem">
                    <span id="ns-seq"></span>
                    <span class="ns-q">?</span>
                </div>
                <div class="ns-input-area">
                    <input type="number" id="ns-input" class="glass-input" placeholder="Next Number">
                    <button id="ns-submit" class="glass-btn primary">Submit</button>
                    <button id="ns-skip" class="glass-btn secondary">Skip</button>
                </div>
                <div id="ns-feedback" class="ns-feedback"></div>
            </div>
            <style>
                .ns-container { display: flex; flex-direction: column; align-items: center; gap: 2rem; width: 100%; max-width: 500px; margin: 0 auto; }
                .ns-score { font-size: 1.5rem; color: var(--accent); }
                .ns-problem { 
                    font-size: 2rem; font-weight: bold; padding: 2rem; background: rgba(255,255,255,0.05);
                    border-radius: 12px; display: flex; gap: 1rem; align-items: center;
                }
                .ns-q { color: var(--secondary); animation: pulse 1s infinite; }
                .ns-input-area { display: flex; gap: 0.5rem; width: 100%; }
                .glass-input { flex: 1; padding: 1rem; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.3); color: white; font-size: 1.2rem; }
            </style>
        `;

        this.ui = {
            seq: this.container.querySelector('#ns-seq'),
            input: this.container.querySelector('#ns-input'),
            submit: this.container.querySelector('#ns-submit'),
            skip: this.container.querySelector('#ns-skip'),
            score: this.container.querySelector('#ns-score'),
            feedback: this.container.querySelector('#ns-feedback')
        };

        this.ui.submit.onclick = () => this.checkAnswer();
        this.ui.skip.onclick = () => this.nextRound();
        this.ui.input.onkeypress = (e) => { if (e.key === 'Enter') this.checkAnswer(); };
    }

    start() {
        super.start();
        this.score = 0;
        this.round = 1;
        this.updateScore(0);
        this.nextRound();
    }

    nextRound() {
        this.ui.input.value = '';
        this.ui.input.focus();
        this.generateSequence();
    }

    generateSequence() {
        // Types: Arithmetic, Geometric, Fibonacci, Square, Mixed
        const types = ['arithmetic', 'geometric', 'fibonacci', 'square'];
        const type = types[Math.floor(Math.random() * types.length)];

        const difficulty = this.config.difficulty === 'easy' ? 0 : this.config.difficulty === 'medium' ? 1 : 2;

        let seq = [];
        let next = 0;

        if (type === 'arithmetic') {
            const start = Math.floor(Math.random() * 20);
            const diff = Math.floor(Math.random() * 10) + 1 + (difficulty * 5);
            for (let i = 0; i < 4; i++) seq.push(start + (i * diff));
            next = start + (4 * diff);
        }
        else if (type === 'geometric') {
            const start = Math.floor(Math.random() * 5) + 1;
            const ratio = Math.floor(Math.random() * 2) + 2; // 2 or 3
            for (let i = 0; i < 4; i++) seq.push(start * Math.pow(ratio, i));
            next = start * Math.pow(ratio, 4);
        }
        else if (type === 'fibonacci') {
            const start1 = Math.floor(Math.random() * 5) + 1;
            const start2 = Math.floor(Math.random() * 5) + 1;
            seq = [start1, start2];
            for (let i = 2; i < 5; i++) seq.push(seq[i - 1] + seq[i - 2]);
            next = seq[4]; // wait, pushed 5 times. 0,1,2,3,4. 
            // 0,1 -> 2,3,4. Length 5.
            // Display first 4.
            next = seq.pop();
        }
        else if (type === 'square') {
            const start = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < 4; i++) seq.push(Math.pow(start + i, 2));
            next = Math.pow(start + 4, 2);
        }

        this.currentSequence = seq;
        this.correctAnswer = next;

        this.ui.seq.textContent = seq.join(', ');
    }

    checkAnswer() {
        const val = parseInt(this.ui.input.value);
        if (val === this.correctAnswer) {
            this.score += 100 + (this.round * 10);
            this.updateScore(this.score);
            this.ui.score.textContent = this.score;
            this.showFeedback('Correct!', 'success');
            this.round++;
            setTimeout(() => this.nextRound(), 1000);
        } else {
            this.showFeedback('Wrong, try again', 'danger');
        }
    }

    showFeedback(msg, type) {
        this.ui.feedback.textContent = msg;
        this.ui.feedback.style.color = `var(--${type})`;
    }
}
