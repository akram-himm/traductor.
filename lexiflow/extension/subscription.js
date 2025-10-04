// Gestion de la page d'abonnement
let currentUserData = null;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📋 Chargement de la page d\'abonnement');
  console.log('📍 Page subscription.html chargée à:', new Date().toISOString());
  await loadSubscriptionData();
  
  // Rafraîchir les données quand la fenêtre reprend le focus (après retour de Stripe)
  let lastFocusTime = Date.now();
  window.addEventListener('focus', async () => {
    const now = Date.now();
    // Si la fenêtre a perdu le focus pendant plus de 5 secondes, rafraîchir
    if (now - lastFocusTime > 5000) {
      console.log('🔄 Rafraîchissement après retour de Stripe...');
      await loadSubscriptionData();
    }
    lastFocusTime = now;
  });
  
  window.addEventListener('blur', () => {
    lastFocusTime = Date.now();
  });
});

// Charger les données d'abonnement
async function loadSubscriptionData() {
  const contentDiv = document.getElementById('subscriptionContent');
  
  try {
    // Vérifier l'authentification
    const token = await authAPI.getToken();
    console.log('🔑 Token trouvé:', !!token);
    if (!token) {
      contentDiv.innerHTML = '<div class="error-message">Authentication required</div>';
      setTimeout(() => window.close(), 2000);
      return;
    }
    
    // Récupérer les données de l'utilisateur
    console.log('📡 Appel API /api/user/profile...');
    const response = await apiRequest('/api/user/profile');
    console.log('📥 Réponse brute:', response);
    const userData = response.user || response; // Gérer les deux cas
    currentUserData = userData;
    
    console.log('👤 Données utilisateur extraites:', userData);
    console.log('💳 Plan détecté:', userData.subscriptionPlan || userData.billingCycle || 'AUCUN');
    
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
  
  // Debug complet des données
  console.log('🔍 Debug userData complet:', {
    isPremium: userData.isPremium,
    subscriptionStatus: userData.subscriptionStatus,
    subscriptionPlan: userData.subscriptionPlan,
    billingCycle: userData.billingCycle,
    subscription: userData.subscription
  });
  
  // Normalisation complète du plan - Priorité à subscriptionPlan
  const planFromDB = userData.subscriptionPlan ? userData.subscriptionPlan.toLowerCase().trim() : '';
  const cycle = planFromDB || 
                (userData.subscription?.interval || 
                userData.billingCycle || 
                userData.subscription?.plan ||
                '').toString().toLowerCase().trim();
                
  console.log('🔍 Plan detection:', { 
    subscriptionPlan: userData.subscriptionPlan,
    planFromDB: planFromDB,
    cycle: cycle 
  });
                
  // Liste étendue de variantes possibles
  const monthlyVariants = ['month', 'monthly', 'mensuel', 'mensuelle', 'month-to-month', 'mois'];
  const annualVariants = ['year', 'yearly', 'annual', 'annuel', 'annuelle', 'année', 'an'];
  
  // Détection directe si on a subscriptionPlan
  const isMonthly = planFromDB === 'monthly' || (!planFromDB && monthlyVariants.some(variant => cycle.includes(variant)));
  const isAnnual = planFromDB === 'yearly' || (!planFromDB && annualVariants.some(variant => cycle.includes(variant)));
  
  console.log('📊 Statut final:', { isPremium, cycle, isMonthly, isAnnual });
  
  // Sauvegarder les logs pour debug
  const debugInfo = {
    userData: {
      isPremium: userData.isPremium,
      subscriptionStatus: userData.subscriptionStatus,
      subscriptionPlan: userData.subscriptionPlan,
      billingCycle: userData.billingCycle,
      subscription: userData.subscription
    },
    detection: {
      cycle,
      isMonthly,
      isAnnual
    },
    timestamp: new Date().toISOString()
  };
  
  // Sauvegarder dans chrome.storage pour récupérer plus tard
  chrome.storage.local.set({ subscriptionDebugInfo: debugInfo }, () => {
    console.log('💾 Debug info sauvegardé dans chrome.storage');
  });
  
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
      <div class="plan-card ${isAnnual ? 'current disabled' : ''} ${isMonthly ? 'recommended' : ''}" id="annualPlan">
        ${isAnnual ? '<div class="current-badge">Current Plan</div>' : ''}
        ${isMonthly ? '<div class="recommended-badge">Save 17%!</div>' : ''}
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
  console.log('🔍 Bouton mensuel:', {
    existe: !!monthlyBtn,
    hasDisabled: monthlyBtn?.hasAttribute('disabled'),
    disabled: monthlyBtn?.disabled,
    className: monthlyBtn?.className,
    outerHTML: monthlyBtn?.outerHTML?.substring(0, 100)
  });
  
  if (monthlyBtn && !monthlyBtn.hasAttribute('disabled')) {
    console.log('✅ Ajout event listener sur bouton mensuel');
    monthlyBtn.addEventListener('click', () => selectPlan('monthly'));
  } else {
    console.log('🚫 Bouton mensuel désactivé, pas d\'event listener');
  }
  
  // Bouton annuel
  const annualBtn = document.getElementById('selectAnnual');
  if (annualBtn && !annualBtn.hasAttribute('disabled')) {
    console.log('✅ Ajout event listener sur bouton annuel');
    annualBtn.addEventListener('click', () => selectPlan('yearly'));
  } else {
    console.log('🚫 Bouton annuel désactivé, pas d\'event listener');
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
      // Utiliser la même logique que displaySubscriptionPlans
      const planFromDB = currentUserData.subscriptionPlan ? currentUserData.subscriptionPlan.toLowerCase().trim() : '';
      const cycle = planFromDB || 
                    (currentUserData.subscription?.interval || 
                    currentUserData.billingCycle || 
                    currentUserData.subscription?.plan ||
                    '').toString().toLowerCase().trim();
                    
      console.log('🔍 Plan check in selectPlan:', { 
        subscriptionPlan: currentUserData.subscriptionPlan,
        planFromDB: planFromDB,
        cycle: cycle,
        planType: planType
      });
                    
      const monthlyVariants = ['month', 'monthly', 'mensuel', 'mensuelle', 'month-to-month', 'mois'];
      const annualVariants = ['year', 'yearly', 'annual', 'annuel', 'annuelle', 'année', 'an'];
      
      // Détection directe si on a subscriptionPlan
      const isMonthly = planFromDB === 'monthly' || (!planFromDB && monthlyVariants.some(variant => cycle.includes(variant)));
      const isAnnual = planFromDB === 'yearly' || (!planFromDB && annualVariants.some(variant => cycle.includes(variant)));
      
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
      chrome.storage.local.set({ 
        pendingCheckout: true,
        checkoutSessionId: response.sessionId 
      }, () => {
        // Ouvrir Stripe Checkout dans un nouvel onglet
        chrome.tabs.create({ url: response.checkoutUrl });
        
        // Fermer la fenêtre subscription après un délai
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
    console.log('🚫 Tentative d\'annulation...');
    const response = await apiRequest('/api/subscription/cancel', {
      method: 'POST'
    });
    
    console.log('📊 Réponse annulation:', response);
    
    if (response.success) {
      alert(response.message || 'Subscription canceled successfully');
      // Rafraîchir la page pour montrer le statut mis à jour
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (response.error) {
      alert('Error: ' + response.error);
    }
  } catch (error) {
    console.error('❌ Erreur annulation:', error);
    // Afficher plus de détails sur l'erreur
    let errorMessage = 'Failed to cancel subscription. ';
    if (error.message) {
      errorMessage += error.message;
    }
    if (error.status === 404) {
      errorMessage = 'No active subscription found to cancel.';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    alert(errorMessage);
  }
}