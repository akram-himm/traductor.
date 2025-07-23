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
      <div class="practice-menu" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="font-size: 24px; margin-bottom: 24px; text-align: center;">
          🎯 Mode Pratique
        </h2>
        
        <!-- Étape 1: Choisir la langue -->
        <div class="practice-step" style="margin-bottom: 32px;">
          <h3 style="font-size: 16px; margin-bottom: 16px; color: #374151;">
            1. Choisissez la langue à pratiquer
          </h3>
          <div class="language-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;">
            ${languages.map(lang => `
              <button class="language-option" data-lang="${lang.code}" style="
                padding: 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
              ">
                <div style="font-size: 32px; margin-bottom: 8px;">${this.getFlagEmoji(lang.code)}</div>
                <div style="font-size: 14px; font-weight: 600;">${lang.name}</div>
                <div style="font-size: 12px; color: #6b7280;">${lang.count} mots</div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Étape 2: Choisir la direction -->
        <div class="practice-step" id="directionStep" style="display: none; margin-bottom: 32px;">
          <h3 style="font-size: 16px; margin-bottom: 16px; color: #374151;">
            2. Dans quelle direction pratiquer ?
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <button class="direction-option" data-direction="front-to-back" style="
              padding: 20px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              background: white;
              cursor: pointer;
              transition: all 0.2s;
              text-align: center;
            ">
              <div style="font-size: 20px; margin-bottom: 8px;">🇫🇷 → 🌍</div>
              <div style="font-weight: 600;">Français → Langue cible</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                Voir le mot français, écrire la traduction
              </div>
            </button>
            <button class="direction-option" data-direction="back-to-front" style="
              padding: 20px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              background: white;
              cursor: pointer;
              transition: all 0.2s;
              text-align: center;
            ">
              <div style="font-size: 20px; margin-bottom: 8px;">🌍 → 🇫🇷</div>
              <div style="font-weight: 600;">Langue cible → Français</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                Voir la traduction, écrire en français
              </div>
            </button>
          </div>
        </div>

        <!-- Étape 3: Choisir le mode de réponse -->
        <div class="practice-step" id="modeStep" style="display: none; margin-bottom: 32px;">
          <h3 style="font-size: 16px; margin-bottom: 16px; color: #374151;">
            3. Comment voulez-vous répondre ?
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <button class="mode-option" data-mode="typing" style="
              padding: 20px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              background: white;
              cursor: pointer;
              transition: all 0.2s;
              text-align: center;
            ">
              <div style="font-size: 32px; margin-bottom: 8px;">⌨️</div>
              <div style="font-weight: 600;">Écriture</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                Tapez la réponse au clavier
              </div>
            </button>
            <button class="mode-option" data-mode="choice" style="
              padding: 20px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              background: white;
              cursor: pointer;
              transition: all 0.2s;
              text-align: center;
            ">
              <div style="font-size: 32px; margin-bottom: 8px;">🔤</div>
              <div style="font-weight: 600;">Choix multiples</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                Choisir parmi 4 options
              </div>
            </button>
          </div>
        </div>

        <!-- Bouton pour commencer -->
        <div id="startPracticeBtn" style="display: none; text-align: center;">
          <button class="btn btn-primary btn-lg" onclick="practiceSystem.startPractice()" style="font-size: 18px; padding: 12px 32px;">
            🚀 Commencer la pratique
          </button>
        </div>
      </div>
    `;

    // Ajouter les event listeners
    this.setupMenuListeners();
  },

  setupMenuListeners() {
    // Langues
    document.querySelectorAll('.language-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Retirer la sélection précédente
        document.querySelectorAll('.language-option').forEach(b => {
          b.style.borderColor = '#e5e7eb';
          b.style.background = 'white';
        });
        
        // Marquer comme sélectionné
        btn.style.borderColor = '#3b82f6';
        btn.style.background = '#eff6ff';
        
        this.currentSession.language = btn.dataset.lang;
        document.getElementById('directionStep').style.display = 'block';
      });
    });

    // Direction
    document.querySelectorAll('.direction-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.direction-option').forEach(b => {
          b.style.borderColor = '#e5e7eb';
          b.style.background = 'white';
        });
        
        btn.style.borderColor = '#3b82f6';
        btn.style.background = '#eff6ff';
        
        this.currentSession.direction = btn.dataset.direction;
        document.getElementById('modeStep').style.display = 'block';
      });
    });

    // Mode
    document.querySelectorAll('.mode-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-option').forEach(b => {
          b.style.borderColor = '#e5e7eb';
          b.style.background = 'white';
        });
        
        btn.style.borderColor = '#3b82f6';
        btn.style.background = '#eff6ff';
        
        this.currentSession.mode = btn.dataset.mode;
        document.getElementById('startPracticeBtn').style.display = 'block';
      });
    });
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
      <div class="practice-container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Barre de progression -->
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; color: #6b7280;">Question ${session.currentIndex + 1} / ${session.cards.length}</span>
            <span style="font-size: 14px; color: #6b7280;">Score: ${session.score}</span>
          </div>
          <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #3b82f6; height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
          </div>
        </div>

        <!-- Question -->
        <div style="background: white; border: 2px solid #e5e7eb; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
          <div style="font-size: 28px; color: #1f2937; margin-bottom: 8px;">
            "${escapeHtml(question)}"
          </div>
          <div style="font-size: 14px; color: #6b7280;">
            ${session.direction === 'front-to-back' ? 'Traduisez en ' + this.getLanguageName(session.language) : 'Traduisez en français'}
          </div>
        </div>

        <!-- Zone de réponse -->
        <div id="answerZone">
          ${this.renderAnswerZone(card, answer)}
        </div>

        <!-- Boutons d'action -->
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button class="btn btn-secondary" onclick="practiceSystem.skipCard()">
            Passer →
          </button>
          <button class="btn btn-danger" onclick="practiceSystem.quitPractice()">
            Quitter
          </button>
        </div>
      </div>
    `;

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
    }
  },

  renderAnswerZone(card, correctAnswer) {
    if (this.currentSession.mode === 'typing') {
      return `
        <div>
          <input type="text" id="practiceInput" placeholder="Tapez votre réponse..." style="
            width: 100%;
            padding: 16px;
            font-size: 18px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            text-align: center;
            transition: all 0.2s;
          ">
          <button class="btn btn-primary btn-block" onclick="practiceSystem.checkAnswer()" style="margin-top: 16px;">
            Vérifier ✓
          </button>
        </div>
      `;
    } else {
      // Mode choix multiples
      const choices = this.generateChoices(correctAnswer, card);
      return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          ${choices.map((choice, index) => `
            <button class="choice-btn" onclick="practiceSystem.selectChoice('${choice.replace(/'/g, "\\'")}')" style="
              padding: 16px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              background: white;
              cursor: pointer;
              transition: all 0.2s;
              font-size: 16px;
            ">
              ${escapeHtml(choice)}
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
          <button class="btn btn-primary" onclick="practiceSystem.showPracticeMenu()">
            Nouvelle session
          </button>
          <button class="btn btn-secondary" onclick="updateFlashcards()">
            Retour aux flashcards
          </button>
        </div>
      </div>
    `;
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