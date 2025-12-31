#!/bin/bash

# IT Enterprise - GitHub Push Script
# Použití: ./push-to-github.sh [github_username] [repository_name] [access_token] [branch]

echo "=== IT Enterprise GitHub Push Script ==="

# Parametry
GITHUB_USERNAME=$1
REPOSITORY_NAME=$2
ACCESS_TOKEN=$3
BRANCH=${4:-main}

if [ -z "$GITHUB_USERNAME" ] || [ -z "$REPOSITORY_NAME" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo "Použití: $0 <github_username> <repository_name> <access_token> [branch]"
    echo "Příklad: $0 myusername it-enterprise-platform ghp_xxxxxxxxxxxx main"
    exit 1
fi

cd /opt/IT-Enterprise

# Kontrola Git repozitáře
if [ ! -d ".git" ]; then
    echo "Inicializuji Git repozitář..."
    git init
    git config user.name "$GITHUB_USERNAME"
    git config user.email "$GITHUB_USERNAME@users.noreply.github.com"
fi

# Přidání remote origin
git remote remove origin 2>/dev/null
git remote add origin https://$ACCESS_TOKEN@github.com/$GITHUB_USERNAME/$REPOSITORY_NAME.git

# Přidání všech souborů
echo "Přidávám soubory..."
git add .

# Vytvoření commitu
echo "Vytvářím commit..."
COMMIT_MESSAGE="IT Enterprise Platform Update - $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MESSAGE"

# Push do GitHub
echo "Pushuji do GitHub..."
git branch -M $BRANCH
git push -u origin $BRANCH

echo "=== Projekt nahrán na GitHub ==="
echo "URL: https://github.com/$GITHUB_USERNAME/$REPOSITORY_NAME"
echo "Branch: $BRANCH"
echo "Commit: $COMMIT_MESSAGE"

# Zobrazení statusu
echo ""
echo "Git status:"
git status

echo ""
echo "Remote origin:"
git remote -v

echo ""
echo "Poslední commity:"
git log --oneline -5
