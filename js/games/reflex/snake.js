import { Game } from '../../game-interface.js';

export default class SnakeGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.boardSize = 20; // 20x20 grid
        this.snake = [];
        this.food = null;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.score = 0;
        this.speed = 150;
        this.gameLoop = null;
    }

    init() {
        this.container.innerHTML = `
            <div class="snake-container">
                <div class="snake-score">Score: <span id="snake-score">0</span></div>
                <div id="snake-grid" class="snake-grid"></div>
                <div class="snake-controls">Use Arrow Keys or Swipe</div>
            </div>
            <style>
                .snake-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .snake-score { font-size: 1.5rem; color: var(--accent); }
                .snake-grid { 
                    display: grid; grid-template-columns: repeat(20, 15px); grid-template-rows: repeat(20, 15px); 
                    background: rgba(0,0,0,0.3); border: 2px solid var(--glass-border);
                }
                .snake-cell { width: 15px; height: 15px; border-radius: 2px; }
                .snake-cell.body { background: var(--primary); }
                .snake-cell.head { background: #fff; }
                .snake-cell.food { background: var(--apple); box-shadow: 0 0 5px var(--apple); border-radius: 50%; }
                
                /* Colors check */
                :root { --apple: #f87171; }
            </style>
        `;

        this.ui = {
            grid: this.container.querySelector('#snake-grid'),
            score: this.container.querySelector('#snake-score')
        };

        this.handleKey = this.handleKey.bind(this);
        document.addEventListener('keydown', this.handleKey);

        // Setup Grid
        this.renderGrid();
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKey);
        super.destroy();
    }

    renderGrid() {
        this.ui.grid.innerHTML = '';
        for (let i = 0; i < 400; i++) {
            const cell = document.createElement('div');
            cell.className = 'snake-cell';
            this.ui.grid.appendChild(cell);
        }
    }

    start() {
        super.start();
        this.snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
        this.direction = { x: 0, y: -1 }; // Moving Up
        this.nextDirection = { x: 0, y: -1 };
        this.score = 0;
        this.updateScore(0);

        if (this.config.difficulty === 'easy') this.speed = 200;
        else if (this.config.difficulty === 'medium') this.speed = 150;
        else this.speed = 80;

        this.placeFood();
        this.startGameLoop();
    }

    stop() {
        super.stop();
        clearTimeout(this.gameLoop);
    }

    startGameLoop() {
        this.gameLoop = setTimeout(() => {
            this.update();
            if (this.isPlaying) this.startGameLoop();
        }, this.speed);
    }

    handleKey(e) {
        switch (e.key) {
            case 'ArrowUp':
                if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
                if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
                if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
                if (this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
                break;
        }
    }

    update() {
        this.direction = this.nextDirection;

        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Wall Collision
        if (head.x < 0 || head.x >= this.boardSize || head.y < 0 || head.y >= this.boardSize) {
            this.gameOver({ score: this.score, won: false });
            return;
        }

        // Self Collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver({ score: this.score, won: false });
            return;
        }

        this.snake.unshift(head);

        // Food Collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore(this.score);
            this.ui.score.textContent = this.score;
            this.placeFood();
            // Speed up slightly?
            if (this.speed > 50) this.speed -= 2;
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    placeFood() {
        let valid = false;
        while (!valid) {
            this.food = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
            valid = !this.snake.some(s => s.x === this.food.x && s.y === this.food.y);
        }
    }

    draw() {
        // Clear previous
        const cells = this.ui.grid.children;
        for (let i = 0; i < cells.length; i++) {
            cells[i].className = 'snake-cell';
        }

        // Draw Snake
        this.snake.forEach((seg, i) => {
            const idx = seg.y * this.boardSize + seg.x;
            if (cells[idx]) {
                cells[idx].classList.add(i === 0 ? 'head' : 'body');
            }
        });

        // Draw Food
        const fIdx = this.food.y * this.boardSize + this.food.x;
        if (cells[fIdx]) cells[fIdx].classList.add('food');
    }
}
