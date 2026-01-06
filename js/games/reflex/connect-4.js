import { Game } from '../../game-interface.js';

export default class Connect4Game extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.rows = 6;
        this.cols = 7;
        this.board = [];
        this.currentPlayer = 1; // 1 = Player (Red), 2 = AI (Yellow)
        this.gameActive = false;
    }

    init() {
        this.container.innerHTML = `
            <div class="c4-container">
                <div class="c4-status" id="c4-status">Your Turn (Red)</div>
                <div class="c4-board-wrapper">
                    <div class="c4-board" id="c4-board"></div>
                    <div class="c4-overlay" id="c4-overlay"></div>
                </div>
            </div>
            <style>
                .c4-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .c4-status { font-size: 1.5rem; color: var(--accent); font-weight: bold; }
                
                .c4-board-wrapper { position: relative; width: 320px; height: 275px; } /* 7 cols * 45px approx */

                .c4-board { 
                    display: grid; grid-template-columns: repeat(7, 40px); grid-template-rows: repeat(6, 40px); gap: 5px;
                    background: var(--glass-border); padding: 5px; border-radius: 8px;
                    position: relative; z-index: 10;
                }
                
                .c4-cell {
                    width: 40px; height: 40px; 
                    background: rgba(15, 23, 42, 0.8); /* Dark background for holes */
                    border-radius: 50%;
                    cursor: pointer; 
                    /* Transparent hole punch effect logic is hard in pure CSS grid without complex masking. 
                       Instead, we'll put the falling pieces *behind* the board? 
                       No, standard is pieces fall *into* slots. */
                    position: relative;
                    overflow: hidden;
                }
                
                /* Piece styling */
                .c4-piece {
                    position: absolute; width: 40px; height: 40px; border-radius: 50%;
                    transition: top 0.5s cubic-bezier(0.5, 0, 0.5, 1); /* Bounce effect */
                    z-index: 5;
                    box-shadow: inset -2px -2px 5px rgba(0,0,0,0.5);
                }
                .c4-piece.p1 { background: var(--danger); }
                .c4-piece.p2 { background: var(--secondary); }
                
                /* We will append pieces to c4-overlay which is ON TOP strictly for clicking?
                   No, pieces should be inside the relevant cell? 
                   If we want animation from top, we can't easily put them in the grid cells unless we animate 'height' or 'transform' relative to cell.
                   
                   Better approach: Absolute pieces container.
                */
                .c4-wrapper-inner {
                    position: relative;
                }

                /* Revert to simple "Appear" but with animation class */
                .c4-cell::after {
                    content: ''; position: absolute; top: -300px; left: 0; width: 100%; height: 100%; border-radius: 50%;
                    transition: top 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                }
                .c4-cell.p1::after { background: var(--danger); top: 0; box-shadow: inset -2px -2px 5px rgba(0,0,0,0.5); }
                .c4-cell.p2::after { background: var(--secondary); top: 0; box-shadow: inset -2px -2px 5px rgba(0,0,0,0.5); }
                
                .c4-cell:hover { background: rgba(255,255,255,0.1); }
            </style>
        `;

        this.ui = {
            board: this.container.querySelector('#c4-board'),
            status: this.container.querySelector('#c4-status')
        };

        this.renderBoard();
    }

    start() {
        super.start();
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.currentPlayer = 1;
        this.gameActive = true;
        this.updateScore(0);
        this.ui.status.textContent = 'Your Turn (Red)';
        this.renderBoard();
    }

    renderBoard() {
        this.ui.board.innerHTML = '';
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'c4-cell';
                if (this.board[r][c] === 1) cell.classList.add('p1');
                if (this.board[r][c] === 2) cell.classList.add('p2');

                cell.onclick = () => this.handleDrop(c);
                this.ui.board.appendChild(cell);
            }
        }
    }

    updateBoardUI(r, c, player) {
        const idx = r * this.cols + c;
        const cell = this.ui.board.children[idx];

        // Remove old classes to reset animation
        cell.classList.remove('p1', 'p2');

        // Force reflow
        void cell.offsetWidth;

        // Add new class
        cell.classList.add(`p${player}`);
    }

    handleDrop(col) {
        console.log('Connect4 Clicked Col:', col, 'Active:', this.gameActive, 'Player:', this.currentPlayer);
        if (!this.gameActive || this.currentPlayer !== 1) return;

        if (this.dropPiece(col, 1)) {
            if (this.checkWin(1)) {
                this.gameActive = false;
                this.ui.status.textContent = 'You Win!';
                this.gameOver({ score: 500, won: true });
            } else if (this.checkDraw()) {
                this.gameActive = false;
                this.ui.status.textContent = 'Draw!';
                this.gameOver({ score: 250, won: true });
            } else {
                this.currentPlayer = 2;
                this.ui.status.textContent = 'AI Thinking...';
                setTimeout(() => this.aiMove(), 500);
            }
        }
    }

    dropPiece(col, player) {
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r][col] === 0) {
                this.board[r][col] = player;
                this.updateBoardUI(r, col, player);
                return true;
            }
        }
        return false;
    }

    aiMove() {
        if (!this.gameActive) return;

        let col = this.getBestMove();

        if (this.dropPiece(col, 2)) {
            if (this.checkWin(2)) {
                this.gameActive = false;
                this.ui.status.textContent = 'AI Wins!';
                this.gameOver({ score: 50, won: false });
            } else if (this.checkDraw()) {
                this.gameActive = false;
                this.ui.status.textContent = 'Draw!';
                this.gameOver({ score: 250, won: true });
            } else {
                this.currentPlayer = 1;
                this.ui.status.textContent = 'Your Turn (Red)';
            }
        }
    }

    getBestMove() {
        // Simple Logic + Randomness
        const validCols = [];
        for (let c = 0; c < this.cols; c++) {
            if (this.board[0][c] === 0) validCols.push(c);
        }

        // Try to win or block
        for (let c of validCols) {
            let r = this.getFreeRow(c);
            // Simulate AI Win
            this.board[r][c] = 2;
            if (this.checkWin(2)) { this.board[r][c] = 0; return c; }
            this.board[r][c] = 0;

            // Simulate Block Player Win
            this.board[r][c] = 1;
            if (this.checkWin(1)) { this.board[r][c] = 0; return c; }
            this.board[r][c] = 0;
        }

        return validCols[Math.floor(Math.random() * validCols.length)];
    }

    getFreeRow(col) {
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r][col] === 0) return r;
        }
        return -1;
    }

    checkWin(player) {
        // Horizontal
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols - 3; c++) {
                if (this.checkLine(r, c, 0, 1, player)) return true;
            }
        }
        // Vertical
        for (let r = 0; r < this.rows - 3; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.checkLine(r, c, 1, 0, player)) return true;
            }
        }
        // Diagonal /
        for (let r = 3; r < this.rows; r++) {
            for (let c = 0; c < this.cols - 3; c++) {
                if (this.checkLine(r, c, -1, 1, player)) return true;
            }
        }
        // Diagonal \
        for (let r = 0; r < this.rows - 3; r++) {
            for (let c = 0; c < this.cols - 3; c++) {
                if (this.checkLine(r, c, 1, 1, player)) return true;
            }
        }
        return false;
    }

    checkLine(r, c, dr, dc, player) {
        return this.board[r][c] === player &&
            this.board[r + dr][c + dc] === player &&
            this.board[r + 2 * dr][c + 2 * dc] === player &&
            this.board[r + 3 * dr][c + 3 * dc] === player;
    }

    checkDraw() {
        return this.board[0].every(cell => cell !== 0);
    }
}
