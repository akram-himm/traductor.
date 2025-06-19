@echo off
echo ========================================
echo    DEMARRAGE DE LEXIFLOW
echo ========================================
echo.

:: Définir les couleurs
color 0A

:: Vérifier qu'on est dans le bon dossier
if not exist "backend\package.json" (
    echo [ERREUR] Ce fichier doit etre lance depuis le dossier racine de LexiFlow !
    echo Assurez-vous d'etre dans : C:\Users\akram\Dev\Git_projets\traductor\lexiflow
    pause
    exit /b 1
)

echo [1/4] Demarrage du Backend sur le port 3001...
echo ----------------------------------------
cd backend
start "LexiFlow Backend" cmd /k "npm start"
cd ..

:: Attendre 3 secondes que le backend démarre
echo.
echo [2/4] Attente du demarrage du backend...
timeout /t 3 /nobreak > nul

echo.
echo [3/4] Demarrage du Site Web sur le port 8000...
echo ----------------------------------------
cd website
start "LexiFlow Website" cmd /k "python -m http.server 8000"
cd ..

:: Attendre 2 secondes que le site web démarre
timeout /t 2 /nobreak > nul

echo.
echo [4/4] Ouverture de Chrome...
echo ----------------------------------------
start chrome "http://localhost:8000/coming-soon.html"

echo.
echo ========================================
echo    LEXIFLOW EST PRET !
echo ========================================
echo.
echo Backend   : http://localhost:3001/api/health
echo Site Web  : http://localhost:8000/coming-soon.html
echo Stats API : http://localhost:3001/api/waitlist/stats
echo.
echo Pour arreter LexiFlow :
echo - Fermez les 2 fenetres de terminal
echo - Ou faites Ctrl+C dans chaque terminal
echo.
echo ========================================
echo.
pause