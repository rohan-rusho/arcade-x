import { Game } from '../../game-interface.js';

class Tile {
    constructor(position, value) {
        this.x = position.x;
        this.y = position.y;
        this.value = value || 2;
        this.previousPosition = null;
        this.mergedFrom = null;
        this.id = Math.random().toString(36).substr(2, 9);
    }

    savePosition() {
        this.previousPosition = { x: this.x, y: this.y };
    }

    updatePosition(position) {
        this.x = position.x;
        this.y = position.y;
    }
}

export default class Game2048 extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.over = false;
        this.won = false;
        this.domTiles = new Map(); // Map<id, HTMLElement>
    }

    init() {
        this.container.innerHTML = `
            <div class="g2048-container">
                <div class="score-box">Score: <span id="g2048-score">0</span></div>
                <div class="game-area">
                    <div class="grid-container">
                        ${Array(16).fill('<div class="grid-cell"></div>').join('')}
                    </div>
                    <div class="tile-container" id="tile-container"></div>
                </div>
                <div class="instructions">Use Arrow Keys or Swipe</div>
            </div>
            <style>
                .g2048-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .score-box { font-size: 1.5rem; color: var(--accent); font-weight: bold; }
                
                .game-area {
                    position: relative;
                    padding: 10px;
                    background: #bbada0;
                    border-radius: 6px;
                    width: 370px; height: 370px;
                    box-sizing: border-box;
                    touch-action: none;
                }

                .grid-container {
                    display: grid;
                    grid-template-columns: repeat(4, 80px);
                    grid-template-rows: repeat(4, 80px);
                    gap: 10px;
                }

                .grid-cell {
                    width: 80px; height: 80px;
                    background: rgba(238, 228, 218, 0.35);
                    border-radius: 4px;
                }

                .tile-container {
                    position: absolute;
                    top: 10px; left: 10px;
                    width: 350px; height: 350px; /* Exact content size */
                    pointer-events: none;
                    z-index: 10;
                }

                .tile {
                    position: absolute;
                    width: 80px; height: 80px;
                    border-radius: 4px;
                    background: #eee4da;
                    color: #776e65;
                    font-weight: bold;
                    font-size: 2rem;
                    display: flex; justify-content: center; align-items: center;
                    transition: transform 100ms ease-in-out;
                    z-index: 10;
                    will-change: transform;
                    box-sizing: border-box; /* Ensure borders don't break size */
                }
                
                .tile[data-val="2"] { background: #eee4da; }
                .tile[data-val="4"] { background: #ede0c8; }
                .tile[data-val="8"] { background: #f2b179; color: #f9f6f2; }
                .tile[data-val="16"] { background: #f59563; color: #f9f6f2; }
                .tile[data-val="32"] { background: #f67c5f; color: #f9f6f2; }
                .tile[data-val="64"] { background: #f65e3b; color: #f9f6f2; }
                .tile[data-val="128"] { background: #edcf72; color: #f9f6f2; font-size: 1.5rem; }
                .tile[data-val="256"] { background: #edcc61; color: #f9f9f2; font-size: 1.5rem; }
                .tile[data-val="512"] { background: #edc850; color: #f9f6f2; font-size: 1.5rem; }
                .tile[data-val="1024"] { background: #edc53f; color: #f9f6f2; font-size: 1.2rem; }
                .tile[data-val="2048"] { background: #edc22e; color: #f9f6f2; font-size: 1.2rem; box-shadow: 0 0 20px #edc22e; }

                .tile-new { animation: pop 200ms ease 100ms backwards; }
                .tile-merged { z-index: 20; animation: pop 200ms ease 100ms backwards; }

                @keyframes pop {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            </style>
        `;

        this.ui = {
            tileContainer: this.container.querySelector('#tile-container'),
            score: this.container.querySelector('#g2048-score')
        };

        this.handleInput = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInput);
        this.setupTouch();
    }

    setupTouch() {
        let touchStart = { x: 0, y: 0 };
        this.container.addEventListener('touchstart', e => {
            touchStart.x = e.changedTouches[0].clientX;
            touchStart.y = e.changedTouches[0].clientY;
        }, { passive: false });

        this.container.addEventListener('touchend', e => {
            e.preventDefault();
            const dx = e.changedTouches[0].clientX - touchStart.x;
            const dy = e.changedTouches[0].clientY - touchStart.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) > 30) {
                if (absDx > absDy) {
                    if (dx > 0) this.move(1); // Right
                    else this.move(3); // Left
                } else {
                    if (dy > 0) this.move(2); // Down
                    else this.move(0); // Up
                }
            }
        }, { passive: false });
    }

    destroy() {
        document.removeEventListener('keydown', this.handleInput);
        this.domTiles.clear();
        super.destroy();
    }

    start() {
        super.start();
        this.domTiles.clear();
        this.setup();
    }

    setup() {
        this.grid = this.emptyGrid();
        this.score = 0;
        this.over = false;
        this.won = false;
        this.addRandomTile();
        this.addRandomTile();
        this.ui.score.textContent = 0;
        this.actuate();
    }

    emptyGrid() {
        const grid = [];
        for (let i = 0; i < this.size; i++) {
            grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                grid[i][j] = null;
            }
        }
        return grid;
    }

    addRandomTile() {
        if (!this.cellsAvailable()) return;
        const cell = this.randomAvailableCell();
        const tile = new Tile(cell, Math.random() < 0.9 ? 2 : 4);
        this.insertTile(tile);
    }

    eachCell(callback) {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                callback(x, y, this.grid[x][y]);
            }
        }
    }

    cellsAvailable() {
        return !!this.availableCells().length;
    }

    availableCells() {
        const cells = [];
        this.eachCell((x, y, tile) => {
            if (!tile) cells.push({ x, y });
        });
        return cells;
    }

    randomAvailableCell() {
        const cells = this.availableCells();
        if (cells.length) return cells[Math.floor(Math.random() * cells.length)];
    }

    insertTile(tile) {
        this.grid[tile.x][tile.y] = tile;
    }

    removeTile(tile) {
        this.grid[tile.x][tile.y] = null;
    }

    actuate() {
        window.requestAnimationFrame(() => {
            const visibleIds = new Set();

            this.eachCell((x, y, tile) => {
                if (tile) {
                    this.syncTileDom(tile);
                    visibleIds.add(tile.id);

                    if (tile.mergedFrom) {
                        tile.mergedFrom.forEach(merged => {
                            this.syncTileDom(merged, tile);
                            visibleIds.add(merged.id);
                        });
                    }
                }
            });

            this.ui.score.textContent = this.score;

            // Remove stale tiles
            for (const [id, el] of this.domTiles) {
                if (!visibleIds.has(id)) {
                    el.remove();
                    this.domTiles.delete(id);
                }
            }

            // Cleanup merged tiles after animation
            this.eachCell((x, y, tile) => {
                if (tile && tile.mergedFrom) {
                    setTimeout(() => {
                        tile.mergedFrom.forEach(merged => {
                            const el = this.domTiles.get(merged.id);
                            if (el) {
                                el.remove();
                                this.domTiles.delete(merged.id);
                            }
                        });
                        tile.mergedFrom = null;
                    }, 150);
                }
            });
        });
    }

    syncTileDom(tile, targetPos = null) {
        let el = this.domTiles.get(tile.id);
        const x = targetPos ? targetPos.x : tile.x;
        const y = targetPos ? targetPos.y : tile.y;

        // Simplified Logic: Container is already at 10,10.
        // So (0,0) is at 0,0 relative to container.
        const top = x * 90;
        const left = y * 90;
        const transform = `translate(${left}px, ${top}px)`;

        if (!el) {
            el = document.createElement('div');
            el.className = 'tile';
            el.textContent = tile.value;
            el.setAttribute('data-val', tile.value);
            el.style.transform = transform;

            if (tile.mergedFrom) {
                el.classList.add('tile-merged');
            } else {
                el.classList.add('tile-new');
            }

            this.ui.tileContainer.appendChild(el);
            this.domTiles.set(tile.id, el);
        } else {
            window.requestAnimationFrame(() => {
                el.style.transform = transform;
                el.textContent = tile.value;
            });
        }
    }

    handleInput(e) {
        if (!this.isPlaying) return;
        const map = {
            'ArrowUp': 0,
            'ArrowRight': 1,
            'ArrowDown': 2,
            'ArrowLeft': 3
        };
        if (map[e.key] !== undefined) {
            e.preventDefault();
            this.move(map[e.key]);
        }
    }

    prepareTiles() {
        this.eachCell((x, y, tile) => {
            if (tile) {
                tile.mergedFrom = null;
                tile.savePosition();
            }
        });
    }

    moveTile(tile, cell) {
        this.grid[tile.x][tile.y] = null;
        this.grid[cell.x][cell.y] = tile;
        tile.updatePosition(cell);
    }

    move(direction) {
        if (this.isGameTerminated()) return;

        let cell, tile;
        const vector = this.getVector(direction);
        const traversals = this.buildTraversals(vector);
        let moved = false;

        this.prepareTiles();

        traversals.x.forEach(x => {
            traversals.y.forEach(y => {
                cell = { x: x, y: y };
                tile = this.grid[x][y];

                if (tile) {
                    const positions = this.findFarthestPosition(cell, vector);
                    const next = positions.next;

                    const nextTile = this.cellContent(next);
                    if (nextTile && nextTile.value === tile.value && !nextTile.mergedFrom) {
                        const merged = new Tile(next, tile.value * 2);
                        merged.mergedFrom = [tile, nextTile];

                        this.insertTile(merged);
                        this.removeTile(tile);

                        tile.updatePosition(next);
                        this.score += merged.value;
                        this.updateScore(this.score);
                        if (merged.value === 2048) this.won = true;
                    } else {
                        this.moveTile(tile, positions.farthest);
                    }

                    if (!this.positionsEqual(cell, tile)) {
                        moved = true;
                    }
                }
            });
        });

        if (moved) {
            this.addRandomTile();
            if (!this.movesAvailable()) {
                this.over = true;
                setTimeout(() => this.gameOver({ score: this.score, won: this.won }), 1000);
            }
            this.actuate();
        }
    }

    getVector(direction) {
        const map = {
            0: { x: -1, y: 0 }, // Up
            1: { x: 0, y: 1 },  // Right
            2: { x: 1, y: 0 },  // Down
            3: { x: 0, y: -1 }  // Left
        };
        return map[direction];
    }

    buildTraversals(vector) {
        const traversals = { x: [], y: [] };
        for (let pos = 0; pos < this.size; pos++) {
            traversals.x.push(pos);
            traversals.y.push(pos);
        }
        if (vector.x === 1) traversals.x = traversals.x.reverse();
        if (vector.y === 1) traversals.y = traversals.y.reverse();
        return traversals;
    }

    findFarthestPosition(cell, vector) {
        let previous;
        do {
            previous = cell;
            cell = { x: previous.x + vector.x, y: previous.y + vector.y };
        } while (this.withinBounds(cell) && this.cellAvailable(cell));

        return {
            farthest: previous,
            next: cell
        };
    }

    withinBounds(position) {
        return position.x >= 0 && position.x < this.size &&
            position.y >= 0 && position.y < this.size;
    }

    cellAvailable(cell) {
        return !this.cellContent(cell);
    }

    cellContent(cell) {
        if (this.withinBounds(cell)) return this.grid[cell.x][cell.y];
        return null;
    }

    positionsEqual(first, second) {
        return first.x === second.x && first.y === second.y;
    }

    movesAvailable() {
        return this.cellsAvailable() || this.tileMatchesAvailable();
    }

    tileMatchesAvailable() {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.grid[x][y];
                if (tile) {
                    for (let direction = 0; direction < 4; direction++) {
                        const vector = this.getVector(direction);
                        const cell = { x: x + vector.x, y: y + vector.y };
                        const other = this.cellContent(cell);
                        if (other && other.value === tile.value) return true;
                    }
                }
            }
        }
        return false;
    }

    isGameTerminated() {
        return this.over || (this.won && !this.keepPlaying);
    }
}
