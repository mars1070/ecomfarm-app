# 🚀 Déploiement sur Vercel

## Configuration des variables d'environnement

Après avoir déployé sur Vercel, configure ces variables dans **Settings → Environment Variables** :

### Variables obligatoires

```bash
# Shopify OAuth (récupère depuis ton app Shopify Partners)
SHOPIFY_API_KEY=ton_client_id_shopify
SHOPIFY_API_SECRET=ton_client_secret_shopify

# URL de ton app (automatique sur Vercel)
NEXT_PUBLIC_APP_URL=https://ton-app.vercel.app
```

### Variables optionnelles

```bash
# Anthropic Claude (pour la génération de contenu)
ANTHROPIC_API_KEY=sk-ant-...

# Perplexity (pour l'analyse SERP)
PERPLEXITY_API_KEY=pplx-...
```

## Étapes de déploiement

1. **Push sur GitHub** (déjà fait)
   ```bash
   git push origin main
   ```

2. **Connecter à Vercel**
   - Va sur [vercel.com](https://vercel.com)
   - Import ton repo GitHub `mars1070/ecomfarm-app`
   - Vercel détectera automatiquement Next.js

3. **Configurer les variables d'environnement**
   - Dans Vercel Dashboard → Settings → Environment Variables
   - Ajoute `SHOPIFY_API_KEY` et `SHOPIFY_API_SECRET`
   - Ajoute `NEXT_PUBLIC_APP_URL` avec ton URL Vercel

4. **Mettre à jour l'URL de redirection Shopify**
   - Va dans ton app Shopify Partners
   - App setup → URLs
   - Allowed redirection URL(s) : `https://ton-app.vercel.app/api/auth/shopify/callback`

5. **Redéployer**
   - Vercel redéploie automatiquement à chaque push sur `main`

## Notes importantes

- ✅ Les clés API sont stockées de manière sécurisée dans Vercel
- ✅ `.env.local` est ignoré par Git (jamais commité)
- ✅ `.env.example` contient uniquement des placeholders
- ✅ Les stores Shopify sont stockés dans `localStorage` (côté client)

## Support

Si tu as des erreurs de déploiement, vérifie :
1. Les variables d'environnement sont bien configurées
2. L'URL de redirection Shopify correspond à ton domaine Vercel
3. Les logs de déploiement dans Vercel Dashboard
