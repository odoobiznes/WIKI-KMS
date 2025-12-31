#!/bin/bash

# GitHub Deployment Script pro IT Enterprise
# Použití: ./github-deploy.sh [github_username] [repository_name] [access_token]

echo "=== IT Enterprise GitHub Deployment ==="

# Parametry
GITHUB_USERNAME=$1
REPOSITORY_NAME=$2
ACCESS_TOKEN=$3

if [ -z "$GITHUB_USERNAME" ] || [ -z "$REPOSITORY_NAME" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo "Použití: $0 <github_username> <repository_name> <access_token>"
    echo "Příklad: $0 myusername it-enterprise-platform ghp_xxxxxxxxxxxx"
    exit 1
fi

cd /opt/IT-Enterprise

# Kontrola Git repozitáře
if [ ! -d ".git" ]; then
    git init
    git config user.name "$GITHUB_USERNAME"
    git config user.email "$GITHUB_USERNAME@users.noreply.github.com"
fi

# Přidání remote origin
git remote remove origin 2>/dev/null
git remote add origin https://$ACCESS_TOKEN@github.com/$GITHUB_USERNAME/$REPOSITORY_NAME.git

# Vytvoření prvního commitu
git add .
git commit -m "Initial commit - IT Enterprise Platform Setup"

# Push do GitHub
git branch -M main
git push -u origin main

echo "=== Projekt nahrán na GitHub ==="
echo "URL: https://github.com/$GITHUB_USERNAME/$REPOSITORY_NAME"
