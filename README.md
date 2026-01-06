# 🎮 ArcadeX - Premium Game Hub

**ArcadeX** is a modern, polished web platform featuring **21+ interactive mini-games** built entirely with Vanilla JavaScript, HTML5, and CSS3. 

![ArcadeX Preview](https://via.placeholder.com/800x400?text=ArcadeX+Preview) *<!-- You can replace this with a real screenshot later -->*

## ✨ Features

*   **21 Unique Games**: 
    *   **Memory**: Simon Says, Pattern Recall, Word Memory...
    *   **Logic**: 2048, Sudoku, Minesweeper, Tic Tac Toe...
    *   **Reflex**: Reaction Timer, Whack-a-Tile, Snake...
*   **Premium UI/UX**: Glassmorphism design, smooth transitions, and a responsive layout.
*   **Dark & Light Mode**: Seamless theme toggling with persistent preferences.
*   **Mobile Optimized**: "Perfect Fit" responsive design for all screen sizes.
*   **No Backend**: Fully client-side architecture using `localStorage` for high scores.

## 🚀 Live Demo

[Click here to view the live site on Netlify](https://freegam.netlify.app/) *(Update this link after deployment)*

## 🛠️ Installation & Local Setup

Since this is a static site, you don't need `npm` or complex build tools.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/rohan-rusho/arcade-x.git
    cd arcade-x
    ```

2.  **Run Locally**:
    *   **Option A (VS Code)**: Install the "Live Server" extension and click "Go Live".
    *   **Option B (Python)**: `python -m http.server 8000`
    *   **Option C (PowerShell)**: Run the included script:
        ```powershell
        ./start_server.ps1
        ```

3.  **Open in Browser**: Navigate to `http://localhost:8000` (or the port shown).

## 📂 Project Structure

```
/
├── index.html          # Main entry point
├── style.css           # Global styles & themes
├── favicon.svg         # Custom SVG Icon
├── js/
│   ├── app.js          # Core logic & routing
│   ├── storage.js      # LocalStorage wrapper
│   ├── game-interface.js # Base Game Class
│   └── games/          # Game Modules
│       ├── logic/      # (2048, Sudoku, etc.)
│       ├── memory/     # (Word Memory, etc.)
│       └── reflex/     # (Snake, Reaction, etc.)
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---
*Created by [rohan-rusho](https://github.com/rohan-rusho)*
