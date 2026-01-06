/**
 * Storage Manager
 * Handles all interactions with localStorage.
 * Keys are prefixed to avoid collisions.
 */

const PREFIX = 'arcadex_';

export const Storage = {
    /**
     * Save a value to localStorage
     * @param {string} key 
     * @param {any} value 
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(PREFIX + key, serialized);
        } catch (e) {
            console.error('Storage Save Error:', e);
        }
    },

    /**
     * Get a value from localStorage
     * @param {string} key 
     * @param {any} defaultValue 
     * @returns {any}
     */
    get(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(PREFIX + key);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (e) {
            console.error('Storage Load Error:', e);
            return defaultValue;
        }
    },

    /**
     * Save game specific progress
     * @param {string} gameId 
     * @param {object} state 
     */
    saveGameProgress(gameId, state) {
        this.set(`progress_${gameId}`, state);
    },

    /**
     * Load game specific progress
     * @param {string} gameId 
     * @returns {object|null}
     */
    loadGameProgress(gameId) {
        return this.get(`progress_${gameId}`, null);
    },

    /**
     * Save High Score
     * Only updates if new score is higher
     * @param {string} gameId 
     * @param {number} score 
     * @returns {boolean} true if new high score
     */
    saveHighScore(gameId, score) {
        const currentBest = this.get(`highscore_${gameId}`, 0);
        if (score > currentBest) {
            this.set(`highscore_${gameId}`, score);
            return true;
        }
        return false;
    },

    /**
     * Get High Score
     * @param {string} gameId 
     * @returns {number}
     */
    getHighScore(gameId) {
        return this.get(`highscore_${gameId}`, 0);
    },

    /**
     * Save Last Played Game
     * @param {string} gameId 
     */
    setLastPlayed(gameId) {
        this.set('last_played', gameId);
    },

    /**
     * Get Last Played Game
     * @returns {string|null}
     */
    getLastPlayed() {
        return this.get('last_played', null);
    }
};
