# 📚 RÉFÉRENCE COMPLÈTE API SHOPIFY REST ADMIN

> ✅ **Vérifié avec la documentation officielle Shopify REST Admin API (Latest)**
> 
> Dernière vérification : Novembre 2025

---

## ⚠️ IMPORTANT

**L'API REST Admin est legacy depuis le 1er octobre 2024.**
À partir du 1er avril 2025, toutes les nouvelles apps publiques devront utiliser exclusivement l'API GraphQL Admin.

Pour les apps existantes et custom apps, l'API REST reste fonctionnelle.

---

## 🔐 SCOPES REQUIS

```
✅ read_products
✅ write_products
✅ read_content
✅ write_content
```

---

## 📦 PRODUITS (Products)

### Endpoint de Base
```
https://{shop_domain}/admin/api/{api_version}/products.json
```

### Propriétés Officielles
```typescript
{
  title: string;                    // Requis
  body_html?: string;               // Description HTML
  vendor?: string;
  product_type?: string;
  tags?: string;                    // Comma-separated
  status: 'active' | 'draft' | 'archived';
  published_at?: string | null;     // ISO 8601 - null = draft
  variants?: Array<{
    price: string;
    compare_at_price?: string;
    sku?: string;
    inventory_quantity?: number;
  }>;
  images?: Array<{
    src: string;
    alt?: string;
  }>;
}
```

### Endpoints
```
POST   /products.json                    # Créer
GET    /products.json                    # Lister
GET    /products/{id}.json               # Récupérer un
PUT    /products/{id}.json               # Mettre à jour
DELETE /products/{id}.json               # Supprimer
GET    /products/count.json              # Compter
```

**Source :** https://shopify.dev/docs/api/admin-rest/latest/resources/product

---

## 📚 COLLECTIONS (Custom Collections)

### Endpoint de Base
```
https://{shop_domain}/admin/api/{api_version}/custom_collections.json
```

### Propriétés Officielles
```typescript
{
  title: string;                    // Requis (max 255 chars)
  body_html?: string;               // Description HTML
  sort_order?: 'alpha-asc' | 'alpha-desc' | 'best-selling' | 
               'created' | 'created-desc' | 'manual' | 
               'price-asc' | 'price-desc';
  published_at?: string | null;     // ISO 8601 - null = non publié
  image?: {
    src?: string;
    alt?: string;
    attachment?: string;            // Base64-encoded
  };
}
```

### Endpoints
```
POST   /custom_collections.json          # Créer
GET    /custom_collections.json          # Lister
GET    /custom_collections/{id}.json     # Récupérer une
PUT    /custom_collections/{id}.json     # Mettre à jour
DELETE /custom_collections/{id}.json     # Supprimer
GET    /custom_collections/count.json    # Compter
```

**Source :** https://shopify.dev/docs/api/admin-rest/latest/resources/customcollection

---

## 📝 BLOGS

### Endpoint de Base
```
https://{shop_domain}/admin/api/{api_version}/blogs.json
```

### Propriétés Officielles
```typescript
{
  id: number;
  handle: string;                   // URL-friendly identifier
  title: string;
  commentable?: string;             // 'yes' | 'no' | 'moderate'
  feedburner?: string;
  feedburner_location?: string;
  created_at: string;               // ISO 8601
  updated_at: string;               // ISO 8601
  template_suffix?: string;
}
```

### Endpoints
```
POST   /blogs.json                       # Créer
GET    /blogs.json                       # Lister tous
GET    /blogs/{id}.json                  # Récupérer un
PUT    /blogs/{id}.json                  # Mettre à jour
DELETE /blogs/{id}.json                  # Supprimer
GET    /blogs/count.json                 # Compter
```

**Source :** https://shopify.dev/docs/api/admin-rest/latest/resources/blog

---

## 📰 ARTICLES (Blog Posts)

### Endpoint de Base
```
https://{shop_domain}/admin/api/{api_version}/blogs/{blog_id}/articles.json
```

### Propriétés Officielles
```typescript
{
  title: string;                    // Requis
  author?: string;
  tags?: string;                    // Comma-separated
  body_html: string;                // Requis - Contenu HTML
  blog_id: number;                  // Requis
  published_at?: string | null;     // ISO 8601 - null = draft
  image?: {
    src?: string;
    alt?: string;
    attachment?: string;            // Base64-encoded
  };
  summary_html?: string;
  metafields?: Array<{
    namespace: string;              // Max 20 chars
    key: string;                    // Max 30 chars
    value: string;
    type: string;
  }>;
}
```

### Endpoints
```
POST   /blogs/{blog_id}/articles.json              # Créer
GET    /blogs/{blog_id}/articles.json              # Lister
GET    /blogs/{blog_id}/articles/{id}.json         # Récupérer un
PUT    /blogs/{blog_id}/articles/{id}.json         # Mettre à jour
DELETE /blogs/{blog_id}/articles/{id}.json         # Supprimer
GET    /blogs/{blog_id}/articles/count.json        # Compter
GET    /articles/authors.json                      # Lister auteurs (deprecated)
GET    /articles/tags.json                         # Lister tags
```

**Source :** https://shopify.dev/docs/api/admin-rest/latest/resources/article

---

## 🏪 SHOP (Informations du Store)

### Endpoint
```
GET https://{shop_domain}/admin/api/{api_version}/shop.json
```

Utilisé pour tester la connexion.

**Source :** https://shopify.dev/docs/api/admin-rest/latest/resources/shop

---

## 📅 GESTION DE LA PUBLICATION

### Pour Articles et Collections
```typescript
// Draft (Brouillon)
{
  published_at: null
}

// Publié maintenant
{
  published_at: new Date().toISOString()
}

// Programmé (Scheduled)
{
  published_at: "2025-12-25T10:00:00Z"  // ISO 8601
}
```

### Pour Produits
```typescript
// Draft
{
  status: 'draft',
  published_at: null
}

// Actif (publié)
{
  status: 'active',
  published_at: new Date().toISOString()
}

// Programmé
{
  status: 'active',
  published_at: "2025-12-25T10:00:00Z"
}

// Archivé
{
  status: 'archived'
}
```

---

## 🔑 AUTHENTIFICATION

### Headers Requis
```typescript
{
  'X-Shopify-Access-Token': 'shpat_xxxxxxxxxxxxx',
  'Content-Type': 'application/json'
}
```

### Format de l'URL
```
https://{shop}.myshopify.com/admin/api/{version}/{resource}.json
```

Exemples :
- `https://mystore.myshopify.com/admin/api/2024-10/products.json`
- `https://mystore.myshopify.com/admin/api/2024-10/blogs/123/articles.json`

---

## 📊 VERSIONS API DISPONIBLES

```
2024-10 (Latest)
2024-07
2024-04
2024-01
```

**Recommandé :** Utiliser `2024-10` (latest)

---

## ⚠️ LIMITES DE TAUX (Rate Limits)

- **Bucket-based rate limiting** : 40 requêtes / seconde
- **Leaky bucket** : 2 requêtes / seconde en moyenne
- Header de réponse : `X-Shopify-Shop-Api-Call-Limit`

**Plus d'infos :** https://shopify.dev/docs/api/usage/rate-limits

---

## 🔗 LIENS OFFICIELS

- **REST Admin API** : https://shopify.dev/docs/api/admin-rest
- **Products** : https://shopify.dev/docs/api/admin-rest/latest/resources/product
- **Collections** : https://shopify.dev/docs/api/admin-rest/latest/resources/customcollection
- **Blogs** : https://shopify.dev/docs/api/admin-rest/latest/resources/blog
- **Articles** : https://shopify.dev/docs/api/admin-rest/latest/resources/article
- **Migration GraphQL** : https://shopify.dev/docs/api/usage/versioning/migrate-to-graphql

---

## ✅ CHECKLIST DE VÉRIFICATION

Avant de coder :
- [ ] Vérifier la version API (2024-10)
- [ ] Vérifier les scopes requis
- [ ] Vérifier les propriétés dans la doc officielle
- [ ] Vérifier le format des endpoints
- [ ] Tester avec un petit payload d'abord
- [ ] Gérer les erreurs (400, 401, 403, 429, 500)

---

**Dernière mise à jour :** Novembre 2025
**Vérifié avec :** Documentation officielle Shopify REST Admin API
