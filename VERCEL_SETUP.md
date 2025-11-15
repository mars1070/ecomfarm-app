# 🚀 Configuration Vercel pour EcomFarm

## ⚙️ Variables d'environnement à configurer

### 1. Aller dans Vercel Dashboard
1. https://vercel.com/dashboard
2. Sélectionner le projet **ecomfarm-app**
3. **Settings** → **Environment Variables**

### 2. Ajouter ces variables

#### Shopify API (OBLIGATOIRE)
```
Name: SHOPIFY_API_KEY
Value: [Copie ta clé API depuis Shopify Admin]
Environment: Production, Preview, Development
```

```
Name: SHOPIFY_API_SECRET
Value: [Copie ton secret depuis Shopify Admin]
Environment: Production, Preview, Development
```

#### App URL (OBLIGATOIRE)
```
Name: NEXT_PUBLIC_APP_URL
Value: https://ecomfarm-app.vercel.app
Environment: Production, Preview, Development
```

#### Anthropic API (Optionnel - peut être configuré dans l'interface)
```
Name: ANTHROPIC_API_KEY
Value: sk-ant-votre-clé-ici
Environment: Production, Preview, Development
```

#### Perplexity API (Optionnel - peut être configuré dans l'interface)
```
Name: PERPLEXITY_API_KEY
Value: pplx-votre-clé-ici
Environment: Production, Preview, Development
```

### 3. Redéployer
Après avoir ajouté les variables :
1. **Deployments** → Cliquer sur les **3 points** du dernier déploiement
2. Cliquer sur **Redeploy**

---

## 🔍 Vérifier que les variables sont chargées

Une fois déployé, visite :
```
https://ton-app.vercel.app/api/test-env
```

Tu devrais voir :
```json
{
  "shopify_api_key": "✅ Défini",
  "shopify_api_secret": "✅ Défini",
  "app_url": "https://ton-app.vercel.app",
  "node_env": "production"
}
```

---

## 🔧 Configuration Shopify

### Mettre à jour les URLs dans Shopify
1. **Shopify Admin** → **Settings** → **Apps and sales channels**
2. **Develop apps** → Sélectionner **EcomFarm**
3. **Configuration** → Modifier :

```
App URL:
https://ecomfarm-app.vercel.app

Allowed redirection URL(s):
https://ecomfarm-app.vercel.app/api/auth/shopify/callback
```

4. **Sauvegarder**

---

## ✅ Checklist de déploiement

- [ ] Variables d'environnement ajoutées dans Vercel
- [ ] App redéployée
- [ ] Route `/api/test-env` vérifiée (toutes les variables ✅)
- [ ] URLs mises à jour dans Shopify
- [ ] Test de connexion OAuth Shopify réussi
- [ ] Store connecté dans l'app

---

## 🆘 En cas de problème

### Erreur "api_key undefined"
→ Les variables d'environnement ne sont pas chargées
→ Vérifie qu'elles sont bien ajoutées dans Vercel
→ Redéploie l'app

### Erreur OAuth Shopify
→ Vérifie que les URLs dans Shopify correspondent à ton domaine Vercel
→ Vérifie que `NEXT_PUBLIC_APP_URL` est correct

### Build fail
→ Vérifie les logs de build dans Vercel
→ Assure-toi que toutes les dépendances sont installées
