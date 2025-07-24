// Système de pratique pour les flashcards
const practiceSystem = {
  currentSession: {
    cards: [],
    currentIndex: 0,
    score: 0,
    mode: 'typing', // 'typing' ou 'choice'
    language: null,
    direction: 'front-to-back', // ou 'back-to-front'
    answers: []
  },

  // Afficher le menu de sélection du mode pratique
  showPracticeMenu() {
    const container = document.getElementById('flashcardsList');
    if (!container) return;

    // Obtenir les langues disponibles
    const languages = this.getAvailableLanguages();
    
    if (languages.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <div class="empty-state-title">Aucune flashcard disponible</div>
          <div class="empty-state-text">
            Créez d'abord des flashcards pour commencer à pratiquer
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="practice-menu" style="max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="font-size: 48px; margin-bottom: 12px;">🎯</div>
          <h2 style="font-size: 24px; margin-bottom: 8px; color: #1f2937;">Mode Pratique</h2>
          <p style="color: #6b7280; font-size: 14px;">Pratiquez vos flashcards de façon interactive</p>
        </div>
        
        <!-- Configuration tout en un -->
        <div style="background: #f9fafb; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          
          <!-- Sélection de langue avec dropdown -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">
              📚 Langue à pratiquer
            </label>
            <select id="languageSelect" style="
              width: 100%;
              padding: 12px 16px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              font-size: 16px;
              background: white;
              cursor: pointer;
              appearance: none;
              background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg"%3e%3cpath d="M1 1L7 7L13 1" stroke="%236B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/%3e%3c/svg%3e');
              background-repeat: no-repeat;
              background-position: right 16px center;
              padding-right: 40px;
            ">
              <option value="">Choisir une langue...</option>
              ${languages.map(lang => `
                <option value="${lang.code}">${this.getFlagEmoji(lang.code)} ${lang.name} (${lang.count} mots)</option>
              `).join('')}
            </select>
          </div>

          <!-- Direction avec toggle switch -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">
              🔄 Direction de pratique
            </label>
            <div style="
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 4px;
              display: flex;
              position: relative;
            ">
              <div id="directionSlider" style="
                position: absolute;
                width: 50%;
                height: calc(100% - 8px);
                background: #3b82f6;
                border-radius: 8px;
                transition: transform 0.3s;
                top: 4px;
                left: 4px;
              "></div>
              <button class="direction-btn" data-direction="front-to-back" style="
                flex: 1;
                padding: 12px;
                background: none;
                border: none;
                cursor: pointer;
                position: relative;
                z-index: 1;
                transition: color 0.3s;
                color: white;
                font-weight: 600;
              ">
                🇫🇷 → <span id="targetLangIcon">🌍</span>
              </button>
              <button class="direction-btn" data-direction="back-to-front" style="
                flex: 1;
                padding: 12px;
                background: none;
                border: none;
                cursor: pointer;
                position: relative;
                z-index: 1;
                transition: color 0.3s;
                color: #6b7280;
                font-weight: 600;
              ">
                <span id="sourceLangIcon">🌍</span> → 🇫🇷
              </button>
            </div>
            <p id="directionHint" style="font-size: 12px; color: #6b7280; margin-top: 6px;">
              Voir le français et deviner la traduction
            </p>
          </div>

          <!-- Mode de réponse avec icônes -->
          <div>
            <label style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">
              ✍️ Mode de réponse
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <button class="mode-btn" data-mode="typing" style="
                padding: 16px;
                border: 2px solid #3b82f6;
                border-radius: 12px;
                background: #eff6ff;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
              ">
                <div style="font-size: 24px; margin-bottom: 4px;">⌨️</div>
                <div style="font-size: 14px; font-weight: 600; color: #1f2937;">Écriture</div>
                <div style="font-size: 11px; color: #6b7280;">Tapez la réponse</div>
              </button>
              <button class="mode-btn" data-mode="choice" style="
                padding: 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
              ">
                <div style="font-size: 24px; margin-bottom: 4px;">🔤</div>
                <div style="font-size: 14px; font-weight: 600; color: #1f2937;">Choix multiples</div>
                <div style="font-size: 11px; color: #6b7280;">4 options</div>
              </button>
            </div>
          </div>
        </div>

        <!-- Récapitulatif de la configuration -->
        <div id="configSummary" style="
          display: none;
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        ">
          <div style="font-size: 14px; color: #166534; font-weight: 600; margin-bottom: 8px;">
            ✅ Configuration prête !
          </div>
          <div id="summaryText" style="font-size: 13px; color: #15803d;"></div>
        </div>

        <!-- Bouton pour commencer -->
        <button class="btn btn-primary btn-block" id="startPracticeSessionBtn" disabled style="
          font-size: 18px;
          padding: 16px;
          opacity: 0.5;
          cursor: not-allowed;
          transition: all 0.3s;
        ">
          <span>🚀</span>
          <span>Commencer la pratique</span>
        </button>
      </div>
    `;

    // Ajouter les event listeners
    this.setupMenuListeners();
    
    // Event listener pour démarrer la pratique
    const startBtn = document.getElementById('startPracticeSessionBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startPractice());
    }
  },

  setupMenuListeners() {
    const languageSelect = document.getElementById('languageSelect');
    const directionBtns = document.querySelectorAll('.direction-btn');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const startBtn = document.getElementById('startPracticeSessionBtn');
    const configSummary = document.getElementById('configSummary');
    const summaryText = document.getElementById('summaryText');
    const directionSlider = document.getElementById('directionSlider');
    const directionHint = document.getElementById('directionHint');
    
    // Sélection de langue
    if (languageSelect) {
      languageSelect.addEventListener('change', (e) => {
        this.currentSession.language = e.target.value;
        
        if (e.target.value) {
          // Mettre à jour les icônes de direction
          const langFlag = this.getFlagEmoji(e.target.value);
          document.getElementById('targetLangIcon').textContent = langFlag;
          document.getElementById('sourceLangIcon').textContent = langFlag;
        }
        
        this.checkIfReady();
      });
    }
    
    // Direction toggle
    directionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const direction = btn.dataset.direction;
        this.currentSession.direction = direction;
        
        // Animation du slider
        if (direction === 'front-to-back') {
          directionSlider.style.transform = 'translateX(0)';
          directionBtns[0].style.color = 'white';
          directionBtns[1].style.color = '#6b7280';
          directionHint.textContent = 'Voir le français et deviner la traduction';
        } else {
          directionSlider.style.transform = 'translateX(100%)';
          directionBtns[0].style.color = '#6b7280';
          directionBtns[1].style.color = 'white';
          directionHint.textContent = 'Voir la traduction et deviner le français';
        }
        
        this.checkIfReady();
      });
    });
    
    // Mode de réponse
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.currentSession.mode = mode;
        
        // Mise à jour visuelle
        modeBtns.forEach(b => {
          if (b.dataset.mode === mode) {
            b.style.borderColor = '#3b82f6';
            b.style.background = '#eff6ff';
          } else {
            b.style.borderColor = '#e5e7eb';
            b.style.background = 'white';
          }
        });
        
        this.checkIfReady();
      });
    });
    
    // Vérifier si tout est prêt
    this.checkIfReady = () => {
      const isReady = this.currentSession.language && 
                      this.currentSession.direction && 
                      this.currentSession.mode;
      
      if (isReady) {
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
        
        // Afficher le résumé
        configSummary.style.display = 'block';
        const langName = this.getLanguageName(this.currentSession.language);
        const directionText = this.currentSession.direction === 'front-to-back' 
          ? `Français → ${langName}` 
          : `${langName} → Français`;
        const modeText = this.currentSession.mode === 'typing' ? 'Écriture' : 'Choix multiples';
        
        summaryText.textContent = `${directionText} • Mode ${modeText}`;
      } else {
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
        startBtn.style.cursor = 'not-allowed';
        configSummary.style.display = 'none';
      }
    };
    
    // Définir les valeurs par défaut
    this.currentSession.mode = 'typing';
    modeBtns[0].click();
  },

  startPractice() {
    // Filtrer les flashcards pour la langue sélectionnée
    const cards = flashcards.filter(card => 
      card.targetLanguage === this.currentSession.language || 
      card.sourceLanguage === this.currentSession.language
    );

    if (cards.length === 0) {
      showNotification('Aucune flashcard pour cette langue', 'error');
      return;
    }

    // Mélanger et préparer la session
    this.currentSession.cards = [...cards].sort(() => Math.random() - 0.5);
    this.currentSession.currentIndex = 0;
    this.currentSession.score = 0;
    this.currentSession.answers = [];

    this.showPracticeCard();
  },

  showPracticeCard() {
    const container = document.getElementById('flashcardsList');
    const session = this.currentSession;
    
    if (session.currentIndex >= session.cards.length) {
      this.showResults();
      return;
    }

    const card = session.cards[session.currentIndex];
    const progress = ((session.currentIndex + 1) / session.cards.length) * 100;

    // Déterminer question et réponse selon la direction
    let question, answer;
    if (session.direction === 'front-to-back') {
      question = card.front;
      answer = card.back;
    } else {
      question = card.back;
      answer = card.front;
    }

    container.innerHTML = `
      <div class="practice-container" style="max-width: 500px; margin: 0 auto; padding: 20px;">
        <!-- Header avec progression -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 20px; margin-bottom: 24px; color: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <div style="font-size: 12px; opacity: 0.9;">Question</div>
              <div style="font-size: 24px; font-weight: bold;">${session.currentIndex + 1} / ${session.cards.length}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; opacity: 0.9;">Score</div>
              <div style="font-size: 24px; font-weight: bold;">${session.score} ⭐</div>
            </div>
          </div>
          <div style="background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: white; height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
          </div>
        </div>

        <!-- Carte de question -->
        <div style="background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 40px; text-align: center; margin-bottom: 32px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: #f0f9ff; border-radius: 50%; opacity: 0.5;"></div>
          <div style="position: relative; z-index: 1;">
            <div style="font-size: 32px; color: #1f2937; margin-bottom: 12px; font-weight: 600; line-height: 1.3;">
              ${escapeHtml(question)}
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: #6b7280;">
              <span>${session.direction === 'front-to-back' ? '🇫🇷' : this.getFlagEmoji(session.language)}</span>
              <span>→</span>
              <span>${session.direction === 'front-to-back' ? this.getFlagEmoji(session.language) : '🇫🇷'}</span>
            </div>
          </div>
        </div>

        <!-- Zone de réponse -->
        <div id="answerZone">
          ${this.renderAnswerZone(card, answer)}
        </div>

        <!-- Boutons d'action -->
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button class="btn" id="skipCardBtn" style="flex: 1; background: #f3f4f6; color: #6b7280; border: none;">
            <span>⏭️</span>
            <span>Passer</span>
          </button>
          <button class="btn" id="quitPracticeBtn" style="background: #fee2e2; color: #dc2626; border: none;">
            <span>❌</span>
            <span>Quitter</span>
          </button>
        </div>
      </div>
    `;

    // Event listeners pour les boutons
    const skipBtn = document.getElementById('skipCardBtn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipCard());
    }
    
    const quitBtn = document.getElementById('quitPracticeBtn');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => this.quitPractice());
    }
    
    const checkBtn = document.getElementById('checkAnswerBtn');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => this.checkAnswer());
    }
    
    // Focus sur l'input si mode typing
    if (session.mode === 'typing') {
      const input = document.getElementById('practiceInput');
      if (input) {
        input.focus();
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.checkAnswer();
          }
        });
      }
    } else {
      // Event listeners pour les boutons de choix multiples
      document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const choice = btn.getAttribute('data-choice');
          this.selectChoice(choice);
        });
      });
    }
  },

  renderAnswerZone(card, correctAnswer) {
    if (this.currentSession.mode === 'typing') {
      return `
        <div style="background: #f9fafb; border-radius: 16px; padding: 24px;">
          <input type="text" id="practiceInput" placeholder="Tapez votre réponse..." style="
            width: 100%;
            padding: 20px;
            font-size: 20px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            text-align: center;
            transition: all 0.2s;
            background: white;
          " autocomplete="off">
          <button class="btn btn-primary btn-block" id="checkAnswerBtn" style="
            margin-top: 16px;
            padding: 16px;
            font-size: 18px;
            font-weight: 600;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            <span>✓</span>
            <span>Vérifier</span>
          </button>
        </div>
      `;
    } else {
      // Mode choix multiples
      const choices = this.generateChoices(correctAnswer, card);
      return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          ${choices.map((choice, index) => `
            <button class="choice-btn" data-choice="${choice.replace(/'/g, "&apos;")}" style="
              padding: 20px;
              border: 2px solid #e5e7eb;
              border-radius: 16px;
              background: white;
              cursor: pointer;
              transition: all 0.2s;
              font-size: 18px;
              font-weight: 500;
              position: relative;
              overflow: hidden;
            ">
              <span style="position: absolute; top: 8px; left: 12px; font-size: 12px; color: #9ca3af;">${String.fromCharCode(65 + index)}</span>
              <div style="margin-top: 8px;">${escapeHtml(choice)}</div>
            </button>
          `).join('')}
        </div>
      `;
    }
  },

  generateChoices(correctAnswer, card) {
    const choices = [correctAnswer];
    const allAnswers = flashcards
      .filter(f => f.id !== card.id)
      .map(f => this.currentSession.direction === 'front-to-back' ? f.back : f.front)
      .filter(a => a !== correctAnswer);

    // Ajouter 3 mauvaises réponses aléatoires
    while (choices.length < 4 && allAnswers.length > 0) {
      const randomIndex = Math.floor(Math.random() * allAnswers.length);
      const wrongAnswer = allAnswers.splice(randomIndex, 1)[0];
      if (!choices.includes(wrongAnswer)) {
        choices.push(wrongAnswer);
      }
    }

    // Si pas assez de choix, ajouter des variations
    while (choices.length < 4) {
      choices.push(correctAnswer + ' (variation)');
    }

    // Mélanger les choix
    return choices.sort(() => Math.random() - 0.5);
  },

  checkAnswer() {
    const input = document.getElementById('practiceInput');
    if (!input) return;

    const userAnswer = input.value.trim().toLowerCase();
    const card = this.currentSession.cards[this.currentSession.currentIndex];
    const correctAnswer = this.currentSession.direction === 'front-to-back' ? card.back : card.front;
    
    this.evaluateAnswer(userAnswer, correctAnswer.toLowerCase());
  },

  selectChoice(choice) {
    const card = this.currentSession.cards[this.currentSession.currentIndex];
    const correctAnswer = this.currentSession.direction === 'front-to-back' ? card.back : card.front;
    
    // Marquer visuellement le choix
    document.querySelectorAll('.choice-btn').forEach(btn => {
      if (btn.textContent === choice) {
        btn.style.background = '#eff6ff';
        btn.style.borderColor = '#3b82f6';
      }
    });

    setTimeout(() => {
      this.evaluateAnswer(choice.toLowerCase(), correctAnswer.toLowerCase());
    }, 300);
  },

  evaluateAnswer(userAnswer, correctAnswer) {
    const isCorrect = userAnswer === correctAnswer;
    
    // Enregistrer la réponse
    this.currentSession.answers.push({
      card: this.currentSession.cards[this.currentSession.currentIndex],
      userAnswer,
      correctAnswer,
      isCorrect
    });

    if (isCorrect) {
      this.currentSession.score++;
      showNotification('Correct! 🎉', 'success');
    } else {
      showNotification(`Incorrect. La réponse était: ${correctAnswer}`, 'error');
    }

    // Passer à la carte suivante après un délai
    setTimeout(() => {
      this.currentSession.currentIndex++;
      this.showPracticeCard();
    }, 1500);
  },

  skipCard() {
    this.currentSession.answers.push({
      card: this.currentSession.cards[this.currentSession.currentIndex],
      userAnswer: '',
      correctAnswer: this.currentSession.direction === 'front-to-back' 
        ? this.currentSession.cards[this.currentSession.currentIndex].back 
        : this.currentSession.cards[this.currentSession.currentIndex].front,
      isCorrect: false,
      skipped: true
    });

    this.currentSession.currentIndex++;
    this.showPracticeCard();
  },

  showResults() {
    const container = document.getElementById('flashcardsList');
    const session = this.currentSession;
    const percentage = Math.round((session.score / session.cards.length) * 100);

    container.innerHTML = `
      <div class="results-container" style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 16px;">
          ${percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : '💪'}
        </div>
        <h2 style="font-size: 32px; margin-bottom: 16px;">Session terminée!</h2>
        
        <div style="font-size: 48px; font-weight: bold; color: ${percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444'}; margin-bottom: 8px;">
          ${percentage}%
        </div>
        
        <div style="font-size: 18px; color: #6b7280; margin-bottom: 32px;">
          ${session.score} / ${session.cards.length} réponses correctes
        </div>

        <!-- Détails des réponses -->
        <div style="text-align: left; margin-bottom: 32px; max-height: 300px; overflow-y: auto;">
          ${session.answers.map((answer, index) => `
            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px;
              margin-bottom: 8px;
              background: ${answer.isCorrect ? '#f0fdf4' : '#fef2f2'};
              border-radius: 8px;
              border: 1px solid ${answer.isCorrect ? '#86efac' : '#fecaca'};
            ">
              <span style="font-size: 20px;">
                ${answer.isCorrect ? '✅' : answer.skipped ? '⏭️' : '❌'}
              </span>
              <div style="flex: 1;">
                <div style="font-weight: 600;">
                  ${escapeHtml(session.direction === 'front-to-back' ? answer.card.front : answer.card.back)}
                </div>
                <div style="font-size: 14px; color: #6b7280;">
                  ${answer.isCorrect ? 'Correct!' : answer.skipped ? 'Passé' : `Votre réponse: ${answer.userAnswer} | Correct: ${answer.correctAnswer}`}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Boutons d'action -->
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="btn btn-primary" id="newSessionBtn">
            Nouvelle session
          </button>
          <button class="btn btn-secondary" id="backToFlashcardsBtn">
            Retour aux flashcards
          </button>
        </div>
      </div>
    `;
    
    // Event listeners pour les boutons
    const newSessionBtn = document.getElementById('newSessionBtn');
    if (newSessionBtn) {
      newSessionBtn.addEventListener('click', () => this.showPracticeMenu());
    }
    
    const backBtn = document.getElementById('backToFlashcardsBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => updateFlashcards());
    }
  },

  quitPractice() {
    if (confirm('Êtes-vous sûr de vouloir quitter la session?')) {
      updateFlashcards();
    }
  },

  getAvailableLanguages() {
    const languages = {};
    
    flashcards.forEach(card => {
      // Compter les langues cibles
      if (card.targetLanguage && card.targetLanguage !== 'fr') {
        if (!languages[card.targetLanguage]) {
          languages[card.targetLanguage] = 0;
        }
        languages[card.targetLanguage]++;
      }
      
      // Compter les langues sources (si différentes de français)
      if (card.sourceLanguage && card.sourceLanguage !== 'fr') {
        if (!languages[card.sourceLanguage]) {
          languages[card.sourceLanguage] = 0;
        }
        languages[card.sourceLanguage]++;
      }
    });

    return Object.entries(languages).map(([code, count]) => ({
      code,
      name: this.getLanguageName(code),
      count
    }));
  },

  getLanguageName(code) {
    const names = {
      'en': 'Anglais',
      'es': 'Espagnol',
      'de': 'Allemand',
      'it': 'Italien',
      'pt': 'Portugais',
      'ar': 'Arabe',
      'zh': 'Chinois',
      'ja': 'Japonais',
      'ko': 'Coréen',
      'ru': 'Russe'
    };
    return names[code] || code.toUpperCase();
  },

  getFlagEmoji(code) {
    const flags = {
      'fr': '🇫🇷',
      'en': '🇬🇧',
      'es': '🇪🇸',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'ar': '🇸🇦',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'ru': '🇷🇺'
    };
    return flags[code] || '🌐';
  }
};

// Fonction helper pour échapper le HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Exporter pour utilisation dans popup.js
window.practiceSystem = practiceSystem;