/**
 * Game Interface / Base Class
 * All games must implement this interface or extend this class.
 */
export class Game {
    /**
     * @param {string} id - Unique Game ID
     * @param {HTMLElement} container - DOM element to render the game into
     * @param {object} config - Game configuration (difficulty, etc)
     */
    constructor(id, container, config) {
        this.id = id;
        this.container = container;
        this.config = config;
        this.score = 0;
        this.isPlaying = false;

        // Event emitters placeholders (to be set by app.js)
        this.onGameOver = () => { };
        this.onScoreUpdate = () => { };
    }

    /**
     * Initialize the game (setup DOM, event listeners, etc)
     */
    init() {
        console.warn(`${this.id}: init() not implemented`);
    }

    /**
     * Start the game loop
     */
    start() {
        this.isPlaying = true;
        console.log(`${this.id}: Game Started`);
    }

    /**
     * Pause/Stop the game loop
     */
    stop() {
        this.isPlaying = false;
        console.log(`${this.id}: Game Stopped`);
    }

    /**
     * Cleanup (remove event listeners, clear intervals)
     * Critical for SPA performance
     */
    destroy() {
        this.container.innerHTML = '';
        console.log(`${this.id}: Destroyed`);
    }

    /**
     * Helper to set game over state
     * @param {object} result - { score: number, won: boolean }
     */
    gameOver(result) {
        this.isPlaying = false;
        this.onGameOver(result);
    }

    /**
     * Helper to update score
     * @param {number} points 
     */
    updateScore(points) {
        this.score = points;
        this.onScoreUpdate(this.score);
    }
}
