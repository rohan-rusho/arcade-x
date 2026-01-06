import { Game } from '../../game-interface.js';

export default class MinesweeperGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.rows = 8;
        this.cols = 8;
        this.mines = 10;
        this.board = []; // Array of { isMine, isOpen, isFlagged, count }
        this.flags = 0;
        this.isFirstClick = true;
    }

    init() {
        this.container.innerHTML = `
            <div class="ms-container">
                <div class="ms-header">
                    <div>Mines: <span id="ms-mines">10</span></div>
                    <div>Flags: <span id="ms-flags">0</span></div>
                </div>
                <div id="ms-grid" class="ms-grid"></div>
            </div>
            <style>
                .ms-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .ms-header { display: flex; gap: 2rem; font-size: 1.2rem; color: var(--text-muted); }
                .ms-grid { 
                    display: grid; gap: 2px; 
                    background: var(--glass-border); padding: 2px; border-radius: 4px;
                }
                .ms-cell {
                    width: 30px; height: 30px; background: rgba(255,255,255,0.1);
                    display: flex; justify-content: center; align-items: center;
                    font-size: 1rem; font-weight: bold; cursor: pointer; color: white;
                    user-select: none;
                }
                .ms-cell:hover:not(.open) { background: rgba(255,255,255,0.2); }
                .ms-cell.open { background: rgba(0,0,0,0.2); cursor: default; }
                .ms-cell.flagged { color: var(--accent); }
                .ms-cell.mine { background: var(--danger); color: white; }
                
                .c-1 { color: #60a5fa; }
                .c-2 { color: #34d399; }
                .c-3 { color: #f472b6; }
                .c-4 { color: #a78bfa; }
                .c-5 { color: #fbbf24; }
                .c-6 { color: #f87171; }
                .c-7 { color: white; }
                .c-8 { color: white; }
            </style>
        `;

        this.ui = {
            grid: this.container.querySelector('#ms-grid'),
            minesCount: this.container.querySelector('#ms-mines'),
            flagsCount: this.container.querySelector('#ms-flags')
        };
    }

    start() {
        super.start();
        this.isFirstClick = true;
        this.flags = 0;

        // Difficulty
        if (this.config.difficulty === 'easy') { this.rows = 8; this.cols = 8; this.mines = 10; }
        else if (this.config.difficulty === 'medium') { this.rows = 10; this.cols = 10; this.mines = 18; }
        else { this.rows = 12; this.cols = 12; this.mines = 25; }

        this.ui.minesCount.textContent = this.mines;
        this.ui.flagsCount.textContent = 0;

        this.initBoard();
        this.render();
    }

    initBoard() {
        this.board = Array(this.rows * this.cols).fill(null).map(() => ({
            isMine: false,
            isOpen: false,
            isFlagged: false,
            count: 0
        }));

        // Don't place mines yet. Place on first click.
    }

    placeMines(excludeIndex) {
        let placed = 0;
        while (placed < this.mines) {
            const idx = Math.floor(Math.random() * this.board.length);
            if (idx !== excludeIndex && !this.board[idx].isMine) {
                this.board[idx].isMine = true;
                placed++;
            }
        }

        // Calculate counts
        this.board.forEach((cell, idx) => {
            if (!cell.isMine) {
                cell.count = this.countNeighbors(idx);
            }
        });
    }

    countNeighbors(idx) {
        const row = Math.floor(idx / this.cols);
        const col = idx % this.cols;
        let count = 0;

        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    if (this.board[r * this.cols + c].isMine) count++;
                }
            }
        }
        return count;
    }

    render() {
        this.ui.grid.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
        this.ui.grid.innerHTML = '';

        this.board.forEach((cell, idx) => {
            const el = document.createElement('div');
            el.className = `ms-cell ${cell.isOpen ? 'open' : ''} ${cell.isFlagged ? 'flagged' : ''}`;

            if (cell.isOpen) {
                if (cell.isMine) {
                    el.classList.add('mine');
                    el.innerHTML = '<i class="fa-solid fa-bomb"></i>';
                } else if (cell.count > 0) {
                    el.textContent = cell.count;
                    el.classList.add(`c-${cell.count}`);
                }
            } else if (cell.isFlagged) {
                el.innerHTML = '<i class="fa-solid fa-flag"></i>';
            }

            el.oncontextmenu = (e) => {
                e.preventDefault();
                this.toggleFlag(idx);
            };

            el.onclick = () => this.openCell(idx);

            this.ui.grid.appendChild(el);
        });
    }

    toggleFlag(idx) {
        if (!this.isPlaying || this.board[idx].isOpen) return;

        if (this.board[idx].isFlagged) {
            this.board[idx].isFlagged = false;
            this.flags--;
        } else {
            if (this.flags < this.mines) {
                this.board[idx].isFlagged = true;
                this.flags++;
            }
        }
        this.ui.flagsCount.textContent = this.flags;
        this.render(); // Optimize: Render only single cell
    }

    openCell(idx) {
        if (!this.isPlaying || this.board[idx].isOpen || this.board[idx].isFlagged) return;

        if (this.isFirstClick) {
            this.placeMines(idx);
            this.isFirstClick = false;
        }

        const cell = this.board[idx];
        cell.isOpen = true;

        if (cell.isMine) {
            this.gameOver({ score: 0, won: false });
            this.revealAll();
        } else {
            if (cell.count === 0) {
                this.floodFill(idx);
            }
            this.render(); // Optimize?

            if (this.checkWin()) {
                this.gameOver({ score: this.mines * 100, won: true });
                this.revealAll();
            }
        }
    }

    floodFill(idx) {
        const row = Math.floor(idx / this.cols);
        const col = idx % this.cols;

        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    const nIdx = r * this.cols + c;
                    const neighbor = this.board[nIdx];
                    if (!neighbor.isOpen && !neighbor.isMine && !neighbor.isFlagged) {
                        neighbor.isOpen = true;
                        if (neighbor.count === 0) {
                            this.floodFill(nIdx);
                        }
                    }
                }
            }
        }
    }

    revealAll() {
        this.board.forEach(c => c.isOpen = true);
        this.render();
    }

    checkWin() {
        return this.board.every(cell => cell.isMine || cell.isOpen);
    }
}
