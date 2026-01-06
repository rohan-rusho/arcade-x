import { Game } from '../../game-interface.js';

export default class ColorMatchGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.colors = [
            { name: 'RED', hex: '#ef4444' },
            { name: 'BLUE', hex: '#3b82f6' },
            { name: 'GREEN', hex: '#22c55e' },
            { name: 'YELLOW', hex: '#eab308' },
            { name: 'PURPLE', hex: '#a855f7' },
            { name: 'ORANGE', hex: '#f97316' }
        ];
        this.score = 0;
        this.timeLeft = 30;
        this.timer = null;
        this.currentTarget = null; // { text: 'RED', color: '#blue' }
    }

    init() {
        this.container.innerHTML = `
            <div class="cm-container">
                <div class="cm-info">
                    <div>Time: <span id="cm-time">30</span></div>
                    <div>Score: <span id="cm-score">0</span></div>
                </div>
                <div class="cm-instruction">Click the color of the text!</div>
                <div id="cm-target" class="cm-target">ready?</div>
                <div id="cm-options" class="cm-options"></div>
            </div>
            <style>
                .cm-container { display: flex; flex-direction: column; align-items: center; gap: 2rem; width: 100%; max-width: 400px; margin: 0 auto; }
                .cm-info { display: flex; justify-content: space-between; width: 100%; font-size: 1.5rem; color: var(--text-muted); }
                .cm-instruction { font-size: 1rem; color: var(--text-main); }
                .cm-target { 
                    font-size: 4rem; font-weight: 800; min-height: 100px; 
                    display: flex; align-items: center; justify-content: center;
                    text-transform: uppercase;
                }
                .cm-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; width: 100%; }
                .cm-btn {
                    padding: 1.5rem; background: rgba(255,255,255,0.1); border: 2px solid transparent;
                    border-radius: 12px; font-size: 1.2rem; font-weight: bold; cursor: pointer; color: white;
                    transition: transform 0.1s;
                }
                .cm-btn:active { transform: scale(0.95); }
                .cm-btn:hover { background: rgba(255,255,255,0.15); }
            </style>
        `;

        this.ui = {
            target: this.container.querySelector('#cm-target'),
            options: this.container.querySelector('#cm-options'),
            time: this.container.querySelector('#cm-time'),
            score: this.container.querySelector('#cm-score')
        };
    }

    start() {
        super.start();
        this.score = 0;
        this.timeLeft = 30;
        this.updateScore(0);
        this.ui.time.textContent = this.timeLeft;
        this.startTimer();
        this.nextRound();
    }

    stop() {
        super.stop();
        clearInterval(this.timer);
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.ui.time.textContent = this.timeLeft;
            if (this.timeLeft <= 0) {
                this.gameOver({ score: this.score, won: true });
            }
        }, 1000);
    }

    nextRound() {
        if (this.timeLeft <= 0) return;

        // Logic: 
        // Text = Random Color Name
        // Visual Color = Random Color Hex
        // Correct Answer = Name of the Visual Color

        const textObj = this.getRandomColor();
        const visualObj = this.getRandomColor();

        // Ensure confusion? Sometimes match, sometimes not.

        this.currentTarget = {
            text: textObj.name,
            colorHex: visualObj.hex,
            correctAnswer: visualObj.name // User must click button with this NAME (or button colored this way?)
            // Requirement: "Click the color of the text"
            // If Text says RED but is Blue. Color of text is Blue. User clicks Blue.
        };

        this.ui.target.textContent = this.currentTarget.text;
        this.ui.target.style.color = this.currentTarget.colorHex;

        // Options: 
        // Must include correct answer.
        // Others random.
        const options = [this.currentTarget.correctAnswer];
        while (options.length < 4) {
            const rand = this.getRandomColor().name;
            if (!options.includes(rand)) options.push(rand);
        }

        // Shuffle options
        options.sort(() => 0.5 - Math.random());

        this.ui.options.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'cm-btn';
            btn.textContent = opt;
            // Should buttons be colored? Or just text labels?
            // Requirement usually has buttons as text labels.
            // Or buttons colored? Let's keep buttons neutral to reduce confusion layer, or add it for Hard.
            // If Hard: Button text color is also random?

            if (this.config.difficulty === 'hard') {
                btn.style.color = this.getRandomColor().hex;
            }

            btn.onclick = () => this.handleInput(opt);
            this.ui.options.appendChild(btn);
        });
    }

    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    handleInput(choice) {
        if (choice === this.currentTarget.correctAnswer) {
            this.score += 100;
            this.updateScore(this.score);
            this.ui.score.textContent = this.score;
            // Add time bonus?
            // this.timeLeft += 1;
            this.nextRound();
        } else {
            // Penalize time or score?
            this.score = Math.max(0, this.score - 50);
            this.ui.score.textContent = this.score;
            this.showFeedback('Wrong!');
            this.nextRound();
        }
    }

    showFeedback(msg) {
        // Quick flash?
        this.container.style.borderColor = 'red';
        setTimeout(() => this.container.style.borderColor = 'transparent', 200);
    }
}
