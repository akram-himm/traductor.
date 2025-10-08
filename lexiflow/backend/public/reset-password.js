// Récupérer les paramètres de l'URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const email = urlParams.get('email');

// Vérifier la validité du lien
if (!token || !email) {
    document.getElementById('errorMessage').textContent = 'Lien invalide ou expiré';
    document.getElementById('errorMessage').style.display = 'block';
    document.getElementById('passwordResetForm').style.display = 'none';
}

// Gérer la soumission du formulaire
document.getElementById('passwordResetForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('errorMessage');

    console.log('Formulaire soumis - Nouveau mot de passe longueur:', newPassword.length);

    // Réveiller le serveur si on est sur Render
    if (!window.location.hostname.includes('localhost')) {
        const serverAwake = await wakeUpServer(true);
        if (!serverAwake) {
            errorMsg.textContent = 'Serveur indisponible. Veuillez réessayer dans quelques secondes.';
            errorMsg.style.display = 'block';
            return;
        }
    }

    // Réinitialiser les messages
    errorMsg.style.display = 'none';

    // Validation
    if (newPassword !== confirmPassword) {
        errorMsg.textContent = 'Les mots de passe ne correspondent pas';
        errorMsg.style.display = 'block';
        return;
    }

    if (newPassword.length < 6) {
        errorMsg.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
        errorMsg.style.display = 'block';
        return;
    }

    // Désactiver le bouton
    submitBtn.disabled = true;
    submitBtn.textContent = 'Réinitialisation...';

    try {
        console.log('Envoi de la requête de réinitialisation...');
        console.log('Token:', token);
        console.log('Email:', email);

        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                email: email,
                newPassword: newPassword
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        let data = {};
        try {
            const responseText = await response.text();
            console.log('Response text:', responseText);
            if (responseText) {
                data = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.error('Erreur parsing JSON:', parseError);
            data = { error: 'Réponse invalide du serveur' };
        }

        if (response.ok) {
            // Succès - afficher le message de succès
            document.getElementById('resetForm').style.display = 'none';
            document.getElementById('successContainer').style.display = 'block';
        } else {
            // Erreur
            console.error('Erreur serveur:', data);
            errorMsg.textContent = data.error || data.message || `Erreur ${response.status}: Une erreur est survenue`;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Réinitialiser le mot de passe';
        }
    } catch (error) {
        console.error('Erreur complète:', error);
        errorMsg.textContent = `Erreur: ${error.message || 'Connexion au serveur impossible'}`;
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Réinitialiser le mot de passe';
    }
});

// Gérer le bouton de fermeture
const closeButton = document.getElementById('closeButton');
if (closeButton) {
    closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.close();
    });
}