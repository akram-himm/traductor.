# 📋 Instructions pour Manus - Améliorations Site Web LexiFlow

Salut Manus ! Voici la liste détaillée des améliorations à apporter au site web LexiFlow. J'ai organisé tout par priorité avec des exemples de code pour que ce soit clair.

## 🚨 PRIORITÉ 1 - Corrections urgentes (À faire en premier)

### 1. Corriger les prix Early Bird

**Problème** : Le site affiche 3.99€ mais on veut 2.99€

**Fichier** : `pricing.html`

Remplace :
```html
<p><strong>3.99 € / mois</strong> (au lieu de 4.99 €)</p>
<p><strong>39.99 € / an</strong> (au lieu de 49.99 €)</p>
```

Par :
```html
<p><strong>2.99 € / mois</strong> (au lieu de 4.99 €)</p>
<p><strong>29.99 € / an</strong> (au lieu de 49.99 €)</p>
```

### 2. Ajouter les limites de flashcards dans le tableau

**Fichier** : `pricing.html`

Ajoute cette ligne dans le tableau comparatif après "Flashcards" :
```html
<tr>
    <td>Flashcards</td>
    <td>Oui (50 flashcards max)</td>
    <td><strong>Oui (200 flashcards + Mode Pratique)</strong></td>
</tr>
<tr>
    <td>Nombre de flashcards</td>
    <td>50 maximum</td>
    <td><strong>200 maximum</strong></td>
</tr>
```

### 3. Créer une page "Coming Soon" pour tous les boutons CTA

**Nouveau fichier** : `coming_soon.html`
```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LexiFlow - Bientôt Disponible</title>
    <link rel="stylesheet" href="/static/style.css">
    <style>
        .coming-soon-container {
            text-align: center;
            padding: 60px 20px;
            min-height: 400px;
        }
        .rocket-emoji {
            font-size: 80px;
            margin-bottom: 20px;
        }
        .countdown {
            background: #FFC107;
            color: #0A2C4D;
            padding: 20px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            margin: 30px auto;
            max-width: 500px;
        }
        .email-form {
            max-width: 400px;
            margin: 40px auto;
        }
        .email-form input {
            width: 70%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 5px 0 0 5px;
            border-right: none;
        }
        .email-form button {
            width: 30%;
            padding: 12px;
            font-size: 16px;
            background: #0A2C4D;
            color: white;
            border: none;
            border-radius: 0 5px 5px 0;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <header>
        <h1>LexiFlow</h1>
        <p>Votre Compagnon Linguistique Intelligent</p>
    </header>

    <div class="main-wrapper">
        <aside class="sidebar">
            <a href="/">Accueil</a>
            <a href="/features.html">Fonctionnalités</a>
            <a href="/pricing.html">Tarifs</a>
            <a href="/faq.html">FAQ</a>
            <a href="/contact.html">Contact</a>
            <a href="/about.html">À Propos</a>
        </aside>

        <main class="content-area">
            <div class="coming-soon-container">
                <div class="rocket-emoji">🚀</div>
                <h1>LexiFlow arrive très bientôt !</h1>
                <p>Notre extension révolutionnaire sera disponible dans quelques jours.</p>
                
                <div class="countdown">
                    ⏰ Lancement prévu : 1er Juillet 2025
                </div>
                
                <h2>🎁 Offre Early Bird Exclusive</h2>
                <p>Inscrivez-vous maintenant pour bénéficier du tarif spécial de <strong>2.99€/mois</strong> à vie !</p>
                <p>(Au lieu de 4.99€/mois après le lancement)</p>
                
                <div class="email-form">
                    <h3>Soyez les premiers informés !</h3>
                    <form method="POST" action="/subscribe">
                        <input type="email" name="email" placeholder="votre@email.com" required>
                        <button type="submit">M'inscrire</button>
                    </form>
                </div>
                
                <p style="margin-top: 40px;">
                    <a href="/" style="color: #0A2C4D;">← Retour à l'accueil</a>
                </p>
            </div>
        </main>
    </div>

    <footer>
        <p>&copy; 2025 LexiFlow. Tous droits réservés.</p>
    </footer>
</body>
</html>
```

**Dans `main.py`**, ajoute :
```python
@app.route('/coming_soon.html')
def coming_soon():
    return render_template('coming_soon.html')

@app.route('/subscribe', methods=['POST'])
def subscribe():
    email = request.form.get('email')
    # TODO: Sauvegarder l'email dans une base de données ou fichier CSV
    # Pour l'instant, juste print
    print(f"Nouvelle inscription: {email}")
    return redirect('/coming_soon.html')
```

### 4. Remplacer TOUS les liens `href="#"` par `href="/coming_soon.html"`

Dans tous les fichiers HTML, remplace :
```html
<a href="#" class="cta-button">
```
Par :
```html
<a href="/coming_soon.html" class="cta-button">
```

## 🎨 PRIORITÉ 2 - Améliorations visuelles

### 1. Ajouter un vrai hero banner avec animation

**Fichier** : `index.html`

Remplace la section hero-video par :
```html
<div class="hero-video">
    <div class="demo-animation">
        <div class="browser-mockup">
            <div class="browser-bar">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
            </div>
            <div class="browser-content">
                <p>The <span class="highlight-word">butterfly</span> is beautiful</p>
                <div class="translation-popup">
                    <span class="translation-text">🦋 papillon</span>
                    <button class="mini-flashcard-btn">💾</button>
                </div>
            </div>
        </div>
    </div>
</div>
```

**Dans `style.css`**, ajoute :
```css
.demo-animation {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.browser-mockup {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    width: 90%;
    max-width: 350px;
    overflow: hidden;
}

.browser-bar {
    background: #f0f0f0;
    padding: 10px;
    display: flex;
    gap: 5px;
}

.dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}
.dot.red { background: #ff5f57; }
.dot.yellow { background: #ffbd2e; }
.dot.green { background: #28ca42; }

.browser-content {
    padding: 30px;
    position: relative;
}

.highlight-word {
    background: #FFC107;
    padding: 2px 6px;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
}

.translation-popup {
    position: absolute;
    top: 40px;
    left: 50px;
    background: white;
    border: 2px solid #0A2C4D;
    border-radius: 8px;
    padding: 10px 15px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    animation: popIn 0.3s ease-out;
}

@keyframes popIn {
    from {
        opacity: 0;
        transform: scale(0.8) translateY(-10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.mini-flashcard-btn {
    background: #10B981;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    margin-left: 10px;
    cursor: pointer;
    font-size: 14px;
}
```

### 2. Améliorer les couleurs de la sidebar

**Fichier** : `style.css`

Remplace :
```css
.sidebar {
    background-color: #001F3F;
}
```

Par :
```css
.sidebar {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.sidebar a {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #FFFFFF;
    /* reste du CSS... */
}

/* Ajoute des icônes avant chaque lien */
.sidebar a::before {
    font-size: 18px;
}
.sidebar a[href="/"]::before { content: "🏠"; }
.sidebar a[href="/features.html"]::before { content: "✨"; }
.sidebar a[href="/pricing.html"]::before { content: "💎"; }
.sidebar a[href="/faq.html"]::before { content: "❓"; }
.sidebar a[href="/contact.html"]::before { content: "📧"; }
.sidebar a[href="/about.html"]::before { content: "ℹ️"; }
.sidebar a[href="/privacy_policy.html"]::before { content: "🔒"; }
.sidebar a[href="/terms_of_service.html"]::before { content: "📜"; }
```

### 3. Rendre la FAQ interactive

**Fichier** : `faq.html`

Ajoute avant `</body>` :
```html
<script>
document.addEventListener('DOMContentLoaded', function() {
    // FAQ Accordéon
    const faqItems = document.querySelectorAll('.faq-item h3');
    
    faqItems.forEach(item => {
        // Ajouter le curseur pointer
        item.style.cursor = 'pointer';
        
        // Cacher toutes les réponses au début
        const answer = item.nextElementSibling;
        if (answer && answer.tagName === 'P') {
            answer.style.display = 'none';
            answer.style.paddingLeft = '20px';
            answer.style.marginTop = '10px';
            answer.style.color = '#666';
        }
        
        // Ajouter l'icône + 
        item.innerHTML = '➕ ' + item.innerHTML;
        
        // Click event
        item.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            
            if (answer && answer.tagName === 'P') {
                if (answer.style.display === 'none') {
                    answer.style.display = 'block';
                    this.innerHTML = '➖' + this.innerHTML.substring(1);
                    answer.style.animation = 'slideDown 0.3s ease-out';
                } else {
                    answer.style.display = 'none';
                    this.innerHTML = '➕' + this.innerHTML.substring(1);
                }
            }
        });
    });
});
</script>

<style>
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.faq-item h3:hover {
    color: #0A2C4D;
    background: #f0f0f0;
    padding: 10px;
    border-radius: 5px;
    margin: -10px;
}
</style>
```

## 📧 PRIORITÉ 3 - Collecte d'emails sur la homepage

**Fichier** : `index.html`

Ajoute avant la fermeture de `</main>` :
```html
<section class="section email-capture">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; text-align: center;">
        <h2 style="color: white; margin-bottom: 10px;">🎯 Ne manquez pas l'offre Early Bird !</h2>
        <p style="font-size: 18px; margin-bottom: 20px;">
            Seulement <strong>2.99€/mois</strong> pour les 1000 premiers utilisateurs
        </p>
        <div class="progress-bar" style="background: rgba(255,255,255,0.3); height: 30px; border-radius: 15px; margin-bottom: 20px;">
            <div style="background: #FFC107; width: 35%; height: 100%; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #0A2C4D;">
                350/1000 inscrits
            </div>
        </div>
        <form method="POST" action="/subscribe" style="display: flex; gap: 10px; max-width: 400px; margin: 0 auto;">
            <input type="email" name="email" placeholder="votre@email.com" required 
                   style="flex: 1; padding: 12px; border: none; border-radius: 5px; font-size: 16px;">
            <button type="submit" style="background: #FFC107; color: #0A2C4D; border: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 16px;">
                Je veux l'offre !
            </button>
        </form>
        <p style="font-size: 12px; margin-top: 10px; opacity: 0.9;">
            ✅ Sans engagement • ✅ Annulation à tout moment • ✅ Prix garanti à vie
        </p>
    </div>
</section>
```

## 🔧 PRIORITÉ 4 - SEO et métadonnées

**Dans TOUS les fichiers HTML**, remplace le `<head>` par :
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="LexiFlow - Extension Chrome de traduction instantanée avec IA. Traduisez, apprenez et mémorisez avec des flashcards intelligentes. Essai gratuit disponible.">
    <meta name="keywords" content="traduction, extension chrome, flashcards, apprentissage langues, DeepSeek AI">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://lexiflow.com/">
    <meta property="og:title" content="LexiFlow - Votre Compagnon Linguistique Intelligent">
    <meta property="og:description" content="Traduisez instantanément n'importe quel mot sur le web. Offre Early Bird à 2.99€/mois !">
    <meta property="og:image" content="/static/og-image.png">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://lexiflow.com/">
    <meta property="twitter:title" content="LexiFlow - Traduction Instantanée avec IA">
    <meta property="twitter:description" content="L'extension Chrome qui révolutionne l'apprentissage des langues.">
    
    <title>LexiFlow - [Nom de la page]</title>
    <link rel="stylesheet" href="/static/style.css">
    <link rel="icon" type="image/png" href="/static/favicon.png">
</head>
```

## 📱 PRIORITÉ 5 - Formulaire de contact fonctionnel

**Fichier** : `main.py`

Ajoute :
```python
from flask import request, redirect, flash
import csv
from datetime import datetime

@app.route('/contact', methods=['POST'])
def submit_contact():
    name = request.form.get('name')
    email = request.form.get('email')
    subject = request.form.get('subject')
    message = request.form.get('message')
    
    # Sauvegarder dans un fichier CSV
    with open('contacts.csv', 'a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow([datetime.now(), name, email, subject, message])
    
    # TODO: Envoyer un email de notification
    print(f"Nouveau message de {name} ({email}): {subject}")
    
    return redirect('/contact.html?success=true')
```

**Fichier** : `contact.html`

Modifie le formulaire :
```html
<form method="POST" action="/contact">
    <!-- Ajoute en haut du formulaire -->
    <div id="success-message" style="display: none; background: #10B981; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        ✅ Message envoyé avec succès ! Nous vous répondrons dans les 24h.
    </div>
    
    <!-- reste du formulaire... -->
</form>

<script>
// Afficher le message de succès si présent dans l'URL
if (window.location.search.includes('success=true')) {
    document.getElementById('success-message').style.display = 'block';
}
</script>
```

## 🎯 Checklist finale pour Manus

- [ ] Corriger tous les prix (2.99€ au lieu de 3.99€)
- [ ] Ajouter les limites de flashcards dans le tableau
- [ ] Créer la page coming_soon.html
- [ ] Remplacer tous les href="#" par href="/coming_soon.html"
- [ ] Ajouter la demo animation dans le hero
- [ ] Améliorer les couleurs de la sidebar
- [ ] Rendre la FAQ interactive avec JavaScript
- [ ] Ajouter la section collecte email sur homepage
- [ ] Ajouter les métadonnées SEO dans tous les fichiers
- [ ] Rendre le formulaire de contact fonctionnel
- [ ] Créer un favicon.png (16x16 et 32x32)
- [ ] Créer une image og-image.png (1200x630px)

## 💡 Bonus si tu as le temps

1. **Ajouter un badge "Chrome Web Store"** :
```html
<img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/UV4C4ybeBTsZt43U4xis.png" 
     alt="Disponible sur Chrome Web Store" 
     style="height: 60px;">
```

2. **Ajouter un compteur animé** sur la page pricing :
```javascript
<script>
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        obj.textContent = Math.floor(current);
    }, 16);
}

// Animer "350/1000 inscrits"
animateValue("counter", 0, 350, 2000);
</script>
```

3. **Ajouter des témoignages avec avatars** :
```html
<div class="testimonial">
    <img src="https://i.pravatar.cc/150?img=1" alt="Marie D." style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 10px;">
    <p>"LexiFlow a changé ma façon de lire des articles en anglais!"</p>
    <p><strong>Marie D.</strong><br><span style="color: #666;">Étudiante</span></p>
</div>
```

Bon courage Manus ! N'hésite pas si tu as des questions 💪