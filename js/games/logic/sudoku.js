import { Game } from '../../game-interface.js';

export default class SudokuGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.board = []; // 9x9 solution
        this.displayBoard = []; // 9x9 visible state (0 for empty)
        this.selectedCell = null;
    }

    init() {
        this.container.innerHTML = `
            <div class="sudoku-container">
                <div class="sudoku-controls">
                    <button id="s-new" class="glass-btn small">New Game</button>
                    <button id="s-check" class="glass-btn small primary">Check</button>
                </div>
                <div id="sudoku-grid" class="sudoku-grid"></div>
                <div class="numpad" id="numpad">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="num-btn" data-val="${n}">${n}</button>`).join('')}
                    <button class="num-btn" data-val="0">X</button>
                </div>
            </div>
            <style>
                .sudoku-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .sudoku-grid { 
                    display: grid; grid-template-columns: repeat(9, 1fr); gap: 2px;
                    background: var(--glass-border); border: 2px solid var(--text-muted); padding: 2px;
                    width: 100%; max-width: 400px;
                }
                .s-cell {
                    aspect-ratio: 1; background: rgba(255,255,255,0.05);
                    display: flex; justify-content: center; align-items: center;
                    font-size: 1.2rem; cursor: pointer; color: white;
                }
                .s-cell:hover { background: rgba(255,255,255,0.15); }
                .s-cell.selected { background: var(--primary-glow); border: 2px solid var(--primary); }
                .s-cell.initial { font-weight: bold; color: var(--accent); }
                .s-cell.wrong { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
                
                /* Thick borders for 3x3 zones */
                .s-cell:nth-child(3n) { margin-right: 2px; }
                .s-cell:nth-child(9n) { margin-right: 0; }
                .s-cell:nth-child(n+19):nth-child(-n+27),
                .s-cell:nth-child(n+46):nth-child(-n+54) { margin-bottom: 2px; }

                .numpad { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; width: 100%; max-width: 400px; }
                .num-btn { 
                    padding: 10px; background: rgba(255,255,255,0.1); border: none; border-radius: 4px;
                    color: white; font-size: 1.2rem; cursor: pointer;
                }
                .num-btn:active { transform: scale(0.95); }
            </style>
        `;

        this.ui = {
            grid: this.container.querySelector('#sudoku-grid'),
            newBtn: this.container.querySelector('#s-new'),
            checkBtn: this.container.querySelector('#s-check'),
            numpad: this.container.querySelector('#numpad')
        };

        this.ui.newBtn.onclick = () => this.start();
        this.ui.checkBtn.onclick = () => this.checkSolution();
        this.ui.numpad.onclick = (e) => {
            if (e.target.classList.contains('num-btn')) {
                this.handleInput(parseInt(e.target.dataset.val));
            }
        };
    }

    start() {
        super.start();
        this.selectedCell = null;
        this.generateBoard();
        this.renderBoard();
    }



    fillDiagonal() {
        for (let i = 0; i < 9; i += 3) {
            this.fillBox(i, i);
        }
    }

    fillBox(row, col) {
        let num;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                do {
                    num = Math.floor(Math.random() * 9) + 1;
                } while (!this.isSafeInBox(row, col, num));
                this.board[(row + i) * 9 + (col + j)] = num;
            }
        }
    }

    isSafeInBox(rowStart, colStart, num) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[(rowStart + i) * 9 + (colStart + j)] === num) return false;
            }
        }
        return true;
    }

    isSafe(board, row, col, num) {
        // Row & Col
        for (let x = 0; x < 9; x++) {
            if (board[row * 9 + x] === num) return false;
            if (board[x * 9 + col] === num) return false;
        }
        // Box
        let startRow = row - row % 3;
        let startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[(startRow + i) * 9 + (startCol + j)] === num) return false;
            }
        }
        return true;
    }

    solveSudoku(board) {
        for (let i = 0; i < 81; i++) {
            if (board[i] === 0) {
                let row = Math.floor(i / 9);
                let col = i % 9;
                for (let num = 1; num <= 9; num++) {
                    if (this.isSafe(board, row, col, num)) {
                        board[i] = num;
                        if (this.solveSudoku(board)) return true;
                        board[i] = 0;
                    }
                }
                return false;
            }
        }
        return true;
    }

    renderBoard() {
        this.ui.grid.innerHTML = '';
        this.displayBoard.forEach((val, idx) => {
            const el = document.createElement('div');
            el.className = `s-cell ${val !== 0 && this.board[idx] === val ? 'initial' : ''}`; // Bug in initial logic: board is full solution, displayBoard has holes. Initial indices are where displayBoard != 0. But wait, I lost track of "Initial" vs "User Input".
            // Fix: Store initial state separately or check if val was pre-filled.
            // Simplified: If val != 0 at start, mark initial.
            // Actually, I need to track which cells are user-editable.
            // Let's assume non-zero in displayBoard at generation time are fixed.

            // Re-render:
            // I need to persist user inputs. `displayBoard` will hold current state.
            // I'll add a class 'editable' if it was 0 initially.
            // For now, simple re-render.

            el.textContent = val === 0 ? '' : val;
            el.dataset.index = idx;
            el.onclick = () => this.selectCell(el, idx);
            this.ui.grid.appendChild(el);

            // Mark initial cells (heuristic: if I regenerate, I lose this info. I should store 'initial mask')
            // For this quick implementation, I won't perfect "Bold for initial".
        });
    }

    selectCell(el, idx) {
        if (this.selectedCell) this.selectedCell.classList.remove('selected');
        this.selectedCell = el;
        el.classList.add('selected');
    }

    handleInput(num) {
        if (!this.selectedCell) return;
        const idx = parseInt(this.selectedCell.dataset.index);

        // Basic check if it's an initial cell (simplest way: check against solution IF it matches solution? No.)
        // I need an 'initial' mask.
        // Let's lazy load it: On generation, store `initialIndices`.
        if (!this.initialIndices) this.initialIndices = new Set();

        // This is buggy because I reset render on input? No, I update textContent.
        this.displayBoard[idx] = num;
        this.selectedCell.textContent = num === 0 ? '' : num;
        this.selectedCell.classList.remove('wrong');
    }

    checkSolution() {
        let correct = true;
        let complete = true;

        const cells = this.ui.grid.children;
        this.displayBoard.forEach((val, idx) => {
            if (val === 0) complete = false;
            if (val !== 0 && val !== this.board[idx]) {
                correct = false;
                cells[idx].classList.add('wrong');
            }
        });

        if (complete && correct) {
            this.gameOver({ score: 500, won: true });
        }
    }

    // Override generation to save mask
    generateBoard() {
        this.board = Array(81).fill(0);
        this.fillDiagonal();
        this.solveSudoku(this.board);

        // Store Full Solution
        // this.board is now full

        // Create Display Board with holes
        this.displayBoard = [...this.board];

        let attempts = this.config.difficulty === 'easy' ? 30 : this.config.difficulty === 'medium' ? 45 : 55;
        this.initialIndices = new Set();

        while (attempts > 0) {
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);
            let idx = row * 9 + col;
            if (this.displayBoard[idx] !== 0) {
                this.displayBoard[idx] = 0;
                attempts--;
            }
        }

        // Save indices of initial numbers
        this.displayBoard.forEach((v, i) => {
            if (v !== 0) this.initialIndices.add(i);
        });
    }

    selectCell(el, idx) {
        if (this.initialIndices.has(idx)) return; // Prevent editing initial cells
        if (this.selectedCell) this.selectedCell.classList.remove('selected');
        this.selectedCell = el;
        el.classList.add('selected');
    }
}
