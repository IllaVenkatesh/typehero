/**
 * TypeHero - Typing Corpora
 * Contains words and phrases for Beginner, Mid, and Pro modes.
 */

const TYPING_DATA = {
  beginner: {
    // Single characters focus (home row, basic keys)
    letters: [
      'a', 's', 'd', 'f', 'j', 'k', 'l', ';', 
      'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 
      'z', 'x', 'c', 'v', 'b', 'n', 'm'
    ],
    // Simple 3-4 letter words
    words: [
      'cat', 'dog', 'sun', 'run', 'map', 'key', 'tap', 'fit', 'net', 'cap',
      'box', 'jam', 'zip', 'fun', 'joy', 'sky', 'fly', 'wet', 'dry', 'hot',
      'cold', 'warm', 'fast', 'slow', 'easy', 'hard', 'play', 'sing', 'jump',
      'code', 'test', 'hero', 'zero', 'mind', 'work', 'rest', 'game', 'time'
    ]
  },
  
  mid: {
    sentences: [
      "The quick brown fox jumps over the lazy dog.",
      "Practice makes perfect when mastering a new skill.",
      "Always keep your fingers on the home row keys.",
      "Typing faster requires both speed and high accuracy.",
      "Beautiful user interfaces combine design and function.",
      "A journey of a thousand miles begins with a single step.",
      "Stay focused and maintain a steady typing rhythm.",
      "Learn to touch type without looking at the keyboard.",
      "Consistency is more important than speed when starting.",
      "Technology is best when it brings people together.",
      "Web development is an exciting field of creative work.",
      "The cursor points to the next character you should type.",
      "Keep practicing every single day to build muscle memory.",
      "A healthy posture helps you type comfortably for hours.",
      "Glassmorphism styling uses soft borders and blur effects."
    ]
  },

  pro: {
    paragraphs: [
      "Typing is an essential skill in the digital age. It not only helps you communicate better but also increases your productivity. By mastering the art of touch typing, you free your brain to focus on the content of your writing rather than the physical act of inputting characters. Over time, muscle memory takes over, enabling fluid and effortless composition.",
      
      "JavaScript is a lightweight, interpreted, or just-in-time compiled programming language with first-class functions. While it is most well-known as the scripting language for Web pages, many non-browser environments also use it, such as Node.js, Apache CouchDB and Adobe Acrobat. It is a prototype-based, multi-paradigm, single-threaded, dynamic language.",
      
      "Design is not just what it looks like and feels like. Design is how it works. A premium user interface combines visual hierarchy, accessibility, and high performance to build trust. Every transition should feel intentional, every color should align with a harmonious palette, and every component should serve a clear purpose to delight the user.",
      
      "The concept of clean code is central to software engineering. Clean code is code that is easy to understand and easy to change. Writing clean code requires discipline, experience, and a deep understanding of software design principles. It means choosing descriptive names, keeping functions small, and writing self-explanatory comments only when necessary.",
      
      "In the world of frontend development, creating responsive designs is non-negotiable. With users accessing web applications from a myriad of devices ranging from small watch faces to massive ultra-wide monitors, layout flexibility is paramount. CSS Grid and Flexbox provide powerful mechanisms to adapt user interfaces beautifully across all breakpoints."
    ]
  }
};

// Export to window object for browser access
window.TYPING_DATA = TYPING_DATA;
