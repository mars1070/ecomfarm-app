# EcomFarm 🌱

Application web moderne pour optimiser vos fiches produits e-commerce avec l'IA Claude.

## 🚀 Fonctionnalités

- **Fiches Produits** : Importez vos CSV Shopify et optimisez automatiquement vos titres et descriptions produits
- **Collections** : (À venir) Optimisez vos pages de collections
- **Articles de Blog** : (À venir) Rédigez des articles SEO-friendly
- **Intégration Claude** : Utilise Claude 3.5 Haiku pour une génération rapide et économique

## 🛠️ Technologies

- **Framework** : Next.js 14 avec App Router
- **Langage** : TypeScript
- **Styling** : TailwindCSS
- **IA** : Anthropic Claude API
- **Icônes** : Lucide React
- **CSV** : PapaParse

## 📦 Installation

1. **Cloner le projet**
```bash
cd "EcomFarm 2"
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'API Key**
   - Lancez l'application
   - Allez dans Paramètres
   - Ajoutez votre clé API Anthropic (obtenue sur https://console.anthropic.com/)

4. **Lancer le serveur de développement**
```bash
npm run dev
```

5. **Ouvrir dans le navigateur**
```
http://localhost:3000
```

## 📝 Utilisation

### Optimiser des Fiches Produits

1. Allez sur la page "Fiches Produits"
2. Importez votre fichier CSV Shopify (doit contenir une colonne "Title")
3. Cliquez sur "Optimiser avec IA"
4. L'IA va :
   - Réécrire chaque titre pour le rendre court et SEO-friendly
   - Générer une description optimisée pour chaque produit
5. Téléchargez le CSV optimisé

## 🔑 Configuration API

L'application utilise **Claude 3.5 Haiku**, le modèle le plus rapide et économique d'Anthropic.

Pour obtenir votre clé API :
1. Créez un compte sur https://console.anthropic.com/
2. Générez une clé API
3. Ajoutez-la dans les Paramètres de l'application

## 🚢 Déploiement sur Vercel

```bash
npm run build
```

L'application est prête pour être déployée sur Vercel :
- Connectez votre repo GitHub à Vercel
- Vercel détectera automatiquement Next.js
- Déployez en un clic !

## 📄 Structure du Projet

```
EcomFarm 2/
├── app/
│   ├── api/
│   │   ├── generate-title/      # API pour générer les titres
│   │   └── generate-description/ # API pour générer les descriptions
│   ├── fiches-produits/          # Page principale
│   ├── collections/              # Page collections (placeholder)
│   ├── blog/                     # Page blog (placeholder)
│   ├── parametres/               # Configuration API
│   ├── layout.tsx                # Layout principal avec sidebar
│   └── globals.css               # Styles globaux
├── components/
│   └── Sidebar.tsx               # Navigation sidebar
├── lib/
│   └── utils.ts                  # Utilitaires
└── package.json
```

## 🎨 Design

Design moderne inspiré de Shopify :
- Interface épurée et UX-friendly
- Sidebar de navigation claire
- Icônes Lucide pour une meilleure lisibilité
- Palette de couleurs verte (thème e-commerce)

## 📊 Format CSV

Le fichier CSV doit contenir au minimum :
- Une colonne **"Title"** (colonne 2 dans les exports Shopify)
- Les autres colonnes sont préservées

Après optimisation, le CSV contiendra :
- Les titres optimisés (remplacent les anciens)
- Une colonne "Description" avec les nouvelles descriptions

## 🤝 Support

Pour toute question ou problème, créez une issue sur le repo.

## 📜 Licence

MIT
