import { Game } from '../../game-interface.js';

export default class SimonSaysGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.sequence = [];
        this.playerSequence = [];
        this.colors = ['green', 'red', 'yellow', 'blue'];
        this.round = 0;
        this.isInputBlocked = true;
    }

    init() {
        this.container.innerHTML = `
            <div class="simon-container">
                <div class="simon-score">Round: <span id="simon-round">0</span></div>
                <div class="simon-board">
                    <div class="simon-btn green" data-color="green"></div>
                    <div class="simon-btn red" data-color="red"></div>
                    <div class="simon-btn yellow" data-color="yellow"></div>
                    <div class="simon-btn blue" data-color="blue"></div>
                    <div class="simon-center">
                        <div id="simon-msg">Watch</div>
                    </div>
                </div>
            </div>
            <style>
                .simon-container { display: flex; flex-direction: column; align-items: center; gap: 2rem; }
                .simon-score { font-size: 1.5rem; color: var(--accent); }
                .simon-board { 
                    width: 300px; height: 300px; border-radius: 50%; 
                    display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;
                    overflow: hidden; padding: 10px; gap: 10px; background: rgba(255,255,255,0.1);
                    position: relative;
                }
                .simon-btn { 
                    background: currentColor; opacity: 0.6; cursor: pointer; border-radius: 10px;
                    transition: opacity 0.1s, transform 0.1s;
                }
                .simon-btn.green { color: #22c55e; }
                .simon-btn.red { color: #ef4444; }
                .simon-btn.yellow { color: #eab308; }
                .simon-btn.blue { color: #3b82f6; }
                
                .simon-btn:active, .simon-btn.active { opacity: 1; transform: scale(0.98); box-shadow: 0 0 20px currentColor; }
                
                .simon-center {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 100px; height: 100px; background: var(--bg-dark); border-radius: 50%;
                    display: flex; justify-content: center; align-items: center;
                    border: 4px solid rgba(255,255,255,0.1);
                }
                #simon-msg { font-size: 1.2rem; text-transform: uppercase; font-weight: bold; }
            </style>
        `;

        this.ui = {
            round: this.container.querySelector('#simon-round'),
            msg: this.container.querySelector('#simon-msg'),
            btns: this.container.querySelectorAll('.simon-btn')
        };

        this.ui.btns.forEach(btn => {
            btn.addEventListener('mousedown', () => this.handleInput(btn.dataset.color));
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleInput(btn.dataset.color); });
        });
    }

    start() {
        super.start();
        this.sequence = [];
        this.playerSequence = [];
        this.round = 0;
        this.updateScore(0);
        this.nextRound();
    }

    nextRound() {
        this.round++;
        this.ui.round.textContent = this.round;
        this.playerSequence = [];
        this.isInputBlocked = true;
        this.ui.msg.textContent = 'Watch';

        // Add random color
        this.sequence.push(this.colors[Math.floor(Math.random() * 4)]);

        // Play sequence
        let interval = 800;
        if (this.config.difficulty === 'medium') interval = 600;
        if (this.config.difficulty === 'hard') interval = 400;

        let i = 0;
        const playStep = () => {
            if (i >= this.sequence.length) {
                this.isInputBlocked = false;
                this.ui.msg.textContent = 'Go!';
                return;
            }
            this.activateBtn(this.sequence[i]);
            i++;
            setTimeout(playStep, interval);
        };

        setTimeout(playStep, 1000);
    }

    activateBtn(color) {
        const btn = this.container.querySelector(`.simon-btn.${color}`);
        btn.classList.add('active');
        // Add Sound here if we had sounds
        setTimeout(() => btn.classList.remove('active'), 300);
    }

    handleInput(color) {
        if (!this.isPlaying || this.isInputBlocked) return;

        this.activateBtn(color);
        this.playerSequence.push(color);

        const index = this.playerSequence.length - 1;

        if (this.playerSequence[index] !== this.sequence[index]) {
            this.gameOver({ score: (this.round - 1) * 100, won: false });
        } else {
            if (this.playerSequence.length === this.sequence.length) {
                this.score += 100;
                this.updateScore(this.score);
                this.isInputBlocked = true;
                this.ui.msg.textContent = 'Good!';
                setTimeout(() => this.nextRound(), 1000);
            }
        }
    }
}
