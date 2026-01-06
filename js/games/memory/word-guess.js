import { Game } from '../../game-interface.js';

export default class WordGuessGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.WORDS = [
            'APPLE', 'BEACH', 'BRAIN', 'BREAD', 'BRUSH', 'CHAIR', 'CHEST', 'CHORD',
            'CLICK', 'CLOCK', 'CLOUD', 'DANCE', 'DRIVE', 'EARTH', 'FEAST', 'FIELD',
            'FRUIT', 'GLASS', 'GRAPE', 'GREEN', 'GHOST', 'HEART', 'HOUSE', 'JUICE',
            'LIGHT', 'LEMON', 'MELON', 'MONEY', 'MUSIC', 'NIGHT', 'OCEAN', 'PARTY',
            'PIANO', 'PILOT', 'PLANE', 'PLANT', 'PLATE', 'PHONE', 'POWER', 'RADIO',
            'RIVER', 'ROBOT', 'SHIRT', 'SHOES', 'SPACE', 'SPOON', 'STORM', 'TABLE',
            'TIGER', 'TOAST', 'TOUCH', 'TRAIN', 'TRUCK', 'VOICE', 'WATER', 'WATCH',
            'WHALE', 'WORLD', 'WRITE', 'YOUTH', 'ZEBRA'
        ];
        this.maxGuesses = 6;
        this.currentGuess = 0;
        this.targetWord = '';
        this.guesses = []; // Array of strings
        this.currentInput = '';
    }

    init() {
        this.container.innerHTML = `
            <div class="wg-container">
                <div id="wg-grid" class="wg-grid"></div>
                <div id="wg-keyboard" class="wg-keyboard"></div>
                <div id="wg-message" class="wg-message"></div>
            </div>
            <style>
                .wg-container { display: flex; flex-direction: column; align-items: center; gap: 2rem; width: 100%; max-width: 500px; margin: 0 auto; }
                .wg-grid { display: grid; grid-template-rows: repeat(6, 1fr); gap: 5px; margin-bottom: 20px; }
                .wg-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; }
                .wg-tile { 
                    width: 50px; height: 50px; border: 2px solid rgba(255,255,255,0.2); 
                    display: flex; justify-content: center; align-items: center; 
                    font-size: 1.5rem; font-weight: bold; text-transform: uppercase;
                    transition: all 0.2s;
                    background: rgba(0,0,0,0.2);
                }
                .wg-tile.filled { border-color: rgba(255,255,255,0.5); animation: pulse 0.1s; }
                .wg-tile.correct { background: var(--success); border-color: var(--success); }
                .wg-tile.present { background: var(--warning, #f59e0b); border-color: var(--warning, #f59e0b); }
                .wg-tile.absent { background: rgba(255,255,255,0.05); border-color: transparent; }
                
                .wg-keyboard { display: flex; flex-direction: column; gap: 8px; width: 100%; }
                .wg-key-row { display: flex; justify-content: center; gap: 6px; }
                .wg-key { 
                    padding: 10px 0; width: 40px; background: rgba(255,255,255,0.1); 
                    border: none; border-radius: 4px; color: white; cursor: pointer; 
                    font-weight: 600; text-transform: uppercase;
                }
                .wg-key.wide { width: 65px; }
                .wg-key:hover { background: rgba(255,255,255,0.2); }
                .wg-key.correct { background: var(--success); }
                .wg-key.present { background: var(--warning, #f59e0b); }
                .wg-key.absent { opacity: 0.3; }

                .wg-hint-area { width: 100%; display: flex; justify-content: center; margin-top: 10px; }
                .hint-btn { min-width: 120px; }
                .hint-cd { font-size: 0.8rem; opacity: 0.7; margin-left: 5px; }

                @keyframes pulse { 50% { transform: scale(1.1); } }
                @keyframes flip { 0% { transform: rotateX(0); } 100% { transform: rotateX(360deg); } }
            </style>
        `;

        this.ui = {}; // Initialize UI object

        this.renderGrid();
        this.renderKeyboard();

        // Hint Button
        const hintArea = document.createElement('div');
        hintArea.className = 'wg-hint-area';
        hintArea.innerHTML = `<button id="wg-hint" class="glass-btn primary hint-btn"><i class="fa-solid fa-lightbulb"></i> Hint</button>`;
        this.container.querySelector('.wg-keyboard').after(hintArea); // Place after keyboard

        this.ui.hintBtn = hintArea.querySelector('#wg-hint');
        this.ui.hintBtn.onclick = () => this.useHint();

        // Physical Keyboard Support
        this.handleKeydown = this.handleKeydown.bind(this);
        document.addEventListener('keydown', this.handleKeydown);
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeydown);
        if (this.hintTimer) clearInterval(this.hintTimer);
        super.destroy();
    }

    start() {
        super.start();
        this.currentGuess = 0;
        this.currentInput = '';
        this.guesses = Array(6).fill('');
        this.targetWord = this.WORDS[Math.floor(Math.random() * this.WORDS.length)];
        this.hintAvailable = true;
        this.hintCooldown = 0;
        if (this.hintTimer) clearInterval(this.hintTimer);
        this.updateHintUI();

        console.log('Target:', this.targetWord); // For debugging
        this.updateGrid();
        this.resetKeyboard();
    }

    useHint() {
        if (!this.isPlaying || !this.hintAvailable) return;

        // Reveal logic: Find first unrevealed letter in current row correct position
        // Actually, we can't fill the current row because that's user input.
        // We should "Flash" the correct letter or show a message? 
        // Better: Fill a correct letter into the current input if empty?
        // Or: Show a notification "The 3rd letter is X".

        // Let's go with: Reveal one letter in correct position that hasn't been guessed correctly yet?
        // Simpler: Just reveal a random un-guessed letter position.

        const targetChars = this.targetWord.split('');
        const unrevealedIndices = [];

        // Check which indices the user hasn't got green yet (in previous guesses)
        // But we don't track "locked" greens. 
        // Let's just pick a random index 0-4.
        for (let i = 0; i < 5; i++) {
            unrevealedIndices.push(i);
        }

        const idx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        const char = targetChars[idx];

        // Visual feedback
        const msg = `Hint: The letter at pos ${idx + 1} is ${char}`;
        const messageEl = this.container.querySelector('#wg-message');
        if (!messageEl) {
            const m = document.createElement('div');
            m.id = 'wg-message';
            this.container.appendChild(m);
        }
        document.getElementById('wg-message').textContent = msg;
        document.getElementById('wg-message').style.color = 'var(--accent)';
        setTimeout(() => document.getElementById('wg-message').textContent = '', 4000);

        // Start Cooldown
        this.startHintCooldown();
    }

    startHintCooldown() {
        this.hintAvailable = false;
        this.hintCooldown = 40;
        this.updateHintUI();

        this.hintTimer = setInterval(() => {
            this.hintCooldown--;
            this.updateHintUI();
            if (this.hintCooldown <= 0) {
                this.hintAvailable = true;
                clearInterval(this.hintTimer);
                this.updateHintUI();
            }
        }, 1000);
    }

    updateHintUI() {
        if (!this.ui.hintBtn) return;
        if (this.hintAvailable) {
            this.ui.hintBtn.disabled = false;
            this.ui.hintBtn.innerHTML = `<i class="fa-solid fa-lightbulb"></i> Hint`;
            this.ui.hintBtn.style.opacity = '1';
        } else {
            this.ui.hintBtn.disabled = true;
            this.ui.hintBtn.innerHTML = `<i class="fa-solid fa-hourglass"></i> ${this.hintCooldown}s`;
            this.ui.hintBtn.style.opacity = '0.5';
        }
    }

    renderGrid() {
        const grid = this.container.querySelector('#wg-grid');
        grid.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'wg-row';
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.className = 'wg-tile';
                tile.id = `tile-${i}-${j}`;
                row.appendChild(tile);
            }
            grid.appendChild(row);
        }
    }

    renderKeyboard() {
        const keyboard = this.container.querySelector('#wg-keyboard');
        const rows = [
            'QWERTYUIOP',
            'ASDFGHJKL',
            'ZXCVBNM'
        ];

        rows.forEach((rowStr, i) => {
            const row = document.createElement('div');
            row.className = 'wg-key-row';

            if (i === 2) {
                // Enter button
                const enter = document.createElement('button');
                enter.className = 'wg-key wide';
                enter.textContent = 'ENT';
                enter.onclick = () => this.submitGuess();
                row.appendChild(enter);
            }

            rowStr.split('').forEach(char => {
                const key = document.createElement('button');
                key.className = 'wg-key';
                key.textContent = char;
                key.dataset.key = char;
                key.onclick = () => this.handleInput(char);
                row.appendChild(key);
            });

            if (i === 2) {
                // Backspace button
                const back = document.createElement('button');
                back.className = 'wg-key wide';
                back.innerHTML = '<i class="fa-solid fa-delete-left"></i>';
                back.onclick = () => this.handleBackspace();
                row.appendChild(back);
            }

            keyboard.appendChild(row);
        });
    }

    resetKeyboard() {
        this.container.querySelectorAll('.wg-key').forEach(k => {
            k.className = k.className.replace(/ correct| present| absent/g, '');
        });
    }

    handleKeydown(e) {
        if (!this.isPlaying) return;
        const key = e.key.toUpperCase();
        if (key === 'ENTER') this.submitGuess();
        else if (key === 'BACKSPACE') this.handleBackspace();
        else if (/^[A-Z]$/.test(key)) this.handleInput(key);
    }

    handleInput(char) {
        if (this.currentInput.length < 5) {
            this.currentInput += char;
            this.updateGrid();
        }
    }

    handleBackspace() {
        if (this.currentInput.length > 0) {
            this.currentInput = this.currentInput.slice(0, -1);
            this.updateGrid();
        }
    }

    updateGrid() {
        const row = this.currentGuess;
        for (let i = 0; i < 5; i++) {
            const tile = this.container.querySelector(`#tile-${row}-${i}`);
            const char = this.currentInput[i] || '';
            tile.textContent = char;
            tile.className = `wg-tile${char ? ' filled' : ''}`;
        }
    }

    submitGuess() {
        if (this.currentInput.length !== 5) return;

        // Check word logic (simplified: allow any 5 letter string for now, or check list)
        // Ideally check against a dictionary, but for this demo allow any valid length input
        // if (!this.WORDS.includes(this.currentInput)) { ... } 

        const guess = this.currentInput;
        this.guesses[this.currentGuess] = guess;

        this.revealRow(this.currentGuess, guess);

        if (guess === this.targetWord) {
            setTimeout(() => this.gameOver({ score: (6 - this.currentGuess) * 100, won: true }), 1500);
        } else {
            this.currentGuess++;
            this.currentInput = '';
            if (this.currentGuess >= this.maxGuesses) {
                setTimeout(() => this.gameOver({
                    score: 0,
                    won: false,
                    message: `The word was: <b>${this.targetWord}</b>`
                }), 1500);
            }
        }
    }

    revealRow(rowIndex, guess) {
        const targetChars = this.targetWord.split('');
        const guessChars = guess.split('');

        // First pass: Correct position (Green)
        guessChars.forEach((char, i) => {
            const tile = this.container.querySelector(`#tile-${rowIndex}-${i}`);
            const key = this.container.querySelector(`.wg-key[data-key="${char}"]`);

            setTimeout(() => {
                if (char === targetChars[i]) {
                    tile.classList.add('correct');
                    if (key) key.classList.add('correct');
                    targetChars[i] = null; // Mark as handled
                }
            }, i * 200);
        });

        // Second pass: Wrong position (Yellow) and Absent (Gray)
        setTimeout(() => {
            guessChars.forEach((char, i) => {
                const tile = this.container.querySelector(`#tile-${rowIndex}-${i}`);
                const key = this.container.querySelector(`.wg-key[data-key="${char}"]`);

                // Skip if already green
                if (tile.classList.contains('correct')) return;

                const targetIndex = targetChars.indexOf(char);
                if (targetIndex > -1) {
                    tile.classList.add('present');
                    if (key && !key.classList.contains('correct')) key.classList.add('present');
                    targetChars[targetIndex] = null;
                } else {
                    tile.classList.add('absent');
                    if (key) key.classList.add('absent');
                }
            });
        }, 1000); // Wait for first pass animations
    }
}
