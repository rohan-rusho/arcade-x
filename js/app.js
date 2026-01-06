import { Storage } from './storage.js';

/**
 * Main Application Logic
 */

// Global State
const state = {
    currentGame: null,
    currentGameInstance: null,
    difficulty: 'medium',
    theme: 'dark'
};

// DOM Elements
const elements = {
    gameHub: document.getElementById('game-hub'),
    gameView: document.getElementById('game-view'),
    gameGrid: document.getElementById('game-grid'),
    gameContainer: document.getElementById('game-container'),
    backBtn: document.getElementById('back-to-hub'),
    gameTitle: document.getElementById('current-game-title'),
    scoreDisplay: document.getElementById('score-display'),
    bestScoreDisplay: document.getElementById('best-score-display'),
    restartBtn: document.getElementById('restart-game'),
    themeToggle: document.getElementById('theme-toggle'),
    difficultySelect: document.getElementById('global-difficulty'),
    categoryTabs: document.querySelectorAll('.tab-btn'),
    logo: document.querySelector('.logo'),
    modal: {
        overlay: document.getElementById('modal-overlay'),
        title: document.getElementById('modal-title'),
        message: document.getElementById('modal-message'),
        closeBtn: document.getElementById('modal-close'),
        actionBtn: document.getElementById('modal-action')
    },
    loadingOverlay: document.getElementById('loading-overlay')
};

// Game Registry (Will act as a manifest)
const games = [
    {
        id: 'word-memory',
        title: 'Word Memory',
        category: 'memory',
        icon: 'fa-brain',
        path: './games/memory/word-memory.js'
    },
    {
        id: 'word-guess',
        title: 'Word Guess',
        category: 'memory',
        icon: 'fa-font',
        path: './games/memory/word-guess.js'
    },
    {
        id: 'anagram',
        title: 'Anagram',
        category: 'memory',
        icon: 'fa-shuffle',
        path: './games/memory/anagram.js'
    },
    {
        id: 'typing-test',
        title: 'Typing Speed',
        category: 'memory',
        icon: 'fa-keyboard',
        path: './games/memory/typing-test.js'
    },
    {
        id: 'vocab-match',
        title: 'Vocab Match',
        category: 'memory',
        icon: 'fa-book-open',
        path: './games/memory/vocab-match.js'
    },
    {
        id: 'pattern-recall',
        title: 'Pattern Recall',
        category: 'memory',
        icon: 'fa-table-cells',
        path: './games/memory/pattern-recall.js'
    },
    {
        id: 'tic-tac-toe',
        title: 'Tic Tac Toe',
        category: 'logic',
        icon: 'fa-xmarks-lines',
        path: './games/logic/tic-tac-toe.js'
    },
    {
        id: 'sudoku',
        title: 'Sudoku',
        category: 'logic',
        icon: 'fa-border-all',
        path: './games/logic/sudoku.js'
    },
    {
        id: '2048',
        title: '2048',
        category: 'logic',
        icon: 'fa-cubes-stacked',
        path: './games/logic/2048.js'
    },
    {
        id: 'sliding-puzzle',
        title: 'Sliding Puzzle',
        category: 'logic',
        icon: 'fa-table-cells-large',
        path: './games/logic/sliding-puzzle.js'
    },
    {
        id: 'minesweeper',
        title: 'Minesweeper',
        category: 'logic',
        icon: 'fa-bomb',
        path: './games/logic/minesweeper.js'
    },
    {
        id: 'color-match',
        title: 'Color Match',
        category: 'logic',
        icon: 'fa-palette',
        path: './games/logic/color-match.js'
    },
    {
        id: 'number-sequence',
        title: 'Number Sequence',
        category: 'logic',
        icon: 'fa-arrow-down-1-9',
        path: './games/logic/number-sequence.js'
    },
    {
        id: 'reaction-timer',
        title: 'Reaction Timer',
        category: 'reflex',
        icon: 'fa-bolt',
        path: './games/reflex/reaction-timer.js'
    },
    {
        id: 'click-speed',
        title: 'Click Speed',
        category: 'reflex',
        icon: 'fa-arrow-pointer',
        path: './games/reflex/click-speed.js'
    },
    {
        id: 'whack-a-tile',
        title: 'Whack-a-Tile',
        category: 'reflex',
        icon: 'fa-gavel',
        path: './games/reflex/whack-a-tile.js'
    },
    {
        id: 'simon-says',
        title: 'Simon Says',
        category: 'reflex',
        icon: 'fa-circle-notch',
        path: './games/reflex/simon-says.js'
    },
    {
        id: 'tap-target',
        title: 'Tap Target',
        category: 'reflex',
        icon: 'fa-bullseye',
        path: './games/reflex/tap-target.js'
    },
    {
        id: 'time-rush',
        title: 'Time Rush',
        category: 'reflex',
        icon: 'fa-stopwatch-20',
        path: './games/reflex/time-rush.js'
    },
    {
        id: 'snake',
        title: 'Snake',
        category: 'reflex',
        icon: 'fa-staff-snake',
        path: './games/reflex/snake.js'
    },
    {
        id: 'connect-4',
        title: 'Connect 4',
        category: 'reflex',
        icon: 'fa-circle-dot',
        path: './games/reflex/connect-4.js'
    },
];

/**
 * Initialize App
 */
function init() {
    setupEventListeners();
    loadPreferences();
    renderGameGrid('all');

    // Check for last played game to auto-resume (Optional - maybe just stay on hub for now)
    // const lastGame = Storage.getLastPlayed();
    // if (lastGame) loadGame(lastGame);
}

/**
 * Setup Global Event Listeners
 */
function setupEventListeners() {
    // Logo Click (Home)
    elements.logo.style.cursor = 'pointer';
    elements.logo.addEventListener('click', () => {
        showHub();
    });

    // Theme Toggle
    elements.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');

        // Toggle Icon
        const icon = elements.themeToggle.querySelector('i');
        if (document.body.classList.contains('light-theme')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            state.theme = 'light';
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            state.theme = 'dark';
        }
    });

    // Difficulty Change
    elements.difficultySelect.addEventListener('change', (e) => {
        state.difficulty = e.target.value;
        Storage.set('difficulty', state.difficulty);
        // If game is running, restart it with new difficulty? 
        if (state.currentGameInstance) {
            restartGame();
        }
    });

    // Navigation
    elements.backBtn.addEventListener('click', showHub);

    // Restart
    elements.restartBtn.addEventListener('click', restartGame);

    // Modal
    elements.modal.closeBtn.addEventListener('click', closeModal);
    elements.modal.actionBtn.addEventListener('click', () => {
        closeModal();
        restartGame();
    });

    // Category Tabs
    elements.categoryTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            elements.categoryTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            renderGameGrid(e.target.dataset.category);
        });
    });
}

/**
 * Load User Preferences
 */
function loadPreferences() {
    const savedDifficulty = Storage.get('difficulty');
    if (savedDifficulty) {
        state.difficulty = savedDifficulty;
        elements.difficultySelect.value = savedDifficulty;
    }
}

/**
 * Render Game Grid
 */
function renderGameGrid(category) {
    elements.gameGrid.innerHTML = '';

    const filteredGames = category === 'all'
        ? games
        : games.filter(g => g.category === category);

    if (filteredGames.length === 0) {
        elements.gameGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No games found in this category yet.</p>';
        return;
    }

    filteredGames.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="difficulty-badge">${Storage.getHighScore(game.id) > 0 ? 'Played' : 'New'}</div>
            <i class="fa-solid ${game.icon} game-icon"></i>
            <h3>${game.title}</h3>
            <p>High Score: ${Storage.getHighScore(game.id)}</p>
        `;
        card.addEventListener('click', () => loadGame(game));
        elements.gameGrid.appendChild(card);
    });
}

/**
 * Load and Start a Game
 */
async function loadGame(gameMetadata) {
    if (state.currentGameInstance) {
        state.currentGameInstance.stop();
        state.currentGameInstance.destroy();
        state.currentGameInstance = null;
    }

    state.currentGame = gameMetadata;
    elements.gameTitle.innerHTML = `<i class="fa-solid ${gameMetadata.icon}"></i> ${gameMetadata.title}`;

    // Show Loading
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.add('active');
        await new Promise(resolve => setTimeout(resolve, 800)); // Cute delay
    }

    // Hide Hub, Show Game View (hidden initially to prevent flash)
    elements.gameHub.classList.add('hidden');
    elements.gameView.classList.remove('hidden');

    try {
        const gamePath = gameMetadata.path;
        // Resolve path relative to this module
        const absolutePath = new URL(gamePath, import.meta.url).href;

        const module = await import(absolutePath);
        const GameClass = module.default;

        if (!GameClass) {
            throw new Error(`Module ${gamePath} does not have a default export.`);
        }

        const gameInstance = new GameClass(gameMetadata.id, elements.gameContainer, {
            difficulty: state.difficulty
        });

        gameInstance.init();
        gameInstance.onGameOver = handleGameOver;
        gameInstance.onScoreUpdate = (score) => {
            elements.scoreDisplay.textContent = `Score: ${score}`;
        };

        state.currentGameInstance = gameInstance;
        elements.scoreDisplay.textContent = 'Score: 0';
        elements.bestScoreDisplay.textContent = `Best: ${Storage.getHighScore(gameMetadata.id)}`;

        gameInstance.start();
        showGameView();
        Storage.setLastPlayed(gameMetadata.id);

    } catch (e) {
        // Hide Loading immediately before alert
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.remove('active');
        }

        console.error('Failed to load game:', e);
        alert(`Error loading game: ${e.message}\n(Please hard refresh your browser: Ctrl+Shift+R)`);
        showHub();
    }
}

/**
 * Handle Game Over
 */
function handleGameOver(result) {
    const isHighScore = Storage.saveHighScore(state.currentGame.id, result.score);

    elements.modal.title.textContent = result.won ? 'You Won!' : 'Game Over';

    let message = `Score: ${result.score}` + (isHighScore ? ' (New High Score!)' : '');
    if (result.message) {
        message += `<br><br><span style="color: var(--accent); font-size: 0.9em;">${result.message}</span>`;
    }

    elements.modal.message.innerHTML = message; // Use innerHTML for styling

    showModal();
}

/**
 * Restart Current Game
 */
function restartGame() {
    if (state.currentGameInstance) {
        state.currentGameInstance.destroy();
        state.currentGameInstance.init();
        state.currentGameInstance.start();
        elements.scoreDisplay.textContent = 'Score: 0';
    }
}

/**
 * View Transitions
 */
function showHub() {
    if (state.currentGameInstance) {
        state.currentGameInstance.stop();
    }
    elements.gameView.classList.add('hidden');
    elements.gameHub.classList.remove('hidden');
    // Refresh grid to update scores
    renderGameGrid(document.querySelector('.tab-btn.active').dataset.category);
}

function showGameView() {
    elements.gameHub.classList.add('hidden');
    elements.gameView.classList.remove('hidden');
}

function showModal() {
    elements.modal.overlay.classList.remove('hidden');
}

function closeModal() {
    elements.modal.overlay.classList.add('hidden');
}

// Kickoff
init();
