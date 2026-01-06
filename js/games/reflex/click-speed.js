import { Game } from '../../game-interface.js';

export default class ClickSpeedGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.clicks = 0;
        this.timeLeft = 5;
        this.timer = null;
        this.isActive = false;
    }

    init() {
        this.container.innerHTML = `
            <div class="cps-container">
                <div class="cps-stats">
                    <div>Time: <span id="cps-time">5</span>s</div>
                    <div>CPS: <span id="cps-val">0</span></div>
                </div>
                <button id="cps-area" class="cps-area">
                    <span id="cps-msg">Click to Start</span>
                    <span id="cps-count">0</span>
                </button>
            </div>
            <style>
                .cps-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%; max-width: 400px; margin: 0 auto; }
                .cps-stats { display: flex; justify-content: space-between; width: 100%; font-size: 1.5rem; color: var(--text-muted); }
                .cps-area {
                    width: 100%; height: 300px; background: rgba(255,255,255,0.1);
                    border: 2px solid var(--glass-border); border-radius: 16px;
                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                    cursor: pointer; transition: all 0.1s; user-select: none;
                    color: white; font-family: inherit;
                }
                .cps-area:active { transform: scale(0.98); background: rgba(255,255,255,0.15); }
                #cps-msg { font-size: 1.5rem; margin-bottom: 1rem; color: var(--accent); }
                #cps-count { font-size: 5rem; font-weight: 800; line-height: 1; }
            </style>
        `;

        this.ui = {
            area: this.container.querySelector('#cps-area'),
            time: this.container.querySelector('#cps-time'),
            cps: this.container.querySelector('#cps-val'),
            msg: this.container.querySelector('#cps-msg'),
            count: this.container.querySelector('#cps-count')
        };

        this.handleClick = this.handleClick.bind(this);
        this.ui.area.addEventListener('mousedown', this.handleClick);
        // Prevent zoom on double tap
        this.ui.area.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleClick(); });
    }

    start() {
        super.start();
        this.clicks = 0;
        this.isActive = false;

        // Difficulty affects time?
        if (this.config.difficulty === 'easy') this.timeLeft = 5;
        else if (this.config.difficulty === 'medium') this.timeLeft = 10;
        else this.timeLeft = 15;

        this.updateUI();
    }

    stop() {
        super.stop();
        clearInterval(this.timer);
    }

    handleClick() {
        if (!this.isPlaying) return;

        if (!this.isActive) {
            this.isActive = true;
            this.startTimer();
            this.ui.msg.textContent = 'Keep Clicking!';
        }

        this.clicks++;
        this.updateUI();

        // Animation effect
        // this.ui.count.style.transform = 'scale(1.2)'; 
        // setTimeout(() => this.ui.count.style.transform = 'scale(1)', 50);
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateUI();

            if (this.timeLeft <= 0) {
                this.finish();
            }
        }, 1000);
    }

    finish() {
        clearInterval(this.timer);
        this.isActive = false;

        const duration = this.config.difficulty === 'easy' ? 5 : this.config.difficulty === 'medium' ? 10 : 15;
        const cps = (this.clicks / duration).toFixed(2);

        this.ui.msg.textContent = 'Results';
        this.ui.cps.textContent = cps;

        this.gameOver({ score: Math.round(cps * 100), won: true });
    }

    updateUI() {
        this.ui.time.textContent = this.timeLeft;
        this.ui.count.textContent = this.clicks;
        if (this.isActive) {
            const duration = (this.config.difficulty === 'easy' ? 5 : this.config.difficulty === 'medium' ? 10 : 15);
            const elapsed = duration - this.timeLeft;
            if (elapsed > 0) {
                this.ui.cps.textContent = (this.clicks / elapsed).toFixed(1);
            }
        }
    }
}
