// Gestion de la page d'abonnement
let currentUserData = null;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📋 Chargement de la page d\'abonnement');
  await loadSubscriptionData();
});

// Charger les données d'abonnement
async function loadSubscriptionData() {
  const contentDiv = document.getElementById('subscriptionContent');
  
  try {
    // Vérifier l'authentification
    const token = await authAPI.getToken();
    if (!token) {
      contentDiv.innerHTML = '<div class="error-message">Authentication required</div>';
      setTimeout(() => window.close(), 2000);
      return;
    }
    
    // Récupérer les données de l'utilisateur
    const userData = await apiRequest('/api/user/profile');
    currentUserData = userData;
    
    console.log('👤 Données utilisateur:', userData);
    
    // Afficher l'interface selon le statut
    displaySubscriptionPlans(userData);
    
  } catch (error) {
    console.error('❌ Erreur chargement abonnement:', error);
    contentDiv.innerHTML = '<div class="error-message">Failed to load subscription data</div>';
  }
}

// Afficher les plans d'abonnement
function displaySubscriptionPlans(userData) {
  const contentDiv = document.getElementById('subscriptionContent');
  
  // Déterminer le statut actuel
  const isPremium = userData.isPremium || userData.subscriptionStatus === 'premium';
  const subscriptionPlan = (userData.subscriptionPlan || userData.billingCycle || '').toLowerCase().trim();
  const isMonthly = subscriptionPlan === 'monthly' || subscriptionPlan === 'month' || subscriptionPlan === 'mensuel';
  const isAnnual = subscriptionPlan === 'yearly' || subscriptionPlan === 'annual' || subscriptionPlan === 'year' || subscriptionPlan === 'annuel';
  
  console.log('📊 Statut:', { isPremium, subscriptionPlan, isMonthly, isAnnual });
  
  // HTML pour les plans
  contentDiv.innerHTML = `
    <div class="plans-container">
      <!-- Plan Mensuel -->
      <div class="plan-card ${isMonthly ? 'current disabled' : ''} ${isAnnual ? 'disabled' : ''}" id="monthlyPlan">
        ${isMonthly ? '<div class="current-badge">Current Plan</div>' : ''}
        <div class="plan-name">Monthly</div>
        <div class="plan-price">
          €4.99<small>/month</small>
        </div>
        <ul class="plan-features">
          <li>Unlimited flashcards</li>
          <li>DeepSeek AI translations</li>
          <li>Priority support</li>
          <li>Cancel anytime</li>
        </ul>
        <button class="plan-button ${isMonthly || isAnnual ? 'disabled' : 'primary'}" 
                id="selectMonthly"
                ${isMonthly || isAnnual ? 'disabled' : ''}>
          ${isMonthly ? 'Your Current Plan' : isAnnual ? 'Not Available' : 'Select Monthly'}
        </button>
      </div>
      
      <!-- Plan Annuel -->
      <div class="plan-card ${isAnnual ? 'current disabled' : ''}" id="annualPlan">
        ${isAnnual ? '<div class="current-badge">Current Plan</div>' : ''}
        <div class="plan-name">Annual</div>
        <div class="plan-price">
          €49.90<small>/year</small>
        </div>
        <div class="plan-save">Save €9.98 (17% off)</div>
        <ul class="plan-features">
          <li>Everything in Monthly</li>
          <li>2 months free</li>
          <li>Best value</li>
          <li>Priority features</li>
        </ul>
        <button class="plan-button ${isAnnual ? 'disabled' : 'primary'}" 
                id="selectAnnual"
                ${isAnnual ? 'disabled' : ''}>
          ${isAnnual ? 'Your Current Plan' : isMonthly ? 'Upgrade to Annual' : 'Select Annual'}
        </button>
      </div>
    </div>
    
    ${isPremium ? `
      <div class="cancel-section">
        <a href="#" class="cancel-button" id="cancelSubscription">Cancel Subscription</a>
      </div>
    ` : ''}
  `;
  
  // Event listeners
  setupEventListeners();
}

// Configurer les event listeners
function setupEventListeners() {
  // Bouton mensuel
  const monthlyBtn = document.getElementById('selectMonthly');
  if (monthlyBtn && !monthlyBtn.disabled) {
    monthlyBtn.addEventListener('click', () => selectPlan('monthly'));
  }
  
  // Bouton annuel
  const annualBtn = document.getElementById('selectAnnual');
  if (annualBtn && !annualBtn.disabled) {
    annualBtn.addEventListener('click', () => selectPlan('yearly'));
  }
  
  // Bouton d'annulation
  const cancelBtn = document.getElementById('cancelSubscription');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleCancelSubscription();
    });
  }
}

// Sélectionner un plan
async function selectPlan(planType) {
  try {
    console.log('💳 Sélection du plan:', planType);
    
    // Vérifier d'abord si l'utilisateur a déjà ce plan
    if (currentUserData) {
      const subscriptionPlan = (currentUserData.subscriptionPlan || currentUserData.billingCycle || '').toLowerCase().trim();
      const isMonthly = subscriptionPlan === 'monthly' || subscriptionPlan === 'month' || subscriptionPlan === 'mensuel';
      const isAnnual = subscriptionPlan === 'yearly' || subscriptionPlan === 'annual' || subscriptionPlan === 'year' || subscriptionPlan === 'annuel';
      
      // Si l'utilisateur essaie de sélectionner le plan qu'il a déjà
      if ((planType === 'monthly' && isMonthly) || (planType === 'yearly' && isAnnual)) {
        alert('You already have this plan!');
        return;
      }
      
      // Si l'utilisateur a un plan annuel et essaie de downgrader
      if (isAnnual && planType === 'monthly') {
        alert('You cannot downgrade from annual to monthly plan.');
        return;
      }
    }
    
    // Créer une session de paiement
    const response = await apiRequest('/api/subscription/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ priceType: planType })
    });
    
    if (response.checkoutUrl) {
      // Sauvegarder l'état avant de rediriger
      chrome.storage.local.set({ pendingCheckout: true }, () => {
        // Ouvrir Stripe Checkout dans un nouvel onglet
        chrome.tabs.create({ url: response.checkoutUrl });
        
        // Fermer cette fenêtre après un délai
        setTimeout(() => {
          window.close();
        }, 1000);
      });
    }
  } catch (error) {
    console.error('❌ Erreur création session:', error);
    alert('Failed to create checkout session. Please try again.');
  }
}

// Gérer l'annulation
async function handleCancelSubscription() {
  if (!confirm('Are you sure you want to cancel your subscription? You will lose access to Premium features at the end of your billing period.')) {
    return;
  }
  
  try {
    const response = await apiRequest('/api/subscription/manage', {
      method: 'POST'
    });
    
    if (response.portalUrl) {
      // Ouvrir le portail Stripe
      chrome.tabs.create({ url: response.portalUrl });
      window.close();
    }
  } catch (error) {
    console.error('❌ Erreur annulation:', error);
    alert('Failed to open subscription management. Please try again.');
  }
}