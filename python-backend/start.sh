#!/bin/bash

echo "========================================"
echo "  EcomFarm Auto-Assignment Backend"
echo "========================================"
echo ""

# Vérifier si l'environnement virtuel existe
if [ ! -d "venv" ]; then
    echo "[1/4] Création de l'environnement virtuel..."
    python3 -m venv venv
    echo "✓ Environnement virtuel créé"
    echo ""
else
    echo "[1/4] Environnement virtuel déjà présent"
    echo ""
fi

# Activer l'environnement virtuel
echo "[2/4] Activation de l'environnement..."
source venv/bin/activate
echo "✓ Environnement activé"
echo ""

# Installer/Mettre à jour les dépendances
echo "[3/4] Installation des dépendances..."
pip install -r requirements.txt --quiet
echo "✓ Dépendances installées"
echo ""

# Lancer le serveur
echo "[4/4] Démarrage du serveur..."
echo ""
echo "========================================"
echo "  Serveur lancé sur http://localhost:8000"
echo "  Appuyez sur CTRL+C pour arrêter"
echo "========================================"
echo ""
python main.py
