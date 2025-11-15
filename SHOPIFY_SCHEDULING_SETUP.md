# 📅 Configuration Shopify Scheduling

## ✅ Ce qui a été implémenté dans le code

### 1. GraphQL Client
- Fichier : `lib/shopify-client.ts`
- Méthode `graphql()` ajoutée
- Méthode `scheduleProductPublication()` ajoutée

### 2. API de publication
- Fichier : `app/api/shopify/publish-product/route.ts`
- Mode `scheduled` : Crée en `active` + schedule la publication
- Utilise GraphQL `publishablePublish` mutation

## 🔧 Configuration requise dans Shopify Partner Dashboard

### Étape 1 : Vérifier les Access Scopes

Votre app a besoin de ces permissions :

```
write_products          ✅ (déjà nécessaire)
read_products           ✅ (déjà nécessaire)
write_publications      ⚠️ (À VÉRIFIER/AJOUTER)
read_product_listings   ⚠️ (À VÉRIFIER/AJOUTER)
```

**Comment vérifier/ajouter :**

1. Allez sur https://partners.shopify.com/organizations
2. Sélectionnez votre organisation
3. Allez dans **Apps**
4. Sélectionnez votre app
5. Cliquez sur **Configuration**
6. Section **App setup** → **Scopes**
7. Ajoutez :
   - `write_publications`
   - `read_product_listings`

### Étape 2 : Activer Scheduled Publishing

**IMPORTANT** : Cette fonctionnalité doit être activée manuellement !

1. Dans votre app (Partner Dashboard)
2. Allez dans **Configuration**
3. Section **App settings**
4. Trouvez la carte **"Product Scheduled Publishing"**
5. Cliquez sur **"Enable feature"**

> ⚠️ Sans cette activation, `publishablePublish` avec `publishDate` future ne fonctionnera pas !

## 🎯 Comment ça marche

### Workflow complet :

```
1. Utilisateur configure le planning
   ↓
2. App crée le produit REST API
   status: "active"
   published_at: null
   → Produit actif mais NON publié sur les channels
   ↓
3. App appelle GraphQL publishablePublish
   publicationId: "gid://shopify/Publication/XXX" (Online Store)
   publishDate: "2025-12-01T10:00:00Z"
   → Programmé pour publication automatique
   ↓
4. Shopify publie automatiquement à la date
   → Produit devient visible sur le site
```

### Résultat :

- ✅ Produit visible dans l'admin Shopify (status: Active)
- ❌ Produit INVISIBLE sur le site (pas publié sur Online Store)
- 📅 Publication automatique à la date programmée
- 🔄 Aucune action manuelle nécessaire

## 🧪 Test après configuration

### 1. Vérifier que les scopes sont actifs

Dans votre code OAuth (`app/api/auth/shopify/start/route.ts`), les scopes doivent inclure :

```typescript
const scopes = [
  'write_products',
  'read_products',
  'write_publications',      // ← NOUVEAU
  'read_product_listings',   // ← NOUVEAU
].join(',');
```

### 2. Réautoriser l'app

Après avoir ajouté les scopes :
1. Allez dans **Shopify Stores** (dans votre app)
2. Supprimez le store
3. Reconnectez-le
4. Shopify demandera les nouvelles permissions

### 3. Tester le scheduling

1. Importez un CSV dans **Planification**
2. Configurez : 5 immédiats, 10/jour, date future
3. Générez le planning
4. Publiez
5. Vérifiez dans Shopify :
   - Admin → Produits → Status "Active" ✅
   - Online Store → Produit invisible ❌
   - Après la date → Produit visible ✅

## 🐛 Troubleshooting

### Erreur : "Missing access scope"
→ Ajoutez `write_publications` et `read_product_listings` dans les scopes

### Erreur : "Scheduled publishing not enabled"
→ Activez la fonctionnalité dans Partner Dashboard (Étape 2)

### Erreur : "Online Store publication not found"
→ Le store n'a pas de channel "Online Store" actif

### Produit visible immédiatement
→ Vérifiez que `published_at: null` lors de la création
→ Vérifiez que `publishablePublish` est bien appelé

## 📚 Documentation Shopify

- [Enable Scheduled Publishing](https://shopify.dev/docs/apps/build/sales-channels/enable-scheduled-publishing)
- [publishablePublish mutation](https://shopify.dev/docs/api/admin-graphql/latest/mutations/publishablePublish)
- [Access Scopes](https://shopify.dev/docs/api/usage/access-scopes)

## ✅ Checklist

- [ ] Scopes ajoutés dans Partner Dashboard
- [ ] Scheduled Publishing activé dans Partner Dashboard
- [ ] Scopes mis à jour dans le code OAuth
- [ ] App réautorisée sur le store de test
- [ ] Test de création d'un produit schedulé
- [ ] Vérification dans l'admin Shopify
- [ ] Vérification sur le site (invisible)
- [ ] Attente de la date de publication (ou test avec date proche)
