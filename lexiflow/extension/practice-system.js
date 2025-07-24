// Système de pratique pour les flashcards
const practiceSystem = {
  currentSession: {
    cards: [],
    currentIndex: 0,
    score: 0,
    mode: 'typing', // 'typing' ou 'choice'
    language: null,
    direction: 'front-to-back', // ou 'back-to-front'
    answers: [],
    practiceMode: 'all' // 'all' ou 'failed'
  },
  failedCards: [], // Stocker les cartes ratées

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

    // Ajouter des styles pour les animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      .practice-menu { animation: fadeIn 0.3s ease-out; }
      .mode-btn:hover { animation: pulse 0.3s ease-in-out; }
      .language-warning { animation: pulse 1s infinite; }
    `;
    document.head.appendChild(style);

    container.innerHTML = `
      <div class="practice-menu" style="max-width: 400px; margin: 0 auto; padding: 12px;">
        <div style="text-align: center; margin-bottom: 20px; position: relative;">
          <div style="font-size: 32px; margin-bottom: 8px; position: relative; display: inline-block;">
            🎯
            <span style="position: absolute; top: -5px; right: -10px; font-size: 16px; animation: sparkle 2s infinite;">✨</span>
          </div>
          <h2 style="font-size: 18px; margin-bottom: 4px; color: #1f2937;">Mode Pratique</h2>
          <p style="color: #6b7280; font-size: 12px;">Pratiquez vos flashcards</p>
        </div>
        
        <!-- Configuration tout en un -->
        <div style="background: linear-gradient(145deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          
          <!-- Sélection de langue avec dropdown -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">
              📚 Langue à pratiquer
            </label>
            <select id="languageSelect" style="
              width: 100%;
              padding: 10px 14px;
              border: 2px solid #e5e7eb;
              border-radius: 10px;
              font-size: 14px;
              background: white;
              cursor: pointer;
              appearance: none;
              background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg"%3e%3cpath d="M1 1L7 7L13 1" stroke="%236B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/%3e%3c/svg%3e');
              background-repeat: no-repeat;
              background-position: right 12px center;
              padding-right: 36px;
              transition: all 0.2s;
            " onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#e5e7eb'">
              <option value="">Choisir une langue...</option>
              ${languages.map(lang => `
                <option value="${lang.code}" ${lang.count < 5 ? 'disabled' : ''}>
                  ${this.getFlagEmoji(lang.code)} ${lang.name} (${lang.count} mots) ${lang.count < 5 ? '⚠️' : ''}
                </option>
              `).join('')}
            </select>
            <div id="languageWarning" style="display: none; font-size: 11px; color: #dc2626; margin-top: 4px; animation: fadeIn 0.3s;">
              ⚠️ Cette langue nécessite au moins 5 mots
            </div>
          </div>

          <!-- Type de pratique -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">
              🎮 Type de pratique
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="practice-type-btn" data-type="all" style="
                padding: 8px;
                border: 2px solid #3b82f6;
                border-radius: 8px;
                background: #eff6ff;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 12px;
                font-weight: 500;
              ">
                📚 Toutes
              </button>
              <button class="practice-type-btn" data-type="failed" style="
                padding: 8px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 12px;
                font-weight: 500;
                position: relative;
              ">
                ❌ Ratées
                <span id="failedCount" style="
                  position: absolute;
                  top: -6px;
                  right: -6px;
                  background: #dc2626;
                  color: white;
                  font-size: 10px;
                  padding: 2px 6px;
                  border-radius: 10px;
                  display: ${this.getFailedCardsCount() > 0 ? 'inline-block' : 'none'};
                ">${this.getFailedCardsCount()}</span>
              </button>
            </div>
          </div>

          <!-- Direction avec toggle switch -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">
              🔄 Direction de pratique
            </label>
            <div style="
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 10px;
              padding: 3px;
              display: flex;
              position: relative;
              box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
              transition: all 0.2s;
            ">
              <div id="directionSlider" style="
                position: absolute;
                width: 50%;
                height: calc(100% - 6px);
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                border-radius: 7px;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                top: 3px;
                left: 3px;
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
              "></div>
              <button class="direction-btn" data-direction="front-to-back" style="
                flex: 1;
                padding: 8px;
                background: none;
                border: none;
                cursor: pointer;
                position: relative;
                z-index: 1;
                transition: color 0.3s;
                color: white;
                font-weight: 600;
                font-size: 12px;
              ">
                🇫🇷 → <span id="targetLangIcon">🌍</span>
              </button>
              <button class="direction-btn" data-direction="back-to-front" style="
                flex: 1;
                padding: 8px;
                background: none;
                border: none;
                cursor: pointer;
                position: relative;
                z-index: 1;
                transition: color 0.3s;
                color: #6b7280;
                font-weight: 600;
                font-size: 12px;
              ">
                <span id="sourceLangIcon">🌍</span> → 🇫🇷
              </button>
            </div>
            <p id="directionHint" style="font-size: 10px; color: #6b7280; margin-top: 4px;">
              Voir le français et deviner la traduction
            </p>
          </div>

          <!-- Mode de réponse avec icônes -->
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">
              ✍️ Mode de réponse
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="mode-btn" data-mode="typing" style="
                padding: 12px;
                border: 2px solid #3b82f6;
                border-radius: 10px;
                background: #eff6ff;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
                transform: scale(1);
              ">
                <div style="font-size: 20px; margin-bottom: 2px;">⌨️</div>
                <div style="font-size: 12px; font-weight: 600; color: #1f2937;">Écriture</div>
                <div style="font-size: 10px; color: #6b7280;">Tapez la réponse</div>
              </button>
              <button class="mode-btn" data-mode="choice" style="
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
                transform: scale(1);
              ">
                <div style="font-size: 20px; margin-bottom: 2px;">🔤</div>
                <div style="font-size: 12px; font-weight: 600; color: #1f2937;">Choix multiples</div>
                <div style="font-size: 10px; color: #6b7280;">4 options</div>
              </button>
            </div>
          </div>
        </div>

        <!-- Récapitulatif de la configuration -->
        <div id="configSummary" style="
          display: none;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #86efac;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 16px;
          animation: fadeIn 0.3s;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
        ">
          <div style="font-size: 12px; color: #166534; font-weight: 600; margin-bottom: 4px;">
            ✅ Configuration prête !
          </div>
          <div id="summaryText" style="font-size: 11px; color: #15803d;"></div>
        </div>

        <!-- Bouton pour commencer -->
        <button class="btn btn-primary btn-block" id="startPracticeSessionBtn" disabled style="
          font-size: 16px;
          padding: 14px;
          opacity: 0.5;
          cursor: not-allowed;
          transition: all 0.3s;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transform: scale(1);
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
    const practiceTypeBtns = document.querySelectorAll('.practice-type-btn');
    const startBtn = document.getElementById('startPracticeSessionBtn');
    const configSummary = document.getElementById('configSummary');
    const summaryText = document.getElementById('summaryText');
    const directionSlider = document.getElementById('directionSlider');
    const directionHint = document.getElementById('directionHint');
    const languageWarning = document.getElementById('languageWarning');
    
    // Sélection de langue
    if (languageSelect) {
      languageSelect.addEventListener('change', (e) => {
        this.currentSession.language = e.target.value;
        
        if (e.target.value) {
          // Vérifier si la langue a assez de mots
          const langCount = this.getLanguageCardCount(e.target.value);
          if (langCount < 5) {
            languageWarning.style.display = 'block';
            this.currentSession.language = null;
            languageSelect.value = '';
            return;
          } else {
            languageWarning.style.display = 'none';
          }
          
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
    
    // Type de pratique
    practiceTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.currentSession.practiceMode = type;
        
        // Mise à jour visuelle
        practiceTypeBtns.forEach(b => {
          if (b.dataset.type === type) {
            b.style.borderColor = '#3b82f6';
            b.style.background = '#eff6ff';
            b.style.transform = 'scale(1.05)';
          } else {
            b.style.borderColor = '#e5e7eb';
            b.style.background = 'white';
            b.style.transform = 'scale(1)';
          }
        });
        
        // Vérifier si on peut pratiquer les ratées
        if (type === 'failed' && this.getFailedCardsCount() === 0) {
          showNotification('Aucune flashcard ratée à pratiquer', 'info');
          this.currentSession.practiceMode = 'all';
          practiceTypeBtns[0].click();
          return;
        }
        
        this.checkIfReady();
      });
    });
    
    // Mode de réponse
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.currentSession.mode = mode;
        
        // Mise à jour visuelle avec animation
        modeBtns.forEach(b => {
          if (b.dataset.mode === mode) {
            b.style.borderColor = '#3b82f6';
            b.style.background = '#eff6ff';
            b.style.transform = 'scale(1.05)';
          } else {
            b.style.borderColor = '#e5e7eb';
            b.style.background = 'white';
            b.style.transform = 'scale(1)';
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
        const practiceText = this.currentSession.practiceMode === 'failed' ? 'Flashcards ratées' : 'Toutes les flashcards';
        
        summaryText.textContent = `${directionText} • ${modeText} • ${practiceText}`;
        
        // Animation du bouton prêt
        startBtn.style.transform = 'scale(1.05)';
        setTimeout(() => startBtn.style.transform = 'scale(1)', 300);
      } else {
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
        startBtn.style.cursor = 'not-allowed';
        configSummary.style.display = 'none';
      }
    };
    
    // Définir les valeurs par défaut
    this.currentSession.mode = 'typing';
    this.currentSession.practiceMode = 'all';
    modeBtns[0].click();
    practiceTypeBtns[0].click();
  },

  startPractice() {
    // Filtrer les flashcards pour la langue sélectionnée
    let cards = flashcards.filter(card => 
      card.targetLanguage === this.currentSession.language || 
      card.sourceLanguage === this.currentSession.language
    );
    
    // Si mode 'failed', filtrer seulement les ratées
    if (this.currentSession.practiceMode === 'failed') {
      const failedIds = this.getFailedCardIds();
      cards = cards.filter(card => failedIds.includes(card.id));
    }

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
  
  // Nouvelle méthode pour démarrer directement avec des paramètres
  startDirectPractice(cards, fromLang, toLang, direction, mode) {
    // Réinitialiser la session
    this.currentSession = {
      cards: [...cards].sort(() => Math.random() - 0.5),
      currentIndex: 0,
      score: 0,
      mode: mode,
      language: direction === 'forward' ? toLang : fromLang,
      direction: direction === 'forward' ? 'front-to-back' : 'back-to-front',
      answers: [],
      practiceMode: 'all',
      fromLang: fromLang,
      toLang: toLang
    };
    
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
      <div class="practice-container" style="max-width: 400px; margin: 0 auto; padding: 12px; background: #f9fafb; min-height: 100vh;">
        <!-- Header avec progression -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 12px; margin-bottom: 16px; color: white; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <div style="font-size: 10px; opacity: 0.9;">Question</div>
              <div style="font-size: 18px; font-weight: bold;">${session.currentIndex + 1} / ${session.cards.length}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; opacity: 0.9;">Score</div>
              <div style="font-size: 18px; font-weight: bold;">${session.score} ⭐</div>
            </div>
          </div>
          <div style="background: rgba(255,255,255,0.2); height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: white; height: 100%; width: ${progress}%; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);"></div>
          </div>
        </div>

        <!-- Carte de question -->
        <div style="background: white; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.08); padding: 24px; text-align: center; margin-bottom: 20px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 50%; opacity: 0.5;"></div>
          <div style="position: relative; z-index: 1;">
            <div style="font-size: 22px; color: #1f2937; margin-bottom: 8px; font-weight: 600; line-height: 1.3;">
              ${escapeHtml(question)}
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: #6b7280;">
              <span>${session.fromLang && session.toLang ? 
                (session.direction === 'front-to-back' ? this.getFlagEmoji(session.fromLang) : this.getFlagEmoji(session.toLang)) :
                (session.direction === 'front-to-back' ? '🇫🇷' : this.getFlagEmoji(session.language))
              }</span>
              <span>→</span>
              <span>${session.fromLang && session.toLang ? 
                (session.direction === 'front-to-back' ? this.getFlagEmoji(session.toLang) : this.getFlagEmoji(session.fromLang)) :
                (session.direction === 'front-to-back' ? this.getFlagEmoji(session.language) : '🇫🇷')
              }</span>
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
    const isCorrect = choice.toLowerCase() === correctAnswer.toLowerCase();
    
    // Marquer visuellement tous les boutons
    document.querySelectorAll('.choice-btn').forEach(btn => {
      const btnChoice = btn.getAttribute('data-choice');
      if (btnChoice === choice) {
        // Bouton sélectionné
        if (isCorrect) {
          btn.style.background = '#10b981';
          btn.style.borderColor = '#10b981';
          btn.style.color = 'white';
        } else {
          btn.style.background = '#ef4444';
          btn.style.borderColor = '#ef4444';
          btn.style.color = 'white';
        }
      } else if (btnChoice.toLowerCase() === correctAnswer.toLowerCase()) {
        // Montrer la bonne réponse
        btn.style.background = '#10b981';
        btn.style.borderColor = '#10b981';
        btn.style.color = 'white';
      }
      // Désactiver tous les boutons
      btn.style.pointerEvents = 'none';
    });

    // Enregistrer et continuer après un délai
    setTimeout(() => {
      this.evaluateAnswer(choice.toLowerCase(), correctAnswer.toLowerCase(), true);
    }, 1500);
  },

  evaluateAnswer(userAnswer, correctAnswer, skipNotification = false) {
    const isCorrect = userAnswer === correctAnswer;
    const currentCard = this.currentSession.cards[this.currentSession.currentIndex];
    
    // Enregistrer la réponse
    this.currentSession.answers.push({
      card: currentCard,
      userAnswer,
      correctAnswer,
      isCorrect
    });

    if (isCorrect) {
      this.currentSession.score++;
      if (!skipNotification) {
        showNotification('Correct! 🎉', 'success');
      }
      // Retirer de la liste des ratées si présent
      this.removeFromFailedCards(currentCard.id);
    } else {
      if (!skipNotification) {
        showNotification(`Incorrect. La réponse était: ${correctAnswer}`, 'error');
      }
      // Ajouter à la liste des ratées
      this.addToFailedCards(currentCard.id);
    }

    // Passer à la carte suivante après un délai
    setTimeout(() => {
      this.currentSession.currentIndex++;
      this.showPracticeCard();
    }, skipNotification ? 500 : 1500);
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
      <div class="results-container" style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; background: #f9fafb; min-height: 100vh;">
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

        <!-- Options pour continuer -->
        ${this.getFailedCardsCount() > 0 ? `
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">
              💡 Vous avez ${this.getFailedCardsCount()} mot(s) raté(s)
            </div>
            <button class="btn" id="practiceFailedBtn" style="background: #f59e0b; color: white; border: none;">
              🎯 Pratiquer les mots ratés
            </button>
          </div>
        ` : ''}

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
      newSessionBtn.addEventListener('click', () => {
        // Revenir à la sélection de langue si on était en mode direct
        if (window.showFlashcardsForPractice) {
          window.showFlashcardsForPractice();
        } else {
          this.showPracticeMenu();
        }
      });
    }
    
    const backBtn = document.getElementById('backToFlashcardsBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => updateFlashcards());
    }
    
    const practiceFailedBtn = document.getElementById('practiceFailedBtn');
    if (practiceFailedBtn) {
      practiceFailedBtn.addEventListener('click', () => {
        // Pratiquer seulement les mots ratés
        const failedIds = this.getFailedCardIds();
        const failedCards = flashcards.filter(card => failedIds.includes(card.id));
        
        if (failedCards.length > 0) {
          // Utiliser les langues de la session actuelle si disponibles
          const fromLang = session.fromLang || 'fr';
          const toLang = session.toLang || session.language;
          
          this.currentSession = {
            cards: [...failedCards].sort(() => Math.random() - 0.5),
            currentIndex: 0,
            score: 0,
            mode: session.mode,
            language: session.language,
            direction: session.direction,
            answers: [],
            practiceMode: 'failed',
            fromLang: fromLang,
            toLang: toLang
          };
          
          this.showPracticeCard();
        }
      });
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
  
  // Méthodes pour gérer les flashcards ratées
  getFailedCardIds() {
    const stored = localStorage.getItem('failedFlashcards');
    return stored ? JSON.parse(stored) : [];
  },
  
  getFailedCardsCount() {
    return this.getFailedCardIds().length;
  },
  
  addToFailedCards(cardId) {
    const failedIds = this.getFailedCardIds();
    if (!failedIds.includes(cardId)) {
      failedIds.push(cardId);
      localStorage.setItem('failedFlashcards', JSON.stringify(failedIds));
    }
  },
  
  removeFromFailedCards(cardId) {
    const failedIds = this.getFailedCardIds();
    const index = failedIds.indexOf(cardId);
    if (index > -1) {
      failedIds.splice(index, 1);
      localStorage.setItem('failedFlashcards', JSON.stringify(failedIds));
    }
  },
  
  getLanguageCardCount(languageCode) {
    return flashcards.filter(card => 
      card.targetLanguage === languageCode || 
      card.sourceLanguage === languageCode
    ).length;
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