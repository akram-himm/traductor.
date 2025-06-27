// auth.js - Gestion de l'authentification pour LexiFlow

// Variables globales
let isAuthenticated = false;
let currentUser = null;
let isPremium = false;

// Vérifier l'authentification au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Gérer le bouton compte dans le header
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn) {
        accountBtn.addEventListener('click', function() {
            // Masquer tous les onglets
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            
            // Afficher l'onglet compte
            const accountTab = document.getElementById('account');
            if (accountTab) {
                accountTab.style.display = 'block';
            }
            
            // Retirer la classe active de tous les onglets
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
        });
    }

    // Gérer le formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // TODO: Appeler votre API de connexion
            console.log('Tentative de connexion:', email);
            
            // Simuler une connexion réussie pour le test
            // À remplacer par votre vraie logique
            handleLoginSuccess({
                email: email,
                isPremium: false
            });
        });
    }

    // Gérer le bouton de déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            handleLogout();
        });
    }

    // Gérer les liens mot de passe oublié et inscription
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Ouvrir la page de récupération de mot de passe
            chrome.tabs.create({ url: 'https://lexiflow.com/forgot-password' });
        });
    }

    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Ouvrir la page d'inscription
            chrome.tabs.create({ url: 'https://lexiflow.com/register' });
        });
    }

    // Gérer le bouton upgrade Premium
    const upgradeToPremium = document.getElementById('upgradeToPremium');
    if (upgradeToPremium) {
        upgradeToPremium.addEventListener('click', function() {
            // Ouvrir la page de paiement
            chrome.tabs.create({ url: 'https://lexiflow.com/pricing' });
        });
    }

    // Gérer le bouton de connexion pour DeepSeek
    const connectForDeepSeek = document.getElementById('connectForDeepSeek');
    if (connectForDeepSeek) {
        connectForDeepSeek.addEventListener('click', function() {
            // Afficher le formulaire de connexion
            document.getElementById('account').style.display = 'block';
            document.querySelectorAll('.tab-content').forEach(tab => {
                if (tab.id !== 'account') tab.style.display = 'none';
            });
        });
    }

    // Vérifier l'état de connexion au démarrage
    checkAuthStatus();
});

// Vérifier l'état de connexion
async function checkAuthStatus() {
    // Récupérer le token depuis le storage
    chrome.storage.local.get(['authToken', 'user'], function(result) {
        if (result.authToken && result.user) {
            isAuthenticated = true;
            currentUser = result.user;
            isPremium = result.user.isPremium || false;
            updateUIForAuthenticatedUser();
        } else {
            updateUIForUnauthenticatedUser();
        }
    });
}

// Gérer la connexion réussie
function handleLoginSuccess(user) {
    isAuthenticated = true;
    currentUser = user;
    isPremium = user.isPremium || false;

    // Sauvegarder dans le storage
    chrome.storage.local.set({
        authToken: 'fake-token', // À remplacer par le vrai token
        user: user
    });

    updateUIForAuthenticatedUser();
    
    // Retourner au tableau de bord
    document.getElementById('account').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.querySelector('.nav-tab[data-tab="dashboard"]').classList.add('active');
}

// Gérer la déconnexion
function handleLogout() {
    isAuthenticated = false;
    currentUser = null;
    isPremium = false;

    // Effacer le storage
    chrome.storage.local.remove(['authToken', 'user']);

    updateUIForUnauthenticatedUser();
    
    // Retourner au tableau de bord
    document.getElementById('account').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.querySelector('.nav-tab[data-tab="dashboard"]').classList.add('active');
}

// Mettre à jour l'UI pour un utilisateur connecté
function updateUIForAuthenticatedUser() {
    // Mettre à jour le bouton compte
    const accountText = document.getElementById('accountText');
    if (accountText && currentUser) {
        accountText.textContent = currentUser.email;
    }

    // Afficher/masquer les sections appropriées
    const loginSection = document.getElementById('loginSection');
    const profileSection = document.getElementById('profileSection');
    
    if (loginSection) loginSection.style.display = 'none';
    if (profileSection) profileSection.style.display = 'block';

    // Mettre à jour les infos du profil
    const userEmail = document.getElementById('userEmail');
    const userPlan = document.getElementById('userPlan');
    const upgradeToPremium = document.getElementById('upgradeToPremium');
    const premiumFeatures = document.getElementById('premiumFeatures');

    if (userEmail && currentUser) {
        userEmail.textContent = currentUser.email;
    }

    if (userPlan) {
        if (isPremium) {
            userPlan.textContent = 'Premium';
            userPlan.className = 'user-plan premium';
        } else {
            userPlan.textContent = 'Gratuit';
            userPlan.className = 'user-plan';
        }
    }

    if (upgradeToPremium) {
        upgradeToPremium.style.display = isPremium ? 'none' : 'block';
    }

    if (premiumFeatures) {
        premiumFeatures.style.display = isPremium ? 'none' : 'block';
    }

    // Gérer DeepSeek selon le statut Premium
    updateDeepSeekAccess();
}

// Mettre à jour l'UI pour un utilisateur non connecté
function updateUIForUnauthenticatedUser() {
    // Mettre à jour le bouton compte
    const accountText = document.getElementById('accountText');
    if (accountText) {
        accountText.textContent = 'Se connecter';
    }

    // Afficher/masquer les sections appropriées
    const loginSection = document.getElementById('loginSection');
    const profileSection = document.getElementById('profileSection');
    
    if (loginSection) loginSection.style.display = 'block';
    if (profileSection) profileSection.style.display = 'none';

    // Bloquer DeepSeek
    updateDeepSeekAccess();
}

// Mettre à jour l'accès à DeepSeek
function updateDeepSeekAccess() {
    const deepSeekToggle = document.getElementById('deepSeekToggle');
    const deepSeekTooltip = document.getElementById('deepSeekTooltip');
    const deepSeekOverlay = document.querySelector('.deepseek-overlay');
    const deepSeekConfig = document.getElementById('deepSeekConfig');

    if (!deepSeekToggle) return;

    if (isAuthenticated && isPremium) {
        // Utilisateur Premium : activer DeepSeek
        deepSeekToggle.style.pointerEvents = 'auto';
        deepSeekToggle.style.opacity = '1';
        deepSeekToggle.classList.remove('disabled');
        
        // Masquer l'overlay et le cadenas
        if (deepSeekOverlay) deepSeekOverlay.style.display = 'none';
        const lockIcon = deepSeekToggle.querySelector('.lock-icon');
        if (lockIcon) lockIcon.style.display = 'none';
        
        // Masquer le message de connexion
        if (deepSeekConfig) deepSeekConfig.style.display = 'none';
    } else {
        // Utilisateur non-Premium : bloquer et DÉSACTIVER DeepSeek
        deepSeekToggle.style.pointerEvents = 'none';
        deepSeekToggle.style.opacity = '0.6';
        
        // IMPORTANT: Forcer la désactivation de DeepSeek
        deepSeekToggle.classList.remove('active');
        
        // Mettre à jour le storage pour désactiver DeepSeek
        chrome.storage.sync.get('userSettings', (data) => {
            const settings = data.userSettings || {};
            if (settings.deepSeekEnabled) {
                settings.deepSeekEnabled = false;
                chrome.storage.sync.set({ userSettings: settings });
            }
        });
        
        // Afficher l'overlay et le cadenas
        if (deepSeekOverlay) deepSeekOverlay.style.display = 'block';
        const lockIcon = deepSeekToggle.querySelector('.lock-icon');
        if (lockIcon) lockIcon.style.display = 'block';
        
        // Mettre à jour le message du tooltip
        if (deepSeekTooltip) {
            if (!isAuthenticated) {
                deepSeekTooltip.textContent = 'Connectez-vous pour activer DeepSeek';
            } else {
                deepSeekTooltip.textContent = 'Abonnez-vous pour activer DeepSeek';
            }
        }

        // Afficher le message approprié dans les paramètres
        if (deepSeekConfig) {
            deepSeekConfig.style.display = 'none';
        }
    }
}

// Exporter les fonctions pour popup.js
window.authFunctions = {
    isAuthenticated: () => isAuthenticated,
    isPremium: () => isPremium,
    getCurrentUser: () => currentUser,
    checkAuthStatus,
    updateDeepSeekAccess
};