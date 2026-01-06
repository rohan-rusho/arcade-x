import { Game } from '../../game-interface.js';

export default class VocabularyMatchGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.pairs = {
            easy: [
                { word: 'Happy', match: 'Joyful' },
                { word: 'Big', match: 'Large' },
                { word: 'Fast', match: 'Quick' },
                { word: 'Sad', match: 'Unhappy' },
                { word: 'Rich', match: 'Wealthy' },
                { word: 'Start', match: 'Begin' }
            ],
            medium: [
                { word: 'Obsolete', match: 'Outdated' },
                { word: 'Candid', match: 'Honest' },
                { word: 'Vague', match: 'Unclear' },
                { word: 'Lethargic', match: 'Sluggish' },
                { word: 'Benevolent', match: 'Kind' },
                { word: 'Inevitable', match: 'Unavoidable' }
            ],
            hard: [
                { word: 'Ephemeral', match: 'Short-lived' },
                { word: 'Ubiquitous', match: 'Everywhere' },
                { word: 'Cacophony', match: 'Noise' },
                { word: 'Enigmatic', match: 'Mysterious' },
                { word: 'Pragmatic', match: 'Practical' },
                { word: 'Esoteric', match: 'Obscure' }
            ]
        };
        this.cards = []; // Array of { id, text, type, matchId }
        this.selectedCard = null;
        this.matchedPairs = 0;
        this.totalPairs = 0;
    }

    init() {
        this.container.innerHTML = `
            <div class="vm-container">
                <div class="vm-grid" id="vm-grid"></div>
            </div>
            <style>
                .vm-container { width: 100%; max-width: 800px; margin: 0 auto; }
                .vm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; }
                .vm-card {
                    background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border);
                    border-radius: 8px; padding: 1.5rem; text-align: center; cursor: pointer;
                    min-height: 100px; display: flex; align-items: center; justify-content: center;
                    transition: all 0.3s;
                    user-select: none; font-size: 1.1rem;
                }
                .vm-card:hover { background: rgba(255,255,255,0.2); transform: translateY(-3px); }
                .vm-card.selected { background: var(--primary); border-color: var(--primary); box-shadow: 0 0 15px var(--primary-glow); }
                .vm-card.matched { background: var(--success); opacity: 0; pointer-events: none; transform: scale(0.8); }
                .vm-card.wrong { background: var(--danger); animation: shake 0.4s; }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
            </style>
        `;
        this.grid = this.container.querySelector('#vm-grid');
    }

    start() {
        super.start();
        this.updateScore(0);
        this.matchedPairs = 0;
        this.selectedCard = null;

        // Setup Cards
        const diff = this.config.difficulty;
        const pairList = this.pairs[diff] || this.pairs.medium;
        this.totalPairs = pairList.length;

        // Create individual cards
        let tempCards = [];
        pairList.forEach((pair, index) => {
            // Card 1 (Word)
            tempCards.push({ id: `w-${index}`, text: pair.word, matchId: `m-${index}`, pairIndex: index });
            // Card 2 (Match)
            tempCards.push({ id: `m-${index}`, text: pair.match, matchId: `w-${index}`, pairIndex: index });
        });

        // Shuffle
        tempCards.sort(() => 0.5 - Math.random());

        // Render
        this.grid.innerHTML = '';
        tempCards.forEach(card => {
            const el = document.createElement('div');
            el.className = 'vm-card';
            el.textContent = card.text;
            el.dataset.id = card.id;
            el.dataset.matchId = card.matchId;
            el.onclick = () => this.handleCardClick(el);
            this.grid.appendChild(el);
        });
    }

    handleCardClick(el) {
        if (el.classList.contains('matched') || el.classList.contains('wrong') || el === this.selectedCard) return;

        if (!this.selectedCard) {
            // Select first
            this.selectedCard = el;
            el.classList.add('selected');
        } else {
            // Select second
            const card1 = this.selectedCard;
            const card2 = el;

            if (card1.dataset.matchId === card2.dataset.id) {
                // Match!
                card1.classList.remove('selected');
                card1.classList.add('matched');
                card2.classList.add('matched');
                this.selectedCard = null;
                this.matchedPairs++;

                // Score
                this.updateScore(this.score + 20);

                if (this.matchedPairs === this.totalPairs) {
                    setTimeout(() => this.gameOver({ score: this.score, won: true }), 500);
                }
            } else {
                // Wrong
                card2.classList.add('wrong');
                card1.classList.add('wrong');
                card1.classList.remove('selected');
                this.selectedCard = null;

                // Score penalty
                this.updateScore(Math.max(0, this.score - 5));

                setTimeout(() => {
                    card1.classList.remove('wrong');
                    card2.classList.remove('wrong');
                }, 500);
            }
        }
    }
}
