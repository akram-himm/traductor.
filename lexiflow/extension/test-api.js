// Script de test pour la console de l'extension
// Copie-colle ces fonctions dans la console de la popup

console.log('🧪 Test API LexiFlow - Début des tests...\n');

const API_BASE = 'https://my-backend-api-cng7.onrender.com';

// Test 1: Health Check
async function testHealth() {
    console.log('1️⃣ Test Health Check...');
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        console.log('✅ Health Check:', data);
        return true;
    } catch (error) {
        console.error('❌ Health Check échoué:', error);
        return false;
    }
}

// Test 2: Ping
async function testPing() {
    console.log('\n2️⃣ Test Ping...');
    try {
        const response = await fetch(`${API_BASE}/ping`);
        const data = await response.text();
        console.log('✅ Ping response:', data);
        return true;
    } catch (error) {
        console.error('❌ Ping échoué:', error);
        return false;
    }
}

// Test 3: Register
async function testRegister() {
    console.log('\n3️⃣ Test Inscription...');
    const testUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123'
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Inscription réussie:', data);
            if (data.token) {
                localStorage.setItem('testToken', data.token);
                console.log('🔑 Token sauvegardé dans localStorage');
            }
            return true;
        } else {
            console.error('❌ Inscription échouée:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur inscription:', error);
        return false;
    }
}

// Test 4: Login
async function testLogin() {
    console.log('\n4️⃣ Test Connexion...');
    const credentials = {
        email: 'test@example.com',
        password: 'password123'
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Connexion réussie:', data);
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                console.log('🔑 Token d\'authentification sauvegardé');
            }
            return true;
        } else {
            console.error('❌ Connexion échouée:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        return false;
    }
}

// Test 5: Get Flashcards
async function testFlashcards() {
    console.log('\n5️⃣ Test Récupération Flashcards...');
    const token = localStorage.getItem('authToken') || localStorage.getItem('testToken');
    
    if (!token) {
        console.error('❌ Pas de token d\'authentification. Connectez-vous d\'abord.');
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/flashcards`, {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Flashcards récupérées:', data);
            return true;
        } else {
            console.error('❌ Récupération échouée:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur flashcards:', error);
        return false;
    }
}

// Lancer tous les tests
async function runAllTests() {
    console.log('🚀 Lancement de tous les tests...\n');
    
    const results = {
        health: await testHealth(),
        ping: await testPing(),
        register: await testRegister(),
        flashcards: await testFlashcards()
    };
    
    console.log('\n📊 Résumé des tests:');
    console.log('Health Check:', results.health ? '✅' : '❌');
    console.log('Ping:', results.ping ? '✅' : '❌');
    console.log('Register:', results.register ? '✅' : '❌');
    console.log('Flashcards:', results.flashcards ? '✅' : '❌');
    
    if (Object.values(results).every(r => r)) {
        console.log('\n🎉 Tous les tests sont passés !');
    } else {
        console.log('\n⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
    }
}

// Instructions
console.log('📝 Instructions:');
console.log('- testHealth() : Teste la connexion au serveur');
console.log('- testPing() : Teste l\'endpoint ping');
console.log('- testRegister() : Crée un compte test');
console.log('- testLogin() : Se connecte avec un compte existant');
console.log('- testFlashcards() : Récupère les flashcards');
console.log('- runAllTests() : Lance tous les tests\n');
console.log('Tapez runAllTests() pour lancer tous les tests');