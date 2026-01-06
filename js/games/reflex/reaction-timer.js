import { Game } from '../../game-interface.js';

export default class ReactionTimerGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.gameState = 'idle'; // idle, waiting, ready, finished
        this.startTime = 0;
        this.timeoutId = null;
    }

    init() {
        this.container.innerHTML = `
            <div id="rt-area" class="rt-area idle">
                <i class="fa-solid fa-bolt rt-icon"></i>
                <h2 id="rt-text">Click to Start</h2>
                <p id="rt-subtext">Wait for green, then click!</p>
            </div>
            <style>
                .rt-area {
                    width: 100%; height: 400px; border-radius: 16px;
                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                    cursor: pointer; transition: all 0.2s; user-select: none;
                    text-align: center; color: white;
                }
                .rt-area.idle { background: rgba(255,255,255,0.1); }
                .rt-area.waiting { background: #ef4444; }
                .rt-area.ready { background: #22c55e; }
                .rt-area.too-early { background: #f59e0b; }
                
                .rt-icon { font-size: 4rem; margin-bottom: 1rem; }
                .rt-area h2 { font-size: 2.5rem; margin: 0; }
                .rt-area p { font-size: 1.2rem; opacity: 0.8; }
            </style>
        `;

        this.ui = {
            area: this.container.querySelector('#rt-area'),
            text: this.container.querySelector('#rt-text'),
            subtext: this.container.querySelector('#rt-subtext')
        };

        this.ui.area.onmousedown = () => this.handleClick();
    }

    start() {
        super.start();
        this.reset();
    }

    stop() {
        super.stop();
        clearTimeout(this.timeoutId);
    }

    reset() {
        this.gameState = 'idle';
        this.ui.area.className = 'rt-area idle';
        this.ui.text.textContent = 'Click to Start';
        this.ui.subtext.textContent = 'Wait for green, then click!';
    }

    handleClick() {
        if (!this.isPlaying) return;

        if (this.gameState === 'idle' || this.gameState === 'finished') {
            this.startWait();
        } else if (this.gameState === 'waiting') {
            this.tooEarly();
        } else if (this.gameState === 'ready') {
            this.finish();
        } else if (this.gameState === 'early') {
            this.reset(); // Click to try again
        }
    }

    startWait() {
        this.gameState = 'waiting';
        this.ui.area.className = 'rt-area waiting';
        this.ui.text.textContent = 'Wait for Green...';
        this.ui.subtext.textContent = '';

        const delay = 2000 + Math.random() * 3000; // 2-5 sec

        this.timeoutId = setTimeout(() => {
            if (this.gameState === 'waiting') {
                this.setReady();
            }
        }, delay);
    }

    setReady() {
        this.gameState = 'ready';
        this.ui.area.className = 'rt-area ready';
        this.ui.text.textContent = 'CLICK!';
        this.ui.subtext.textContent = '';
        this.startTime = performance.now();
    }

    finish() {
        const time = Math.round(performance.now() - this.startTime);
        this.gameState = 'finished';
        this.ui.area.className = 'rt-area idle';
        this.ui.text.textContent = `${time} ms`;
        this.ui.subtext.textContent = 'Click to try again';

        // Score calculation: Lower is better. 
        // 200ms = 1000pts. 500ms = 0pts.
        // Formula: 1000 - (time - 150) * 3 approx?
        const score = Math.max(0, 1000 - (time - 150) * 2);
        this.gameOver({ score: score, won: true });
    }

    tooEarly() {
        clearTimeout(this.timeoutId);
        this.gameState = 'early';
        this.ui.area.className = 'rt-area too-early';
        this.ui.text.textContent = 'Too Early!';
        this.ui.subtext.textContent = 'Click to try again';
    }
}
