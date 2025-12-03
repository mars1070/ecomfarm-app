@echo off
echo ========================================
echo   EcomFarm Auto-Assignment Backend
echo ========================================
echo.

REM Vérifier si l'environnement virtuel existe
if not exist "venv\" (
    echo [1/4] Creation de l'environnement virtuel...
    python -m venv venv
    echo ✓ Environnement virtuel cree
    echo.
) else (
    echo [1/4] Environnement virtuel deja present
    echo.
)

REM Activer l'environnement virtuel
echo [2/4] Activation de l'environnement...
call venv\Scripts\activate.bat
echo ✓ Environnement active
echo.

REM Installer/Mettre à jour les dépendances
echo [3/4] Installation des dependances...
pip install -r requirements.txt --quiet
echo ✓ Dependances installees
echo.

REM Lancer le serveur
echo [4/4] Demarrage du serveur...
echo.
echo ========================================
echo   Serveur lance sur http://localhost:8000
echo   Appuyez sur CTRL+C pour arreter
echo ========================================
echo.
python main.py

pause
