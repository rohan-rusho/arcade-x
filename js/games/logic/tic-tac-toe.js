import { Game } from '../../game-interface.js';

export default class TicTacToeGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X'; // User is always X for simplicity? Or toss? Let's say User X, AI O.
        this.gameActive = false;
        this.winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
    }

    init() {
        this.container.innerHTML = `
            <div class="ttt-container">
                <div class="ttt-status" id="ttt-status">Your Turn (X)</div>
                <div class="ttt-grid" id="ttt-grid"></div>
            </div>
            <style>
                .ttt-container { display: flex; flex-direction: column; align-items: center; gap: 2rem; }
                .ttt-status { font-size: 1.5rem; color: var(--accent); font-weight: bold; }
                .ttt-grid { display: grid; grid-template-columns: repeat(3, 100px); grid-template-rows: repeat(3, 100px); gap: 10px; }
                .ttt-cell { 
                    width: 100px; height: 100px; background: rgba(255,255,255,0.05); 
                    border-radius: 12px; display: flex; justify-content: center; align-items: center;
                    font-size: 3rem; font-weight: 800; cursor: pointer; transition: 0.2s;
                }
                .ttt-cell:hover:not(.taken) { background: rgba(255,255,255,0.15); }
                .ttt-cell.x { color: var(--accent); }
                .ttt-cell.o { color: var(--secondary); }
                .ttt-cell.win { background: var(--success); color: white; }
            </style>
        `;
        this.ui = {
            grid: this.container.querySelector('#ttt-grid'),
            status: this.container.querySelector('#ttt-status')
        };
        this.renderGrid();
    }

    start() {
        super.start();
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.updateScore(0);
        this.ui.status.textContent = 'Your Turn (X)';
        this.renderGrid();
    }

    renderGrid() {
        this.ui.grid.innerHTML = '';
        this.board.forEach((cell, index) => {
            const el = document.createElement('div');
            el.className = `ttt-cell ${cell ? cell.toLowerCase() : ''} ${cell ? 'taken' : ''}`;
            el.textContent = cell || '';
            el.onclick = () => this.handleCellClick(index);
            this.ui.grid.appendChild(el);
        });
    }

    handleCellClick(index) {
        if (!this.gameActive || this.board[index] || this.currentPlayer !== 'X') return;

        this.makeMove(index, 'X');

        if (this.gameActive) {
            this.ui.status.textContent = 'AI Thinking...';
            setTimeout(() => this.aiMove(), 500);
        }
    }

    makeMove(index, player) {
        this.board[index] = player;
        this.renderGrid();

        const winner = this.checkWin();
        if (winner) {
            this.gameActive = false;
            if (winner === 'Draw') {
                this.ui.status.textContent = "It's a Draw!";
                setTimeout(() => this.gameOver({ score: 50, won: true }), 1000);
            } else {
                this.ui.status.textContent = `${winner} Wins!`;

                // Highlight win
                this.highlightWin(winner);

                const score = winner === 'X' ? 100 : 0;
                setTimeout(() => this.gameOver({ score: score, won: winner === 'X' }), 1000);
            }
        } else {
            this.currentPlayer = player === 'X' ? 'O' : 'X';
            if (this.currentPlayer === 'X') this.ui.status.textContent = 'Your Turn (X)';
        }
    }

    aiMove() {
        if (!this.gameActive) return;

        const diff = this.config.difficulty;
        let move;

        if (diff === 'easy') {
            move = this.getRandomMove();
        } else if (diff === 'medium') {
            // 50% chance optimal, 50% random
            move = Math.random() > 0.5 ? this.getBestMove() : this.getRandomMove();
        } else {
            move = this.getBestMove();
        }

        if (move !== undefined) {
            this.makeMove(move, 'O');
        }
    }

    getRandomMove() {
        const available = this.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        return available[Math.floor(Math.random() * available.length)];
    }

    getBestMove() {
        // Minimax
        let bestScore = -Infinity;
        let move;
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === null) {
                this.board[i] = 'O';
                let score = this.minimax(this.board, 0, false);
                this.board[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }

    minimax(board, depth, isMaximizing) {
        let result = this.checkWinState(board);
        if (result !== null) {
            return result === 'O' ? 10 - depth : result === 'X' ? depth - 10 : 0;
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'O';
                    let score = this.minimax(board, depth + 1, false);
                    board[i] = null;
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'X';
                    let score = this.minimax(board, depth + 1, true);
                    board[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    checkWin() {
        return this.checkWinState(this.board);
    }

    checkWinState(board) {
        for (let condition of this.winConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        if (!board.includes(null)) return 'Draw';
        return null;
    }

    highlightWin(winner) {
        for (let condition of this.winConditions) {
            const [a, b, c] = condition;
            if (this.board[a] === winner && this.board[b] === winner && this.board[c] === winner) {
                this.ui.grid.children[a].classList.add('win');
                this.ui.grid.children[b].classList.add('win');
                this.ui.grid.children[c].classList.add('win');
            }
        }
    }
}
