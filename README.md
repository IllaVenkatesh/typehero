# TypeHero ⌨️

> From Zero Typing to Typing Hero. A premium, modern, responsive typing practice platform.

TypeHero is a modern, interactive typing trainer designed to help users improve speed, accuracy, and consistency through multiple difficulty levels and customizable practice modes. It runs entirely in the browser and requires no heavy setup.

🌐 Live Demo: https://fascinating-kringle-8fdc08.netlify.app/

---

## 🚀 Key Features

### 1. Progressive Difficulty Modes
- 🌱 Beginner Mode: Focused on letters and easy words. Hides metrics to emphasize accuracy and muscle memory, and shows a live interactive keyboard.
- 🚀 Mid Mode: Focuses on short sentences and displays live WPM and accuracy feedback.
- 👑 Pro Mode: Supports longer paragraphs and custom timer durations for endurance practice.
- 🆓 Freedom Mode: Lets you practice with your own content by uploading PDFs, JPGs, or PNGs, extracting the text, and editing it before you start.

### 2. Synthesized Audio Feedback
TypeHero features mechanical-style click and chime sounds generated in the browser using the Web Audio API.
- Tactile Click: Standard keypress feedback
- Deep Thud: Spacebar feedback
- Error Buzz: Mistake feedback
- Success Chime: Completion feedback
- Mute Control: Toggle sound from the header

### 3. Analytics & Streaks
- 📈 SVG progress charts for recent sessions
- 🏆 Local leaderboard support
- 🔥 Daily typing streak tracking
- 📊 Persistent practice logs stored in browser LocalStorage

---

## 🛠️ Tech Stack
- HTML5
- CSS3
- JavaScript (ES6)
- Local Storage API
- DOM Manipulation and Event Handling

---

## 📂 Project Structure

```text
typehero/
├── index.html
├── style.css
└── js/
    ├── app.js
    ├── words.js
    ├── audio.js
    └── storage.js
```

---

## 🛠️ How to Open and Play

TypeHero runs entirely in the browser and does not require active server dependencies.

### Method A: Direct File Execution (Recommended)
1. Navigate to your project directory.
2. Double-click index.html or open it in any modern browser.

### Method B: Local Server
If you prefer a local server:
- Node.js: Run `npx http-server -p 8080` in the project folder.
- Python: Run `python -m http.server 8080` in the project folder.
- Open http://localhost:8080

---

## 💡 Typing Best Practices
1. Home Row Positioning: Place your left fingers on A S D F and your right fingers on J K L ;.
2. Accuracy First: Aim for 95%+ accuracy before trying to go faster.
3. Don't Look Down: Trust your fingers and use the on-screen keyboard when needed.

---

## 📈 Future Enhancements
- User authentication
- Global leaderboard
- Typing certificates
- Dark/light theme toggle
- Multiplayer typing battles
- AI-powered typing analysis
- Personalized learning paths

---

## 👨‍💻 Author

Venkatesh Illa

B.Tech Artificial Intelligence & Machine Learning
Python Backend Developer | Full Stack Learner

---

## ⭐ Support
If you found this project useful, consider starring the repository or sharing feedback.
