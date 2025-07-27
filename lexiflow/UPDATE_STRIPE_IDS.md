# Comment mettre à jour vos Price IDs Stripe

## 1. Créer vos produits dans Stripe

1. Allez sur https://dashboard.stripe.com/test/products
2. Cliquez sur "+ Add product"
3. Remplissez :
   - Product name: "LexiFlow Premium"
   - Description: "Accès Premium à LexiFlow - Traduction illimitée avec IA"
4. Cliquez "Add product"

## 2. Ajouter les prix

1. Dans le produit créé, cliquez "+ Add price"
2. Prix mensuel :
   - Price: 4.99
   - Currency: EUR
   - Billing period: Monthly
3. Prix annuel :
   - Price: 49.90
   - Currency: EUR  
   - Billing period: Yearly

## 3. Copier vos Price IDs

Chaque prix aura un ID unique comme : `price_1AbCdEfGhIjKlMnOp`

## 4. Mettre à jour dans le code

Dans `extension/subscription-api.js` :
```javascript
prices: {
  monthly: {
    id: 'price_VOTRE_ID_MENSUEL', // Remplacez ici
    amount: 499,
    currency: 'eur',
    interval: 'month'
  },
  yearly: {
    id: 'price_VOTRE_ID_ANNUEL', // Remplacez ici
    amount: 4990,
    currency: 'eur',
    interval: 'year'
  }
}
```

## 5. Mettre à jour sur Render

Variables d'environnement :
- STRIPE_MONTHLY_PRICE_ID = votre_price_id_mensuel
- STRIPE_YEARLY_PRICE_ID = votre_price_id_annuel

## Important !

N'utilisez PAS les price IDs d'un autre compte Stripe. Chaque compte a ses propres IDs uniques.