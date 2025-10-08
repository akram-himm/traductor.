// Script de diagnostic complet pour les webhooks Stripe
require('dotenv').config();

console.log('🔍 DIAGNOSTIC WEBHOOKS STRIPE');
console.log('==============================\n');

// 1. Vérifier la configuration
console.log('📋 Configuration actuelle:');
console.log('─────────────────────────');
console.log(`STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Configuré' : '❌ Manquant'}`);
if (process.env.STRIPE_WEBHOOK_SECRET) {
  console.log(`   Format: ${process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_') ? '✅ Correct' : '❌ Incorrect'}`);
  console.log(`   Longueur: ${process.env.STRIPE_WEBHOOK_SECRET.length} caractères`);
}
console.log(`STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Configuré' : '❌ Manquant'}`);

console.log('\n📊 Actions de diagnostic:');
console.log('─────────────────────────\n');

console.log('1️⃣ VÉRIFIEZ SUR STRIPE:');
console.log('   → dashboard.stripe.com/test/webhooks');
console.log('   → Cliquez sur votre webhook');
console.log('   → Regardez l\'onglet "Tentatives de webhook"');
console.log('   → Y a-t-il des erreurs (rouge) ?');

console.log('\n2️⃣ VÉRIFIEZ LE SIGNING SECRET:');
console.log('   → Sur Stripe, dans votre webhook');
console.log('   → "Signing secret" → Reveal');
console.log('   → Copiez EXACTEMENT la clé');
console.log('   → Sur Render: Environment → STRIPE_WEBHOOK_SECRET');
console.log('   → Les deux doivent être IDENTIQUES');

console.log('\n3️⃣ TEST MANUEL:');
console.log('   → Sur Stripe, dans votre webhook');
console.log('   → Onglet "Test"');
console.log('   → Event type: checkout.session.completed');
console.log('   → "Send test webhook"');

console.log('\n4️⃣ VÉRIFIEZ LES LOGS RENDER:');
console.log('   → dashboard.render.com');
console.log('   → my-backend-api-cng7 → Logs');
console.log('   → Cherchez: "webhook", "stripe", "subscription"');

console.log('\n❌ ERREURS COMMUNES:');
console.log('─────────────────────');

console.log('\n🔴 "Webhook signature verification failed"');
console.log('   → Le STRIPE_WEBHOOK_SECRET est incorrect');
console.log('   Solution: Copiez le bon secret depuis Stripe');

console.log('\n🔴 "No webhook endpoint configured"');
console.log('   → Webhook pas créé sur Stripe');
console.log('   Solution: Créez le webhook sur dashboard.stripe.com');

console.log('\n🔴 "404 Not Found"');
console.log('   → URL incorrecte dans Stripe');
console.log('   Solution: Vérifiez que l\'URL est exactement:');
console.log('   https://my-backend-api-cng7.onrender.com/api/subscription/webhook');

console.log('\n🔴 "User not found"');
console.log('   → L\'email Stripe ne correspond pas à un user en DB');
console.log('   Solution: Utilisez le même email pour Stripe et votre compte');

console.log('\n💡 SOLUTION RAPIDE:');
console.log('════════════════════');
console.log('Si rien ne fonctionne, essayez ceci:');
console.log('\n1. SUPPRIMEZ le webhook sur Stripe');
console.log('2. CRÉEZ un NOUVEAU webhook');
console.log('3. URL: https://my-backend-api-cng7.onrender.com/api/subscription/webhook');
console.log('4. Events: checkout.session.completed (au minimum)');
console.log('5. COPIEZ le nouveau signing secret');
console.log('6. METTEZ À JOUR sur Render');
console.log('7. TESTEZ avec "Send test webhook"');

console.log('\n📝 VÉRIFICATION FINALE:');
console.log('═══════════════════════');
console.log('Après avoir tout vérifié, refaites un paiement test:');
console.log('1. Carte: 4242 4242 4242 4242');
console.log('2. Attendez 30 secondes');
console.log('3. Vérifiez votre statut premium');
console.log('\nSi ça ne fonctionne toujours pas, regardez les logs Render!');