#!/bin/bash

# Script de test automatisé pour l'authentification LexiFlow
# Usage: ./test-auth.sh

API_URL="https://my-backend-api-cng7.onrender.com"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Test de l'API LexiFlow${NC}\n"

# Générer un email unique pour les tests
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@lexiflow.com"
TEST_PASSWORD="password123"

echo -e "${YELLOW}1. Test d'inscription${NC}"
REGISTER_RESPONSE=$(curl -s -X POST ${API_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"username\": \"TestUser${TIMESTAMP}\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ Inscription réussie${NC}"
  echo "$REGISTER_RESPONSE" | python3 -m json.tool
else
  echo -e "${RED}✗ Échec de l'inscription${NC}"
  echo "$REGISTER_RESPONSE"
fi

echo -e "\n${YELLOW}2. Test de connexion${NC}"
LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ Connexion réussie${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "Token obtenu: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ Échec de la connexion${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo -e "\n${YELLOW}3. Test de vérification du token${NC}"
VERIFY_RESPONSE=$(curl -s -X GET ${API_URL}/api/auth/verify \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$VERIFY_RESPONSE" | grep -q '"valid":true'; then
  echo -e "${GREEN}✓ Token valide${NC}"
  echo "$VERIFY_RESPONSE" | python3 -m json.tool
else
  echo -e "${RED}✗ Token invalide${NC}"
  echo "$VERIFY_RESPONSE"
fi

echo -e "\n${YELLOW}4. Test du profil utilisateur${NC}"
PROFILE_RESPONSE=$(curl -s -X GET ${API_URL}/api/user/profile \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$PROFILE_RESPONSE" | grep -q "email"; then
  echo -e "${GREEN}✓ Profil récupéré${NC}"
  echo "$PROFILE_RESPONSE" | python3 -m json.tool
else
  echo -e "${RED}✗ Échec de récupération du profil${NC}"
  echo "$PROFILE_RESPONSE"
fi

echo -e "\n${YELLOW}5. Test de création de flashcard${NC}"
FLASHCARD_RESPONSE=$(curl -s -X POST ${API_URL}/api/flashcards \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "originalText": "Hello World",
    "translatedText": "Bonjour le Monde",
    "sourceLanguage": "en",
    "targetLanguage": "fr"
  }')

if echo "$FLASHCARD_RESPONSE" | grep -q "originalText"; then
  echo -e "${GREEN}✓ Flashcard créée${NC}"
  echo "$FLASHCARD_RESPONSE" | python3 -m json.tool
else
  echo -e "${RED}✗ Échec de création de flashcard${NC}"
  echo "$FLASHCARD_RESPONSE"
fi

echo -e "\n${YELLOW}6. Test de récupération des flashcards${NC}"
FLASHCARDS_RESPONSE=$(curl -s -X GET ${API_URL}/api/flashcards \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$FLASHCARDS_RESPONSE" | grep -q "flashcards"; then
  echo -e "${GREEN}✓ Flashcards récupérées${NC}"
  COUNT=$(echo "$FLASHCARDS_RESPONSE" | grep -o '"id"' | wc -l)
  echo "Nombre de flashcards: $COUNT"
else
  echo -e "${RED}✗ Échec de récupération des flashcards${NC}"
  echo "$FLASHCARDS_RESPONSE"
fi

echo -e "\n${GREEN}🎉 Tests terminés !${NC}"
echo -e "Email de test: ${TEST_EMAIL}"
echo -e "Token: ${TOKEN:0:20}..."