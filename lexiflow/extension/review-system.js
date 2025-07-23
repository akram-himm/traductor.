// Système de révision espacée pour les flashcards
const reviewSystem = {
  // Afficher l'interface de révision
  showReviewMode() {
    const container = document.getElementById('flashcardList');
    if (!container) return;

    // Filtrer les flashcards à réviser
    const now = new Date();
    const cardsToReview = flashcards.filter(card => {
      if (!card.nextReview) return true; // Nouvelles cartes
      return new Date(card.nextReview) <= now;
    });

    if (cardsToReview.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <div class="empty-state-title">Aucune révision nécessaire</div>
          <div class="empty-state-text">
            Toutes vos flashcards sont à jour! Revenez plus tard.
          </div>
        </div>
      `;
      return;
    }

    // Mélanger les cartes
    const shuffled = [...cardsToReview].sort(() => Math.random() - 0.5);
    let currentIndex = 0;
    
    const showCard = () => {
      if (currentIndex >= shuffled.length) {
        // Fin de la session
        container.innerHTML = `
          <div class="review-complete">
            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
            <h2 style="font-size: 24px; margin-bottom: 16px;">Session terminée!</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">
              Vous avez révisé ${shuffled.length} flashcard${shuffled.length > 1 ? 's' : ''}
            </p>
            <button class="btn btn-primary" onclick="showFlashcards()">
              Retour aux flashcards
            </button>
          </div>
        `;
        return;
      }

      const card = shuffled[currentIndex];
      let isFlipped = false;

      container.innerHTML = `
        <div class="review-container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div class="review-progress" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 14px; color: #6b7280;">Progression</span>
              <span style="font-size: 14px; color: #6b7280;">${currentIndex + 1} / ${shuffled.length}</span>
            </div>
            <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: #3b82f6; height: 100%; width: ${((currentIndex + 1) / shuffled.length) * 100}%; transition: width 0.3s;"></div>
            </div>
          </div>

          <div class="review-card" id="reviewCard" style="
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            padding: 48px 32px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <div id="cardContent">
              <div class="card-side front" style="font-size: 24px; color: #1f2937;">
                ${escapeHtml(card.front)}
              </div>
              <div class="card-side back" style="display: none; font-size: 24px; color: #1f2937;">
                ${escapeHtml(card.back)}
              </div>
            </div>
            <div style="position: absolute; bottom: 16px; right: 16px; font-size: 12px; color: #9ca3af;">
              Cliquez pour retourner
            </div>
          </div>

          <div class="review-actions" id="reviewActions" style="display: none; margin-top: 32px;">
            <div style="margin-bottom: 16px; text-align: center; color: #6b7280;">
              Comment était cette carte?
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
              <button class="btn btn-danger review-btn" data-performance="hard">
                <span style="font-size: 20px;">😓</span>
                <span style="display: block; margin-top: 4px;">Difficile</span>
                <span style="display: block; font-size: 12px; opacity: 0.7;">Revoir bientôt</span>
              </button>
              <button class="btn btn-warning review-btn" data-performance="medium">
                <span style="font-size: 20px;">🤔</span>
                <span style="display: block; margin-top: 4px;">Moyen</span>
                <span style="display: block; font-size: 12px; opacity: 0.7;">Revoir plus tard</span>
              </button>
              <button class="btn btn-success review-btn" data-performance="easy">
                <span style="font-size: 20px;">😊</span>
                <span style="display: block; margin-top: 4px;">Facile</span>
                <span style="display: block; font-size: 12px; opacity: 0.7;">Bien maîtrisé</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // Event listener pour retourner la carte
      const reviewCard = document.getElementById('reviewCard');
      reviewCard.onclick = () => {
        if (!isFlipped) {
          isFlipped = true;
          reviewCard.style.transform = 'rotateY(180deg)';
          setTimeout(() => {
            document.querySelector('.front').style.display = 'none';
            document.querySelector('.back').style.display = 'block';
            reviewCard.style.transform = 'rotateY(0)';
            document.getElementById('reviewActions').style.display = 'block';
          }, 150);
        }
      };

      // Event listeners pour les boutons de performance
      document.querySelectorAll('.review-btn').forEach(btn => {
        btn.onclick = async () => {
          const performance = btn.dataset.performance;
          
          try {
            // Envoyer la révision au serveur
            await apiRequest(`/api/flashcards/${card.id}/review`, {
              method: 'POST',
              body: JSON.stringify({ performance })
            });

            // Mettre à jour localement
            const flashcard = flashcards.find(f => f.id === card.id);
            if (flashcard) {
              flashcard.reviewCount = (flashcard.reviewCount || 0) + 1;
              flashcard.lastReviewed = new Date().toISOString();
              
              // Calculer la prochaine révision (algorithme simple)
              const intervals = {
                hard: 1, // 1 jour
                medium: 3, // 3 jours
                easy: 7 // 7 jours
              };
              
              const days = intervals[performance] * Math.pow(1.5, flashcard.reviewCount - 1);
              const nextReview = new Date();
              nextReview.setDate(nextReview.getDate() + Math.min(days, 365));
              flashcard.nextReview = nextReview.toISOString();
            }

            // Passer à la carte suivante
            currentIndex++;
            showCard();
          } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la révision:', error);
            showNotification('Erreur lors de l\'enregistrement', 'error');
          }
        };
      });
    };

    showCard();
  },

  // Obtenir le nombre de cartes à réviser
  getReviewCount() {
    const now = new Date();
    return flashcards.filter(card => {
      if (!card.nextReview) return true;
      return new Date(card.nextReview) <= now;
    }).length;
  },

  // Mettre à jour le badge de révision
  updateReviewBadge() {
    const count = this.getReviewCount();
    const badge = document.getElementById('reviewBadge');
    
    if (badge) {
      if (count > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = count;
      } else {
        badge.style.display = 'none';
      }
    }
  }
};

// Exporter pour utilisation dans popup.js
window.reviewSystem = reviewSystem;