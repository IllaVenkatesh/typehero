/**
 * TypeHero - Core Application Logic
 * Implements typing engine, views router, visual keyboard highlights,
 * metrics tracking, dynamic charts, local storage binding, and Web Audio synths.
 */

class TypeHeroApp {
  constructor() {
    // Typing Engine State
    this.currentMode = 'pro'; // beginner, mid, pro, freedom
    this.timeLimit = 0;
    this.timeLeft = 0;
    this.timerInterval = null;
    this.isActive = false;
    this.hasStarted = false;
    this.textToType = '';
    this.currentIndex = 0;
    this.currentLessonIndex = 0;
    this.lessonTargetAccuracy = 95;
    this.sessionStartedAt = null;
    this.errorPatterns = {};
    this.lessonCompleted = false;
    this.lastLessonPassed = true;
    this.freedomSourceText = '';
    this.freedomTimerSeconds = 0;
    this.freedomLastFileName = '';
    this.practiceLevels = [
      {
        title: 'Home Row Keys',
        text: 'asdf jkl; asdf jkl; asdf jkl; jkl; sad lad fall ask'
      },
      {
        title: 'Top Row Keys',
        text: 'were wire power type quiet writer rower tower'
      },
      {
        title: 'Bottom Row Keys',
        text: 'zoom mix banana cabin vacuum'
      },
      {
        title: 'Common Words',
        text: 'the and that with have from people because'
      },
      {
        title: 'Sentences',
        text: 'The quick brown fox jumps over the lazy dog. Typing every day improves speed and accuracy. Practice consistently to build muscle memory.'
      }
    ];
    this.beginnerPracticeLevels = this.practiceLevels.map(lesson => ({ ...lesson }));
    
    // Stats accumulators
    this.correctCharsCount = 0;
    this.totalKeysPressed = 0;
    this.errorCount = 0;
    
    // UI Selectors Cache
    this.views = {};
    this.navLinks = null;
    this.currentView = 'home';
    
    // Sound Toggle State
    this.soundEnabled = true;

    // Beginner Mode Custom Keyboard Layout
    this.keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
      ['SPACE']
    ];
  }

  // --------------------------------------------------------------------------
  // Initialization & UI Binding
  // --------------------------------------------------------------------------
  init() {
    // 1. Initialize Views
    this.views = {
      home: document.getElementById('home-view'),
      practice: document.getElementById('practice-view'),
      stats: document.getElementById('stats-view'),
      about: document.getElementById('about-view')
    };
    this.navLinks = document.querySelectorAll('.nav-links .nav-link');

    // 2. Set Up Routing
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        this.switchView(target);
      });
    });

    document.getElementById('nav-logo').addEventListener('click', (e) => {
      e.preventDefault();
      this.switchView('home');
    });

    // "My Progress" header button
    document.getElementById('progress-btn').addEventListener('click', () => {
      this.switchView('stats');
    });

    // 3. Mode Cards Trigger buttons
    document.querySelectorAll('.mode-start-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode === 'freedom') {
          this.showFreedomPanel();
          return;
        }
        this.startPracticeSession(mode);
      });
    });

    // 4. Freedom Mode controls
    const freedomFileInput = document.getElementById('freedom-file-input');
    const freedomUploadBtn = document.getElementById('freedom-upload-btn');
    const freedomStartBtn = document.getElementById('freedom-start-btn');
    const freedomTimerSelect = document.getElementById('freedom-timer-select');
    const freedomTextPreview = document.getElementById('freedom-text-preview');

    freedomFileInput.addEventListener('change', () => {
      const fileName = freedomFileInput.files?.[0]?.name || 'No file selected';
      this.freedomLastFileName = fileName;
      this.updateFreedomStatus(`Selected ${fileName}`);
    });

    freedomUploadBtn.addEventListener('click', () => {
      this.handleFreedomFileUpload();
    });

    freedomStartBtn.addEventListener('click', () => {
      this.startFreedomPractice();
    });

    freedomTimerSelect.addEventListener('change', () => {
      this.freedomTimerSeconds = Number(freedomTimerSelect.value || 0);
      this.timeLimit = this.freedomTimerSeconds;
    });

    freedomTextPreview.addEventListener('input', () => {
      this.freedomSourceText = freedomTextPreview.value;
      this.updateFreedomStats();
    });

    // 5. Sound toggle & settings actions
    const soundBtn = document.getElementById('sound-toggle-btn');
    const soundSettingsBtn = document.getElementById('sound-settings-btn');
    this.soundEnabled = window.TypeHeroAudio.isEnabled();
    this.updateSoundBtnUI();
    this.bindSoundSettingsUI();
    soundBtn.addEventListener('click', () => {
      const enabled = window.TypeHeroAudio.toggle();
      this.soundEnabled = enabled;
      this.updateSoundBtnUI();
    });
    soundSettingsBtn.addEventListener('click', () => {
      this.openSoundSettingsModal();
    });

    // 6. Typing trigger actions
    const inputTrigger = document.getElementById('typing-input-trigger');
    inputTrigger.addEventListener('keydown', (e) => this.handleTypingKeydown(e));
    inputTrigger.addEventListener('keyup', (e) => this.handleTypingKeyUp(e));
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

    // Focus listener to maintain keyboard highlighting consistency
    inputTrigger.addEventListener('focus', () => {
      if (this.currentMode === 'beginner' && this.isActive) {
        this.updateKeyboardHighlight();
      }
    });

    // Click anywhere inside typing container focuses the capture box
    document.getElementById('typing-container-box').addEventListener('click', () => {
      inputTrigger.focus();
    });

    // 7. Practice view action buttons
    document.getElementById('restart-test-btn').addEventListener('click', () => {
      this.resetTest();
      inputTrigger.focus();
    });

    document.getElementById('next-lesson-btn').addEventListener('click', () => {
      this.advanceLesson();
    });
    
    document.getElementById('change-mode-btn').addEventListener('click', () => {
      this.stopTimer();
      this.switchView('home');
    });

    document.getElementById('back-to-home-btn').addEventListener('click', () => {
      this.stopTimer();
      this.switchView('home');
    });

    // 8. Result Modal buttons
    document.getElementById('modal-retry-btn').addEventListener('click', () => {
      this.hideResultModal();
      this.resetTest();
      inputTrigger.focus();
    });

    document.getElementById('retry-modal-retry-btn').addEventListener('click', () => {
      this.hideRetryModal();
      this.focusTypingInput();
    });

    document.getElementById('modal-stats-btn').addEventListener('click', () => {
      this.hideResultModal();
      this.switchView('stats');
    });

    document.getElementById('modal-close-btn').addEventListener('click', () => {
      this.hideResultModal();
      this.switchView('home');
    });

    // 9. Dashboard actions
    document.getElementById('clear-data-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all practice stats? This cannot be undone.')) {
        window.TypeHeroStorage.clearData();
        this.loadDashboardStats();
      }
    });

    // Initial lucide icon render
    lucide.createIcons();
    this.updateStreakBadge();
  }

  // --------------------------------------------------------------------------
  // Navigation & SPA Routing
  // --------------------------------------------------------------------------
  switchView(viewName) {
    if (!this.views[viewName]) return;

    // Deactivate current active views
    Object.keys(this.views).forEach(key => {
      this.views[key].classList.remove('active');
    });

    this.navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-target') === viewName) {
        link.classList.add('active');
      }
    });

    // Activate selected view
    this.views[viewName].classList.add('active');
    this.currentView = viewName;

    // Load dynamic view details
    if (viewName === 'stats') {
      this.loadDashboardStats();
    } else if (viewName === 'home') {
      this.updateStreakBadge();
    }

    // Stop active tests if moving away from practice view
    if (viewName !== 'practice' && this.isActive) {
      this.resetTest();
    }
  }

  updateSoundBtnUI() {
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (this.soundEnabled) {
      soundBtn.innerHTML = '<i data-lucide="volume-2"></i>';
      soundBtn.title = 'Mute Sound';
    } else {
      soundBtn.innerHTML = '<i data-lucide="volume-x"></i>';
      soundBtn.title = 'Unmute Sound';
    }
    lucide.createIcons();
  }

  bindSoundSettingsUI() {
    const modal = document.getElementById('sound-settings-modal');
    const closeBtn = document.getElementById('sound-settings-close-btn');
    const themeSelect = document.getElementById('audio-theme-select');
    const volumeSlider = document.getElementById('audio-volume-slider');
    const volumeValue = document.getElementById('audio-volume-value');
    const intensityButtons = document.querySelectorAll('.audio-intensity-option');

    if (!modal) return;

    closeBtn?.addEventListener('click', () => this.closeSoundSettingsModal());
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        this.closeSoundSettingsModal();
      }
    });

    themeSelect?.addEventListener('change', (event) => {
      window.TypeHeroAudio.setSettings({ theme: event.target.value });
      this.soundEnabled = window.TypeHeroAudio.isEnabled();
      this.updateSoundBtnUI();
      this.syncSoundSettingsUI();
    });

    volumeSlider?.addEventListener('input', (event) => {
      const volume = Number(event.target.value || 80);
      volumeValue.textContent = `${volume}%`;
      window.TypeHeroAudio.setSettings({ volume });
      this.soundEnabled = window.TypeHeroAudio.isEnabled();
      this.updateSoundBtnUI();
      this.syncSoundSettingsUI();
    });

    intensityButtons.forEach(button => {
      button.addEventListener('click', () => {
        const value = button.getAttribute('data-intensity');
        window.TypeHeroAudio.setSettings({ intensity: value });
        this.soundEnabled = window.TypeHeroAudio.isEnabled();
        this.updateSoundBtnUI();
        this.syncSoundSettingsUI();
      });
    });

    this.syncSoundSettingsUI();
  }

  syncSoundSettingsUI() {
    const settings = window.TypeHeroAudio.getSettings();
    const themeSelect = document.getElementById('audio-theme-select');
    const volumeSlider = document.getElementById('audio-volume-slider');
    const volumeValue = document.getElementById('audio-volume-value');
    const intensityButtons = document.querySelectorAll('.audio-intensity-option');

    if (themeSelect) {
      themeSelect.value = settings.theme || 'premium';
    }

    if (volumeSlider && volumeValue) {
      volumeSlider.value = settings.volume ?? 80;
      volumeValue.textContent = `${settings.volume ?? 80}%`;
    }

    intensityButtons.forEach(button => {
      const isActive = button.getAttribute('data-intensity') === (settings.intensity || 'soft');
      button.classList.toggle('active', isActive);
    });
  }

  openSoundSettingsModal() {
    const modal = document.getElementById('sound-settings-modal');
    modal?.classList.add('active');
    this.syncSoundSettingsUI();
  }

  closeSoundSettingsModal() {
    document.getElementById('sound-settings-modal')?.classList.remove('active');
  }

  flashTypingFeedback(type) {
    const container = document.getElementById('typing-container-box');
    if (!container) return;

    container.classList.remove('feedback-correct', 'feedback-error', 'feedback-success');
    container.classList.add(type === 'success' ? 'feedback-success' : type === 'error' ? 'feedback-error' : 'feedback-correct');

    clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(() => {
      container.classList.remove('feedback-correct', 'feedback-error', 'feedback-success');
    }, 220);
  }

  updateStreakBadge() {
    const streak = window.TypeHeroStorage.getStreak();
    // Update streak value in practice view
    document.getElementById('streak-count-val').textContent = streak;
  }

  normalizeMode(mode) {
    if (!mode) return 'pro';
    if (mode === 'medium' || mode === 'intermediate') return 'mid';
    if (mode === 'freedom') return 'freedom';
    return mode;
  }

  buildPracticeLevelsForMode(mode) {
    const normalizedMode = this.normalizeMode(mode);

    if (normalizedMode === 'beginner') {
      return this.beginnerPracticeLevels.map(lesson => ({ ...lesson }));
    }

    if (normalizedMode === 'mid') {
      const items = window.TYPING_DATA?.mid?.sentences || [];
      return items.slice(0, 5).map((text, index) => ({
        title: `Sentence ${index + 1}`,
        text
      }));
    }

    if (normalizedMode === 'freedom') {
      return this.buildFreedomPracticeLevels(this.freedomSourceText);
    }

    const items = window.TYPING_DATA?.pro?.paragraphs || [];
    return items.slice(0, 5).map((text, index) => ({
      title: `Paragraph ${index + 1}`,
      text
    }));
  }

  normalizePracticeText(text) {
    return String(text || '')
      .replace(/\r\n?/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  buildFreedomPracticeLevels(text) {
    const cleanedText = this.normalizePracticeText(text);

    if (!cleanedText) {
      return [{ title: 'Custom Practice', text: 'Practice with your own uploaded text.' }];
    }

    const segments = cleanedText
      .split(/(?<=[.!?])\s+/)
      .map(item => item.trim())
      .filter(Boolean);

    if (segments.length === 0) {
      return [{ title: 'Custom Practice', text: cleanedText }];
    }

    const lessons = [];
    let currentChunk = '';

    segments.forEach(segment => {
      const candidate = currentChunk ? `${currentChunk} ${segment}` : segment;
      if (candidate.length <= 130) {
        currentChunk = candidate;
      } else {
        lessons.push(currentChunk);
        currentChunk = segment;
      }
    });

    if (currentChunk) lessons.push(currentChunk);

    return lessons.slice(0, 5).map((lessonText, index) => ({
      title: index === 0 ? 'Custom Practice' : `Custom Passage ${index + 1}`,
      text: lessonText
    }));
  }

  showFreedomPanel() {
    const panel = document.getElementById('freedom-mode-panel');
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('freedom-file-input').focus();
  }

  updateFreedomStatus(message) {
    const statusEl = document.getElementById('freedom-status-message');
    if (statusEl) statusEl.textContent = message;
  }

  updateFreedomStats() {
    const preview = document.getElementById('freedom-text-preview');
    const charCountEl = document.getElementById('freedom-char-count');
    const wordCountEl = document.getElementById('freedom-word-count');
    const text = preview.value || '';
    charCountEl.textContent = `${text.length} characters`;
    wordCountEl.textContent = `${text.trim() ? text.trim().split(/\s+/).length : 0} words`;
  }

  showFreedomProcessing(isProcessing) {
    const indicator = document.getElementById('freedom-processing-indicator');
    indicator.classList.toggle('hidden', !isProcessing);
  }

  async handleFreedomFileUpload() {
    const fileInput = document.getElementById('freedom-file-input');
    const file = fileInput.files?.[0];

    if (!file) {
      this.updateFreedomStatus('Choose a PDF or image file first.');
      return;
    }

    this.showFreedomProcessing(true);
    this.updateFreedomStatus(`Reading ${file.name}...`);

    try {
      const fileName = file.name.toLowerCase();
      let extractedText = '';

      if (fileName.endsWith('.pdf')) {
        if (!window.pdfjsLib) {
          throw new Error('PDF support is not available right now.');
        }

        // Configure Worker Source for PDFJS UMD build
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map(item => item.str).join(' '));
          
          // Provide extraction progress
          this.updateFreedomStatus(`Reading page ${i} of ${pdf.numPages}...`);
        }
        extractedText = pages.join('\n\n').trim();
      } else if (file.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(fileName)) {
        if (!window.Tesseract) {
          throw new Error('Image OCR is not available right now.');
        }

        // Perform OCR with progress logging
        const { data } = await window.Tesseract.recognize(
          file, 
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing') {
                this.updateFreedomStatus(`Extracting text: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );
        extractedText = data.text.trim();
      } else {
        throw new Error('Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG.');
      }

      const preview = document.getElementById('freedom-text-preview');
      preview.value = extractedText || 'No text could be extracted from this file.';
      this.freedomSourceText = preview.value;
      this.updateFreedomStats();
      this.updateFreedomStatus(extractedText ? `Extracted ${extractedText.length} characters from ${file.name}.` : `No text was detected in ${file.name}.`);
    } catch (error) {
      this.updateFreedomStatus(error.message || 'Unable to extract text from this file.');
    } finally {
      this.showFreedomProcessing(false);
    }
  }

  startFreedomPractice() {
    const preview = document.getElementById('freedom-text-preview');
    const text = (preview.value || '').trim();

    if (!text) {
      this.updateFreedomStatus('Add some text first by uploading a file or typing in the preview box.');
      return;
    }

    this.freedomSourceText = text;
    this.currentMode = 'freedom';
    this.timeLimit = this.freedomTimerSeconds;
    this.practiceLevels = this.buildPracticeLevelsForMode('freedom');
    this.currentLessonIndex = 0;
    this.lessonCompleted = false;

    // Generate practice text early to avoid a blank typing display on slower renders
    // or when the view transition temporarily overlays content.
    this.generatePracticeText();

    document.getElementById('live-wpm-pill').classList.remove('hidden');
    document.getElementById('live-errors-pill').classList.remove('hidden');
    document.getElementById('practice-keyboard').classList.remove('hidden');
    this.buildVisualKeyboard();

    // Switch to the practice view and ensure mode indicator is updated.
    this.switchView('practice');

    const modeIndicator = document.getElementById('current-test-mode');
    modeIndicator.textContent = 'Freedom';
    modeIndicator.className = 'mode-indicator badge-freedom';

    // Reset the test state (this will regenerate text as well) to initialize metrics/timers.
    this.resetTest();

    // Regenerate again after reset and after the view has settled, and focus the input.
    this.generatePracticeText();

    setTimeout(() => {
      this.focusTypingInput();
      // final safeguard: regenerate once more after focus so text characters are present
      // and overlays won't hide the content.
      this.generatePracticeText();
    }, 150);
  }

  // --------------------------------------------------------------------------
  // Practice Session Lifecycle
  // --------------------------------------------------------------------------
  startPracticeSession(mode) {
    const normalizedMode = this.normalizeMode(mode);
    this.currentMode = normalizedMode;
    this.practiceLevels = this.buildPracticeLevelsForMode(normalizedMode);
    this.currentLessonIndex = 0;
    this.lessonCompleted = false;

    document.getElementById('live-wpm-pill').classList.remove('hidden');
    document.getElementById('live-errors-pill').classList.remove('hidden');
    document.getElementById('practice-keyboard').classList.remove('hidden');
    this.buildVisualKeyboard();

    this.switchView('practice');

    const modeIndicator = document.getElementById('current-test-mode');
    const modeLabel = normalizedMode === 'beginner' ? 'Beginner' : normalizedMode === 'mid' ? 'Intermediate' : normalizedMode === 'freedom' ? 'Freedom' : 'Pro';
    modeIndicator.textContent = modeLabel;
    modeIndicator.className = `mode-indicator badge-${normalizedMode === 'mid' ? 'medium' : normalizedMode}`;

    this.resetTest();

    setTimeout(() => {
      this.focusTypingInput();
    }, 100);
  }

  focusTypingInput() {
    const inputTrigger = document.getElementById('typing-input-trigger');
    const textDisplay = document.getElementById('typing-text-display');
    if (!inputTrigger) return;

    inputTrigger.classList.add('has-focus');
    if (textDisplay) {
      textDisplay.style.opacity = '1';
      textDisplay.style.visibility = 'visible';
    }
    inputTrigger.focus({ preventScroll: true });
  }

  resetTest() {
    this.stopTimer();
    this.timeLeft = 0;
    this.isActive = true;
    this.hasStarted = false;
    this.currentIndex = 0;
    this.correctCharsCount = 0;
    this.totalKeysPressed = 0;
    this.errorCount = 0;
    this.errorPatterns = {};
    this.sessionStartedAt = null;
    this.lessonCompleted = false;
    this.lastLessonPassed = true;

    this.generatePracticeText();
    this.updateMetricsUI();
    this.updateLessonUI();
    this.updateKeyboardHighlight();
    this.updateFingerGuidance();

    this.focusTypingInput();
  }

  generatePracticeText() {
    const textContainer = document.getElementById('typing-text-display');
    textContainer.innerHTML = '';

    const lesson = this.practiceLevels[this.currentLessonIndex] || this.practiceLevels[0];
    this.textToType = this.normalizePracticeText(lesson.text);

    if (!this.textToType) {
      this.textToType = 'Start typing here.';
    }

    for (let char of this.textToType) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char;
      textContainer.appendChild(span);
    }

    if (textContainer.firstChild) {
      textContainer.firstChild.classList.add('current');
    }
  }

  advanceLesson() {
    if (this.currentLessonIndex < this.practiceLevels.length - 1) {
      this.currentLessonIndex++;
      this.resetTest();
    } else {
      this.currentLessonIndex = 0;
      this.resetTest();
    }
  }

  updateLessonUI() {
    const lesson = this.practiceLevels[this.currentLessonIndex] || this.practiceLevels[0];
    const targetAccuracy = this.currentMode === 'beginner' || this.currentMode === 'freedom' ? 90 : this.lessonTargetAccuracy;
    document.getElementById('live-lesson').textContent = `${this.currentLessonIndex + 1}/${this.practiceLevels.length}`;
    document.getElementById('live-target').textContent = `${targetAccuracy}%+`;
    document.getElementById('practice-status-text').textContent = `${lesson.title} • Focus on accuracy first. Complete the line to unlock the next lesson.`;
    document.getElementById('next-lesson-btn').disabled = !this.lessonCompleted;
    document.getElementById('next-lesson-btn').classList.toggle('disabled', !this.lessonCompleted);
  }

  // --------------------------------------------------------------------------
  // Keyboard UI Generation (Beginner Mode)
  // --------------------------------------------------------------------------
  buildVisualKeyboard() {
    const container = document.getElementById('practice-keyboard');
    container.innerHTML = '';
    
    this.keyboardLayout.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'kbd-row';
      
      row.forEach(key => {
        const keySpan = document.createElement('span');
        keySpan.className = 'kbd-key';
        
        if (key === 'SPACE') {
          keySpan.classList.add('space-key');
          keySpan.textContent = 'Space';
          keySpan.setAttribute('data-key', ' ');
        } else {
          keySpan.textContent = key;
          keySpan.setAttribute('data-key', key.toLowerCase());
        }
        
        rowDiv.appendChild(keySpan);
      });
      container.appendChild(rowDiv);
    });
  }

  updateKeyboardHighlight() {
    document.querySelectorAll('#practice-keyboard .kbd-key').forEach(k => {
      k.classList.remove('highlight');
    });

    if (this.currentIndex >= this.textToType.length) return;

    const targetChar = this.textToType[this.currentIndex].toLowerCase();
    const keyEl = document.querySelector(`#practice-keyboard .kbd-key[data-key="${targetChar}"]`);

    if (keyEl) {
      keyEl.classList.add('highlight');
    }
  }

  updateFingerGuidance() {
    if (this.currentIndex >= this.textToType.length) {
      document.getElementById('practice-finger-guidance').textContent = 'Finger guide: Ready for the next step';
      return;
    }

    const char = this.textToType[this.currentIndex];
    const guidance = this.getFingerGuide(char);
    document.getElementById('practice-finger-guidance').textContent = `Finger guide: ${guidance}`;
  }

  getFingerGuide(char) {
    const key = (char || ' ').toLowerCase();
    const fingerMap = {
      a: 'Left Pinky',
      s: 'Left Ring',
      d: 'Left Middle',
      f: 'Left Index',
      j: 'Right Index',
      k: 'Right Middle',
      l: 'Right Ring',
      ';': 'Right Pinky',
      q: 'Left Pinky',
      w: 'Left Ring',
      e: 'Left Middle',
      r: 'Left Index',
      t: 'Left Index',
      y: 'Right Index',
      u: 'Right Index',
      i: 'Right Middle',
      o: 'Right Ring',
      p: 'Right Pinky',
      z: 'Left Pinky',
      x: 'Left Ring',
      c: 'Left Middle',
      v: 'Left Index',
      b: 'Left Index',
      n: 'Right Index',
      m: 'Right Index',
      ' ': 'Both Hands'
    };

    return fingerMap[key] || 'Both Hands';
  }

  // --------------------------------------------------------------------------
  // Typing Mechanics
  // --------------------------------------------------------------------------
  handleGlobalKeydown(e) {
    if (e.key !== 'Enter' || !this.lessonCompleted) return;

    e.preventDefault();
    e.stopPropagation();
    this.handleEnterAdvance();
  }

  handleEnterAdvance() {
    if (!this.lessonCompleted) return;

    if ((this.currentMode === 'beginner' || this.currentMode === 'mid' || this.currentMode === 'pro' || this.currentMode === 'freedom') && !this.lastLessonPassed) {
      this.hideRetryModal();
      this.resetTest();
      return;
    }

    if (this.lastLessonPassed) {
      const nextLessonBtn = document.getElementById('next-lesson-btn');
      if (nextLessonBtn && !nextLessonBtn.disabled) {
        nextLessonBtn.click();
      } else {
        this.advanceLesson();
      }
    }
  }

  handleTypingKeydown(e) {
    if (!this.isActive && e.key !== 'Enter') return;

    // Prevent scrolling with Spacebar and page navigations
    if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
    }

    if (e.key === 'Enter') {
      if (this.lessonCompleted) {
        this.handleEnterAdvance();
      }
      return;
    }

    // Ignore action key combinations (e.g. Ctrl+R, etc.)
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Start timer on first keystroke
    if (!this.hasStarted) {
      this.startTimer();
      this.hasStarted = true;
    }

    const key = e.key;

    // Manage visual keypress styling (Tactile response)
    try {
      const escapedKey = CSS.escape(key.toLowerCase());
      const visualKey = document.querySelector(`#practice-keyboard .kbd-key[data-key="${escapedKey}"]`);
      if (visualKey) {
        visualKey.classList.add('active-press');
      }
    } catch (err) {
      // Ignore selector syntax errors for random special characters
    }

    // Standard character keys typed
    if (key.length === 1) {
      this.totalKeysPressed++;
      
      const charSpans = document.querySelectorAll('#typing-text-display .char');
      const expectedChar = this.textToType[this.currentIndex];

      if (key === expectedChar) {
        // Correct key pressed
        charSpans[this.currentIndex].classList.remove('incorrect', 'current');
        charSpans[this.currentIndex].classList.add('correct');
        this.correctCharsCount++;
        
        // Sound feedback
        if (key === ' ') {
          window.TypeHeroAudio.playSpace();
        } else {
          window.TypeHeroAudio.playClick();
        }

        this.flashTypingFeedback('correct');

        this.currentIndex++;
        
        if (this.currentIndex >= this.textToType.length) {
          this.completeLesson();
          return;
        }

        charSpans[this.currentIndex].classList.add('current');
        this.scrollTextIntoView(charSpans[this.currentIndex]);

      } else {
        charSpans[this.currentIndex].classList.remove('current');
        charSpans[this.currentIndex].classList.add('incorrect');
        this.errorCount++;
        this.errorPatterns[key] = (this.errorPatterns[key] || 0) + 1;
        window.TypeHeroAudio.playError();

        this.currentIndex++;

        this.flashTypingFeedback('error');

        if (this.currentIndex >= this.textToType.length) {
          this.completeLesson();
          return;
        }

        charSpans[this.currentIndex].classList.add('current');
        this.scrollTextIntoView(charSpans[this.currentIndex]);
      }

      this.updateMetricsUI();
      this.updateKeyboardHighlight();
      this.updateFingerGuidance();
    }
    
    // Backspace: Let users correct errors (only in Medium & Pro modes)
    else if (key === 'Backspace' && this.currentMode !== 'beginner') {
      if (this.currentIndex > 0) {
        const charSpans = document.querySelectorAll('#typing-text-display .char');
        charSpans[this.currentIndex].classList.remove('current', 'incorrect');
        
        this.currentIndex--;
        
        // Decrement correct character count if we are undoing a correct letter
        if (charSpans[this.currentIndex].classList.contains('correct')) {
          this.correctCharsCount = Math.max(0, this.correctCharsCount - 1);
        }
        
        charSpans[this.currentIndex].classList.remove('correct', 'incorrect');
        charSpans[this.currentIndex].classList.add('current');
        
        this.scrollTextIntoView(charSpans[this.currentIndex]);
        this.updateMetricsUI();
      }
    }
  }

  handleTypingKeyUp(e) {
    const key = e.key;
    try {
      const escapedKey = CSS.escape(key.toLowerCase());
      const visualKey = document.querySelector(`#practice-keyboard .kbd-key[data-key="${escapedKey}"]`);
      if (visualKey) {
        visualKey.classList.remove('active-press');
      }
    } catch (err) {
      // Ignore selector syntax errors
    }
  }

  scrollTextIntoView(charSpan) {
    // Keep typed line vertically centered in the textbox if content overflows
    const container = document.getElementById('typing-container-box');
    const containerRect = container.getBoundingClientRect();
    const charRect = charSpan.getBoundingClientRect();

    if (charRect.bottom > containerRect.bottom - 40 || charRect.top < containerRect.top + 40) {
      charSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // --------------------------------------------------------------------------
  // Lesson-Based Metrics & Progression
  // --------------------------------------------------------------------------
  startTimer() {
    this.sessionStartedAt = performance.now();

    if (this.timeLimit > 0) {
      this.timeLeft = this.timeLimit;
      this.updateMetricsUI();

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      this.timerInterval = setInterval(() => {
        if (!this.isActive) return;
        this.timeLeft = Math.max(0, this.timeLeft - 1);
        this.updateMetricsUI();

        if (this.timeLeft === 0) {
          this.completeLesson();
        }
      }, 1000);
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateMetricsUI() {
    const accuracy = this.calculateAccuracy();
    const wpm = this.calculateWpm();
    const targetAccuracy = this.currentMode === 'beginner' || this.currentMode === 'freedom' ? 90 : this.lessonTargetAccuracy;

    document.getElementById('live-accuracy').textContent = `${accuracy}%`;
    document.getElementById('live-wpm').textContent = wpm;
    document.getElementById('live-errors').textContent = this.errorCount;
    document.getElementById('live-lesson').textContent = `${this.currentLessonIndex + 1}/${this.practiceLevels.length}`;
    document.getElementById('live-target').textContent = this.timeLimit > 0 ? `${this.timeLeft}s` : `${targetAccuracy}%+`;

    const accuracyColor = accuracy >= 95 ? 'var(--color-success)' : accuracy >= 90 ? 'var(--color-warning)' : 'var(--color-error)';
    document.getElementById('live-accuracy').style.color = accuracyColor;
  }

  calculateAccuracy() {
    if (this.totalKeysPressed === 0) return 100;
    const rawAcc = Math.round((this.correctCharsCount / this.totalKeysPressed) * 100);
    return Math.max(0, Math.min(100, rawAcc));
  }

  calculateWpm() {
    if (!this.sessionStartedAt) return 0;
    const elapsedSeconds = Math.max(1, (performance.now() - this.sessionStartedAt) / 1000);
    const wpm = Math.round((this.correctCharsCount / 5) / (elapsedSeconds / 60));
    return Math.max(0, wpm);
  }

  completeLesson() {
    this.stopTimer();
    this.isActive = false;
    this.lessonCompleted = true;

    const finalAccuracy = this.calculateAccuracy();
    const finalWpm = this.calculateWpm();
    const lesson = this.practiceLevels[this.currentLessonIndex] || this.practiceLevels[0];
    const targetAccuracy = this.currentMode === 'beginner' || this.currentMode === 'freedom' ? 90 : this.lessonTargetAccuracy;
    const passed = finalAccuracy >= targetAccuracy;
    this.lastLessonPassed = passed;

    if (passed) {
      this.flashTypingFeedback('success');
    }

    window.TypeHeroAudio.playSuccess();

    const scoreResult = {
      mode: this.currentMode,
      wpm: finalWpm,
      accuracy: finalAccuracy,
      errors: this.errorCount,
      duration: 0
    };

    window.TypeHeroStorage.saveResult(scoreResult);
    this.updateMetricsUI();
    this.updateLessonUI();

    const statusText = passed
      ? `Great work! ${lesson.title} is complete. Press Enter to continue to the next lesson.`
      : this.currentMode === 'beginner' || this.currentMode === 'mid' || this.currentMode === 'pro' || this.currentMode === 'freedom'
        ? `Accuracy needs to be ${targetAccuracy}% or higher to unlock the next lesson. Press Enter to retry this level.`
        : `Accuracy needs to be ${targetAccuracy}% or higher to unlock the next lesson. Try again.`;
    document.getElementById('practice-status-text').textContent = statusText;
    document.getElementById('next-lesson-btn').disabled = !passed;
    document.getElementById('next-lesson-btn').classList.toggle('disabled', !passed);

    if (!passed) {
      document.getElementById('practice-finger-guidance').textContent = `Focus practice: ${this.getTopMistake()}`;
      this.showRetryModal(finalAccuracy, targetAccuracy);
    } else {
      this.showSuccessPrompt();
    }

    this.updateStreakBadge();
  }

  showSuccessPrompt() {
    const prompt = document.getElementById('practice-status-text');
    prompt.textContent = `${prompt.textContent} Press Enter to continue.`;
  }

  showRetryModal(finalAccuracy, targetAccuracy) {
    const modal = document.getElementById('retry-modal');
    const accuracyText = document.getElementById('retry-modal-accuracy');
    const titleText = document.getElementById('retry-modal-title');

    accuracyText.textContent = `${finalAccuracy}%`;
    titleText.textContent = 'Level Locked';
    document.getElementById('retry-modal-message').textContent = `You need ${targetAccuracy}% accuracy or higher to unlock this level.`;
    modal.classList.add('active');
    this.focusTypingInput();
  }

  hideRetryModal() {
    document.getElementById('retry-modal').classList.remove('active');
  }

  getTopMistake() {
    const entries = Object.entries(this.errorPatterns).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return 'keep your rhythm steady';
    return `repeat ${entries[0][0]} for extra practice`;
  }

  showResultModal(result) {
    const modal = document.getElementById('result-modal');
    
    // Load values
    document.getElementById('result-wpm').textContent = result.wpm;
    document.getElementById('result-accuracy').textContent = `${result.accuracy}%`;
    document.getElementById('result-errors').textContent = result.errors;
    
    // Dynamic feedback levels based on speed and correctness
    let rankText = "Typing Rookie 🥉";
    let descText = "Keep practicing! Focus on getting those keys right first, and speed will follow.";
    let iconClass = "award";

    if (result.wpm >= 20 && result.wpm < 40) {
      rankText = "Keyboard Apprentice 🥈";
      descText = "Good progress! You're building basic finger memory. Keep touch typing!";
    } else if (result.wpm >= 40 && result.wpm < 60) {
      rankText = "Touch Typer 🥇";
      descText = "Excellent work! You can now type at solid conversational speeds. Focus on posture.";
      iconClass = "sparkles";
    } else if (result.wpm >= 60 && result.wpm < 80) {
      rankText = "Keyboard Warrior 🚀";
      descText = "Incredible! You are typing faster than most average computer users. Keep pushing.";
      iconClass = "zap";
    } else if (result.wpm >= 80 && result.wpm < 100) {
      rankText = "Speed Demon ⚡";
      descText = "Blazing fast! Your fingers are dancing on the keys. A true professional.";
      iconClass = "flame";
    } else if (result.wpm >= 100) {
      rankText = "Typing Hero 🏆";
      descText = "God-like status! The keyboard has become an extension of your thoughts. Bravo!";
      iconClass = "crown";
    }

    // Accuracy penalty warning
    if (result.accuracy < 90) {
      descText += " However, your accuracy was a bit low. Slow down and prioritize typing correctly first!";
    }

    document.getElementById('feedback-rating').textContent = `Rank: ${rankText}`;
    document.getElementById('feedback-text').textContent = descText;
    
    // Set trophy wrapper icon
    const iconWrapper = document.getElementById('result-trophy-wrapper');
    iconWrapper.innerHTML = `<i data-lucide="${iconClass}"></i>`;
    
    // Dynamic color gradient changes on rank trophy wrapper
    if (result.wpm >= 80) {
      iconWrapper.style.background = 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)';
      iconWrapper.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.4)';
    } else if (result.wpm >= 40) {
      iconWrapper.style.background = 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)';
      iconWrapper.style.boxShadow = '0 0 25px rgba(59, 130, 246, 0.4)';
    } else {
      iconWrapper.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      iconWrapper.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.4)';
    }

    lucide.createIcons();
    modal.classList.add('active');
  }

  hideResultModal() {
    document.getElementById('result-modal').classList.remove('active');
  }

  // --------------------------------------------------------------------------
  // Statistics Dashboard Rendering
  // --------------------------------------------------------------------------
  loadDashboardStats() {
    const stats = window.TypeHeroStorage.getStats();
    
    // Summary values
    document.getElementById('stat-avg-wpm').textContent = stats.avgWpm;
    document.getElementById('stat-max-wpm').textContent = stats.maxWpm;
    document.getElementById('stat-avg-accuracy').textContent = `${stats.avgAccuracy}%`;
    document.getElementById('stat-streak').textContent = window.TypeHeroStorage.getStreak();

    // Render local leaderboard lists
    this.renderLeaderboard();

    // Render detailed history table
    const tableBody = document.getElementById('history-table-body');
    tableBody.innerHTML = '';

    const history = window.TypeHeroStorage.getHistory();
    if (history.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-dark); padding: 2rem;">No test history yet. Start practice to see scores!</td></tr>`;
    } else {
      // Display newest records first
      [...history].reverse().forEach(item => {
        const tr = document.createElement('tr');
        
        const dateStr = new Date(item.date).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        tr.innerHTML = `
          <td>${dateStr}</td>
          <td><span class="table-mode-badge badge-${item.mode}">${item.mode}</span></td>
          <td class="font-mono" style="font-weight: 700; color: var(--text-main);">${item.wpm} WPM</td>
          <td class="font-mono">${item.accuracy}%</td>
          <td class="font-mono text-error" style="color: var(--color-error);">${item.errors}</td>
        `;
        tableBody.appendChild(tr);
      });
    }

    // Draw Dynamic SVG line chart
    this.drawProgressChart(stats.recentWpm);
  }

  renderLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    container.innerHTML = '';

    const leaderboard = window.TypeHeroStorage.getLeaderboard();
    
    leaderboard.forEach((entry, index) => {
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      
      const rankNum = index + 1;
      let rankClass = 'rank-other';
      if (rankNum === 1) rankClass = 'rank-1';
      else if (rankNum === 2) rankClass = 'rank-2';
      else if (rankNum === 3) rankClass = 'rank-3';

      if (!entry.isMock) {
        item.classList.add('player-highlight');
      }

      item.innerHTML = `
        <div class="leader-rank-info ${rankClass}">
          <div class="rank-badge">${rankNum}</div>
          <span class="leader-name">${entry.name}</span>
        </div>
        <span class="leader-score">${entry.wpm} WPM</span>
      `;
      container.appendChild(item);
    });
  }

  drawProgressChart(recentTests) {
    const chartSvg = document.getElementById('stats-chart-svg');
    const chartGroup = document.getElementById('chart-elements');
    
    // Clear chart group
    chartGroup.innerHTML = '';
    
    if (recentTests.length === 0) {
      chartGroup.innerHTML = `<text x="300" y="120" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="14">Practice once to see progress chart!</text>`;
      return;
    }

    // Width limits: 50 to 570 (width 520)
    // Height limits: 30 to 190 (height 160)
    const paddingX = 50;
    const paddingY = 30;
    const chartWidth = 520;
    const chartHeight = 160;

    // Find auto-scaling max WPM height
    const wpmValues = recentTests.map(t => t.wpm);
    const maxVal = Math.max(...wpmValues, 60); // min scale ceiling of 60 WPM
    const yMaxCeil = Math.ceil(maxVal / 20) * 20; // Round to nearest 20

    // Draw Y axis labels & indicators
    for (let i = 0; i <= 4; i++) {
      const yVal = Math.round((yMaxCeil / 4) * i);
      const yPos = paddingY + chartHeight - (yVal / yMaxCeil) * chartHeight;
      
      // Draw small text label
      const yText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yText.setAttribute('x', '35');
      yText.setAttribute('y', (yPos + 4).toString());
      yText.setAttribute('text-anchor', 'end');
      yText.setAttribute('fill', 'rgba(255,255,255,0.3)');
      yText.setAttribute('font-size', '10');
      yText.setAttribute('font-family', 'var(--font-mono)');
      yText.textContent = yVal.toString();
      chartGroup.appendChild(yText);
    }

    // Compute coordinate mapping
    const points = [];
    const count = recentTests.length;
    
    recentTests.forEach((test, idx) => {
      // Distribute points evenly along X axis
      const x = count === 1 ? paddingX + (chartWidth / 2) : paddingX + (idx * (chartWidth / (count - 1)));
      const y = paddingY + chartHeight - (test.wpm / yMaxCeil) * chartHeight;
      points.push({ x, y, wpm: test.wpm, date: test.date, mode: test.mode });
    });

    // Define Linear Gradient for line filling/glowing effects
    let defs = chartSvg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-secondary)" />
          <stop offset="100%" stop-color="var(--color-primary)" />
        </linearGradient>
        <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-secondary)" stop-opacity="0.2" />
          <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
        </linearGradient>
      `;
      chartSvg.insertBefore(defs, chartSvg.firstChild);
    }

    // Build the SVG path string
    let pathD = '';
    let areaPathD = '';
    
    points.forEach((pt, idx) => {
      if (idx === 0) {
        pathD = `M ${pt.x} ${pt.y}`;
        areaPathD = `M ${pt.x} ${paddingY + chartHeight} L ${pt.x} ${pt.y}`;
      } else {
        // Curve fit or straight lines
        pathD += ` L ${pt.x} ${pt.y}`;
        areaPathD += ` L ${pt.x} ${pt.y}`;
      }
      
      if (idx === count - 1) {
        areaPathD += ` L ${pt.x} ${paddingY + chartHeight} Z`;
      }
    });

    // Draw glowing shaded area first
    if (count > 1) {
      const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      areaPath.setAttribute('d', areaPathD);
      areaPath.setAttribute('fill', 'url(#chart-area-gradient)');
      chartGroup.appendChild(areaPath);
    }

    // Draw main colored line path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('class', 'progress-chart-line');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'url(#chart-gradient)');
    chartGroup.appendChild(path);

    // Draw data points & value indicators
    points.forEach(pt => {
      // 1. Point Dot
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', pt.x.toString());
      dot.setAttribute('cy', pt.y.toString());
      dot.setAttribute('r', '5.5');
      dot.setAttribute('class', 'chart-dot');
      
      // Hover tooltip effect
      const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      tooltip.textContent = `${pt.wpm} WPM (${pt.mode} mode) on ${pt.date}`;
      dot.appendChild(tooltip);
      chartGroup.appendChild(dot);

      // 2. WPM Text values on top of dot
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', pt.x.toString());
      label.setAttribute('y', (pt.y - 12).toString());
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'chart-val-label');
      label.textContent = pt.wpm.toString();
      chartGroup.appendChild(label);

      // 3. Date label at bottom of axis
      const axisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      axisLabel.setAttribute('x', pt.x.toString());
      axisLabel.setAttribute('y', (paddingY + chartHeight + 25).toString());
      axisLabel.setAttribute('text-anchor', 'middle');
      axisLabel.setAttribute('class', 'chart-axis-label');
      axisLabel.textContent = pt.date;
      chartGroup.appendChild(axisLabel);
    });
  }
}

// Instantiate and start app on window DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.TypeHero = new TypeHeroApp();
  window.TypeHero.init();
});
