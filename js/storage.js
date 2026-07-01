/**
 * TypeHero - Storage Manager
 * Handles local storage for scores, stats, user profiles, streaks, and leaderboards.
 */

class TypeHeroStorage {
  constructor() {
    this.historyKey = 'typehero_history';
    this.streakKey = 'typehero_streak';
    this.lastActiveKey = 'typehero_last_active';
    this.leaderboardKey = 'typehero_leaderboard';
    this.audioSettingsKey = 'typehero_audio_settings';
    this.initializeDefaultLeaderboard();
  }

  getAudioSettings() {
    const raw = localStorage.getItem(this.audioSettingsKey);
    return raw ? JSON.parse(raw) : null;
  }

  saveAudioSettings(settings) {
    localStorage.setItem(this.audioSettingsKey, JSON.stringify(settings));
  }

  // Retrieve complete typing history
  getHistory() {
    const data = localStorage.getItem(this.historyKey);
    return data ? JSON.parse(data) : [];
  }

  // Save a new test result
  saveResult(result) {
    // result format: { mode: 'beginner'|'mid'|'pro', wpm: number, accuracy: number, errors: number, duration: number, date: string }
    const history = this.getHistory();
    history.push({
      ...result,
      date: new Date().toISOString()
    });
    localStorage.setItem(this.historyKey, JSON.stringify(history));
    this.updateStreak();
    this.updateLeaderboard(result.wpm);
  }

  // Calculate daily streak
  getStreak() {
    const streak = localStorage.getItem(this.streakKey);
    return streak ? parseInt(streak, 10) : 0;
  }

  updateStreak() {
    const todayStr = new Date().toDateString();
    const lastActive = localStorage.getItem(this.lastActiveKey);
    let streak = this.getStreak();

    if (!lastActive) {
      // First time typing
      streak = 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastActive === todayStr) {
        // Already active today, streak remains the same
      } else if (lastActive === yesterdayStr) {
        // Consecutive day
        streak += 1;
      } else {
        // Streak broken
        streak = 1;
      }
    }

    localStorage.setItem(this.streakKey, streak.toString());
    localStorage.setItem(this.lastActiveKey, todayStr);
  }

  // Reset progress data
  clearData() {
    localStorage.removeItem(this.historyKey);
    localStorage.removeItem(this.streakKey);
    localStorage.removeItem(this.lastActiveKey);
    this.initializeDefaultLeaderboard(true);
  }

  // Statistics summaries
  getStats() {
    const history = this.getHistory();
    if (history.length === 0) {
      return {
        testsCompleted: 0,
        avgWpm: 0,
        maxWpm: 0,
        avgAccuracy: 0,
        recentWpm: []
      };
    }

    const totalWpm = history.reduce((sum, item) => sum + item.wpm, 0);
    const totalAccuracy = history.reduce((sum, item) => sum + item.accuracy, 0);
    const maxWpm = Math.max(...history.map(item => item.wpm));
    
    // Get last 8 tests for charting
    const recentWpm = history.slice(-8).map(item => ({
      wpm: item.wpm,
      accuracy: item.accuracy,
      mode: item.mode,
      date: new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }));

    return {
      testsCompleted: history.length,
      avgWpm: Math.round(totalWpm / history.length),
      maxWpm: Math.round(maxWpm),
      avgAccuracy: Math.round(totalAccuracy / history.length),
      recentWpm
    };
  }

  // Leaderboard
  initializeDefaultLeaderboard(force = false) {
    if (!localStorage.getItem(this.leaderboardKey) || force) {
      const defaultLeaderboard = [
        { name: 'WPM_God ⚡', wpm: 132, date: '2026-06-20', isMock: true },
        { name: 'KeyboardCat 🐱', wpm: 104, date: '2026-06-21', isMock: true },
        { name: 'TypeSlayer 🗡️', wpm: 88, date: '2026-06-22', isMock: true },
        { name: 'FingerDance 💃', wpm: 72, date: '2026-06-23', isMock: true },
        { name: 'ClickyClack ⌨️', wpm: 55, date: '2026-06-24', isMock: true }
      ];
      localStorage.setItem(this.leaderboardKey, JSON.stringify(defaultLeaderboard));
    }
  }

  getLeaderboard() {
    const lb = localStorage.getItem(this.leaderboardKey);
    return lb ? JSON.parse(lb) : [];
  }

  updateLeaderboard(userWpm) {
    const leaderboard = this.getLeaderboard();
    
    // Check if player deserves to be on leaderboard
    const minWpm = leaderboard.length < 5 ? 0 : leaderboard[leaderboard.length - 1].wpm;
    if (userWpm > minWpm) {
      // Prompt user or use default "You"
      const name = "You (Typing Hero)";
      
      // Check if user is already on the board with a lower score
      const existingUserIdx = leaderboard.findIndex(item => item.name === name);
      if (existingUserIdx !== -1) {
        if (leaderboard[existingUserIdx].wpm < userWpm) {
          leaderboard[existingUserIdx].wpm = userWpm;
          leaderboard[existingUserIdx].date = new Date().toISOString().split('T')[0];
        }
      } else {
        leaderboard.push({
          name: name,
          wpm: userWpm,
          date: new Date().toISOString().split('T')[0],
          isMock: false
        });
      }

      // Sort descending and keep top 5
      leaderboard.sort((a, b) => b.wpm - a.wpm);
      if (leaderboard.length > 5) {
        leaderboard.pop();
      }

      localStorage.setItem(this.leaderboardKey, JSON.stringify(leaderboard));
    }
  }
}

// Export instance to window
window.TypeHeroStorage = new TypeHeroStorage();
