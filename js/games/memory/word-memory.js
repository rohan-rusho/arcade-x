import { Game } from '../../game-interface.js';

export default class WordMemoryGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.words = [
            'Apple', 'River', 'Cloud', 'Dream', 'Ghost', 'Music', 'Planet', 'Robot',
            'Stone', 'Tiger', 'Bread', 'Chair', 'Dance', 'Eagle', 'Flame', 'Glass',
            'Heart', 'Island', 'Jungle', 'Knife', 'Lemon', 'Mouse', 'Night', 'Ocean',
            'Paint', 'Queen', 'Radio', 'Snake', 'Train', 'Umbrella', 'Voice', 'Water',
            'Xylophone', 'Yacht', 'Zebra', 'Acorn', 'Bridge', 'Clock', 'Drum'
        ];
        this.currentRound = 0;
        this.maxRounds = 5;
        this.roundScore = 0;
        this.targetWords = [];
        this.selectedWords = [];
    }

    init() {
        this.container.innerHTML = `
            <div class="wm-container">
                <div id="wm-instructions" class="wm-instructions">
                    <h3>Focus!</h3>
                    <p>Memorize the words shown below.</p>
                </div>
                <div id="wm-word-display" class="wm-word-display"></div>
                <div id="wm-options-grid" class="wm-options-grid hidden"></div>
                <div id="wm-feedback" class="wm-feedback"></div>
            </div>
            <style>
                .wm-container { text-align: center; width: 100%; }
                .wm-word-display { font-size: 2rem; min-height: 100px; display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin: 2rem 0; }
                .wm-word-card { background: rgba(255,255,255,0.1); padding: 1rem 1.5rem; border-radius: 8px; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .wm-options-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 1rem; margin-top: 2rem; }
                .wm-option-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; cursor: pointer; transition: 0.2s; color: white; }
                .wm-option-btn:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
                .wm-option-btn.selected { background: var(--primary); border-color: var(--primary); }
                .wm-option-btn.correct { background: var(--success); border-color: var(--success); }
                .wm-option-btn.wrong { background: var(--danger); border-color: var(--danger); }
                @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            </style>
        `;

        this.ui = {
            instructions: this.container.querySelector('#wm-instructions'),
            display: this.container.querySelector('#wm-word-display'),
            options: this.container.querySelector('#wm-options-grid'),
            feedback: this.container.querySelector('#wm-feedback')
        };
    }

    start() {
        super.start();
        this.currentRound = 0;
        this.updateScore(0);
        this.nextRound();
    }

    nextRound() {
        if (this.currentRound >= this.maxRounds) {
            this.gameOver({ score: this.score, won: true });
            return;
        }

        this.currentRound++;
        this.selectedWords = [];
        this.targetWords = [];

        // Difficulty Config
        let wordCount = 3;
        let displayTime = 3000;
        let distractorCount = 3;

        switch (this.config.difficulty) {
            case 'easy': wordCount = 3; displayTime = 4000; distractorCount = 3; break;
            case 'medium': wordCount = 5; displayTime = 3000; distractorCount = 5; break;
            case 'hard': wordCount = 7; displayTime = 2000; distractorCount = 7; break;
        }

        // Shuffle and pick words
        const shuffled = [...this.words].sort(() => 0.5 - Math.random());
        this.targetWords = shuffled.slice(0, wordCount);
        const distractors = shuffled.slice(wordCount, wordCount + distractorCount);
        const options = [...this.targetWords, ...distractors].sort(() => 0.5 - Math.random());

        // Show Phase
        this.ui.instructions.innerHTML = `<h3>Round ${this.currentRound}/${this.maxRounds}</h3><p>Memorize these ${wordCount} words!</p>`;
        this.ui.options.classList.add('hidden');
        this.ui.options.innerHTML = '';
        this.ui.display.innerHTML = '';

        this.targetWords.forEach((word, index) => {
            setTimeout(() => {
                const span = document.createElement('div');
                span.className = 'wm-word-card';
                span.textContent = word;
                this.ui.display.appendChild(span);
            }, index * 100);
        });

        // Hide Phase & Guess
        setTimeout(() => {
            this.ui.display.innerHTML = '';
            this.ui.instructions.innerHTML = `<p>Select the ${wordCount} words you saw.</p>`;
            this.ui.options.classList.remove('hidden');

            options.forEach(word => {
                const btn = document.createElement('button');
                btn.className = 'wm-option-btn';
                btn.textContent = word;
                btn.onclick = () => this.handleSelection(btn, word, wordCount);
                this.ui.options.appendChild(btn);
            });
        }, displayTime + (wordCount * 100)); // Add delay for card animations
    }

    handleSelection(btn, word, limit) {
        if (this.selectedWords.includes(word) || !this.isPlaying) return;

        btn.classList.add('selected');
        this.selectedWords.push(word);

        if (this.selectedWords.length === limit) {
            this.checkResult();
        }
    }

    checkResult() {
        let correctCount = 0;
        const buttons = this.ui.options.querySelectorAll('.wm-option-btn');

        buttons.forEach(btn => {
            const word = btn.textContent;
            if (this.targetWords.includes(word)) {
                btn.classList.add('correct');
                if (btn.classList.contains('selected')) correctCount++;
            } else {
                if (btn.classList.contains('selected')) btn.classList.add('wrong');
            }
        });

        const roundPoints = correctCount * 10;
        this.updateScore(this.score + roundPoints);

        setTimeout(() => {
            if (correctCount === this.targetWords.length) {
                this.nextRound();
            } else {
                this.gameOver({ score: this.score, won: false });
            }
        }, 1500);
    }
}
