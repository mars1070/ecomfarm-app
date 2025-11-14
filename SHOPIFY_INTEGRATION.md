# 🏪 INTÉGRATION SHOPIFY - ECOMFARM

> ✅ **Vérifié avec la Documentation Officielle Shopify REST Admin API**
> 
> Toutes les propriétés et endpoints ont été vérifiés avec la documentation officielle Shopify.

## 📋 Vue d'Ensemble

EcomFarm est maintenant connecté à Shopify ! Tu peux gérer plusieurs stores Shopify et publier automatiquement :
- ✅ **Fiches Produits**
- ✅ **Collections**
- ✅ **Articles de Blog**

Avec 3 modes de publication :
- 📝 **Brouillon** (Draft)
- ✅ **Actif** (Publié immédiatement)
- ⏰ **Programmé** (Scheduled - publication automatique)

---

## 🚀 CONFIGURATION INITIALE

### 1️⃣ Créer une App Shopify

1. Va dans ton **Admin Shopify** → **Settings** → **Apps and sales channels**
2. Clique sur **"Develop apps"** → **"Create an app"**
3. Donne un nom : **"EcomFarm"**
4. Dans **"Configuration"** → **"Admin API integration"**
5. Sélectionne les **scopes** suivants :

#### Scopes Requis :
```
✅ write_products
✅ read_products
✅ write_content (pour articles de blog)
✅ read_content
✅ write_publications (optionnel)
✅ read_publications (optionnel)
```

6. **Installe l'app** sur ton store
7. Copie l'**Admin API Access Token** (commence par `shpat_...`)

### 2️⃣ Ajouter ton Store dans EcomFarm

1. Va dans **🏪 Mes Stores Shopify** (sidebar)
2. Clique sur **"Ajouter un Store Shopify"**
3. Remplis les informations :
   - **Nom du Store** : Ex: "Grillz Shop"
   - **Shop Domain** : `mystore.myshopify.com`
   - **Access Token** : `shpat_xxxxxxxxxxxxx`
   - **API Version** : `2024-10` (Latest)
4. Clique sur **"Enregistrer"**
5. Teste la connexion avec le bouton **✓**

---

## 📦 PUBLIER DES PRODUITS

### Exemple d'Intégration dans `/fiches-produits`

```tsx
import ShopifyStoreSelector from "@/components/ShopifyStoreSelector";
import PublishModeSelector from "@/components/PublishModeSelector";
import type { ShopifyStore, PublishMode } from "@/types/shopify";

const [selectedStore, setSelectedStore] = useState<ShopifyStore | null>(null);
const [publishMode, setPublishMode] = useState<PublishMode>('draft');
const [scheduledDate, setScheduledDate] = useState<string>("");

// Dans ton JSX
<ShopifyStoreSelector 
  onStoreSelect={setSelectedStore}
/>

<PublishModeSelector 
  onModeChange={(mode, date) => {
    setPublishMode(mode);
    if (date) setScheduledDate(date);
  }}
/>

// Fonction de publication
const publishToShopify = async (product: any) => {
  if (!selectedStore) {
    alert("⚠️ Sélectionne un store Shopify");
    return;
  }

  const response = await fetch("/api/shopify/publish-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      store: selectedStore,
      product: {
        title: product.title,
        body_html: product.description,
        vendor: "Ma Marque",
        product_type: product.category,
        tags: product.tags,
        variants: [{
          price: product.price,
          sku: product.sku,
        }],
      },
      publishMode,
      scheduledDate: publishMode === 'scheduled' ? scheduledDate : undefined,
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    alert(`✅ ${result.message}`);
  } else {
    alert(`❌ Erreur: ${result.message}`);
  }
};
```

---

## 📚 PUBLIER DES COLLECTIONS

### Exemple d'Intégration dans `/collections`

```tsx
const publishCollectionToShopify = async (collection: any) => {
  if (!selectedStore) return;

  const response = await fetch("/api/shopify/publish-collection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      store: selectedStore,
      collection: {
        title: collection.title,
        body_html: collection.description,
        sort_order: "best-selling",
        seo: {
          title: collection.seoTitle,
          description: collection.seoDescription,
        },
      },
      publishMode,
      scheduledDate,
    }),
  });

  const result = await response.json();
  if (result.success) {
    alert(`✅ Collection publiée !`);
  }
};
```

---

## 📝 PUBLIER DES ARTICLES DE BLOG

### Étape 1 : Récupérer les Blogs Shopify

```tsx
const [blogs, setBlogs] = useState([]);
const [selectedBlogId, setSelectedBlogId] = useState("");

useEffect(() => {
  if (selectedStore) {
    fetchBlogs();
  }
}, [selectedStore]);

const fetchBlogs = async () => {
  const response = await fetch("/api/shopify/get-blogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ store: selectedStore }),
  });

  const result = await response.json();
  if (result.success) {
    setBlogs(result.data.blogs);
  }
};
```

### Étape 2 : Publier un Article

```tsx
const publishArticleToShopify = async (article: any) => {
  if (!selectedStore || !selectedBlogId) {
    alert("⚠️ Sélectionne un store et un blog");
    return;
  }

  const response = await fetch("/api/shopify/publish-article", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      store: selectedStore,
      blogId: selectedBlogId,
      article: {
        title: article.keyword,
        body_html: article.content,
        author: "EcomFarm",
        tags: article.tags || "",
        summary_html: article.serpAnalysis?.substring(0, 200),
      },
      publishMode,
      scheduledDate,
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    alert(`✅ Article publié sur Shopify !`);
  } else {
    alert(`❌ Erreur: ${result.message}`);
  }
};
```

---

## 🎯 MODES DE PUBLICATION

### 📝 **Articles de Blog**
Selon la [documentation officielle Shopify](https://shopify.dev/docs/api/admin-rest/latest/resources/article) :

```typescript
// 1. Brouillon (Draft)
publishMode: 'draft'
// Résultat : published_at = null

// 2. Actif (Active)
publishMode: 'active'
// Résultat : published_at = ISO date (now)

// 3. Programmé (Scheduled)
publishMode: 'scheduled'
scheduledDate: '2025-12-25T10:00:00'
// Résultat : published_at = ISO date (future)
```

### 📦 **Produits**
Selon la [documentation officielle Shopify](https://shopify.dev/docs/api/admin-rest/latest/resources/product) :

```typescript
// 1. Brouillon (Draft)
publishMode: 'draft'
// Résultat : status = 'draft', published_at = null

// 2. Actif (Active)
publishMode: 'active'
// Résultat : status = 'active', published_at = ISO date (now)

// 3. Programmé (Scheduled)
publishMode: 'scheduled'
scheduledDate: '2025-12-25T10:00:00'
// Résultat : status = 'active', published_at = ISO date (future)
```

### 📚 **Collections**
Similaire aux articles :

```typescript
// 1. Brouillon (Draft)
publishMode: 'draft'
// Résultat : published_at = null

// 2. Actif (Active)
publishMode: 'active'
// Résultat : published_at = ISO date (now)

// 3. Programmé (Scheduled)
publishMode: 'scheduled'
scheduledDate: '2025-12-25T10:00:00'
// Résultat : published_at = ISO date (future)
```

---

## 🔧 API ENDPOINTS DISPONIBLES

### Test de Connexion
```
POST /api/shopify/test-connection
Body: { store: ShopifyStore }
```

### Récupérer les Blogs
```
POST /api/shopify/get-blogs
Body: { store: ShopifyStore }
```

### Publier un Produit
```
POST /api/shopify/publish-product
Body: { 
  store: ShopifyStore,
  product: ShopifyProduct,
  publishMode: 'draft' | 'active' | 'scheduled',
  scheduledDate?: string
}
```

### Publier une Collection
```
POST /api/shopify/publish-collection
Body: { 
  store: ShopifyStore,
  collection: ShopifyCollection,
  publishMode: 'draft' | 'active' | 'scheduled',
  scheduledDate?: string
}
```

### Publier un Article
```
POST /api/shopify/publish-article
Body: { 
  store: ShopifyStore,
  blogId: string,
  article: ShopifyArticle,
  publishMode: 'draft' | 'active' | 'scheduled',
  scheduledDate?: string
}
```

---

## 📁 STRUCTURE DES FICHIERS

```
/types/shopify.ts                          # Types TypeScript
/lib/shopify-client.ts                     # Client API Shopify
/components/ShopifyStoreSelector.tsx       # Sélecteur de store
/components/PublishModeSelector.tsx        # Sélecteur de mode
/app/shopify-stores/page.tsx               # Gestion des stores
/app/api/shopify/test-connection/route.ts  # Test connexion
/app/api/shopify/get-blogs/route.ts        # Récupérer blogs
/app/api/shopify/publish-product/route.ts  # Publier produit
/app/api/shopify/publish-collection/route.ts # Publier collection
/app/api/shopify/publish-article/route.ts  # Publier article
```

---

## ✅ CHECKLIST D'INTÉGRATION

### Pour chaque page (Produits, Collections, Blog) :

- [ ] Importer `ShopifyStoreSelector` et `PublishModeSelector`
- [ ] Ajouter les states : `selectedStore`, `publishMode`, `scheduledDate`
- [ ] Ajouter les composants dans le JSX
- [ ] Créer la fonction `publishToShopify()`
- [ ] Ajouter un bouton "Publier sur Shopify"
- [ ] Gérer les erreurs et afficher les notifications

---

## 🎉 PROCHAINES ÉTAPES

1. **Intégrer dans `/blog/page.tsx`** :
   - Ajouter sélecteur de store
   - Ajouter sélecteur de blog Shopify
   - Ajouter bouton "Publier sur Shopify" pour chaque article
   - Gérer publication en masse

2. **Intégrer dans `/fiches-produits/page.tsx`** :
   - Ajouter sélecteur de store
   - Ajouter mode de publication
   - Bouton de publication individuelle

3. **Intégrer dans `/collections/page.tsx`** :
   - Même logique que produits

4. **Fonctionnalités Avancées** :
   - Synchronisation bidirectionnelle
   - Mise à jour de contenu existant
   - Gestion des images (upload vers Shopify)
   - Webhooks pour notifications

---

## 🔐 SÉCURITÉ

⚠️ **IMPORTANT** :
- Les tokens Shopify sont stockés dans **localStorage** (côté client)
- Pour la production, utilise une **base de données sécurisée**
- Chiffre les tokens avec un service backend
- Utilise des variables d'environnement pour les secrets

---

## 📞 SUPPORT

Si tu as des questions ou des problèmes :
1. Vérifie que ton token Shopify a les bons scopes
2. Teste la connexion avec le bouton ✓
3. Consulte les logs de la console
4. Vérifie que le store est **Actif** dans la liste

**Bon développement ! 🚀**
