# 🚀 **GUIDE D'UTILISATION - PUBLICATION SHOPIFY**

> **EcomFarm App** - Publication automatique sur Shopify  
> **Date :** Novembre 2025

---

## 📋 **TABLE DES MATIÈRES**

1. [Configuration Initiale](#1-configuration-initiale)
2. [Publication d'Articles de Blog](#2-publication-darticles-de-blog)
3. [Publication de Fiches Produits](#3-publication-de-fiches-produits)
4. [Publication de Collections](#4-publication-de-collections)
5. [Modes de Publication](#5-modes-de-publication)
6. [FAQ & Dépannage](#6-faq--dépannage)

---

## 1️⃣ **CONFIGURATION INITIALE**

### **Étape 1 : Créer une App Privée Shopify**

1. **Connectez-vous à votre admin Shopify**
   ```
   https://votre-store.myshopify.com/admin
   ```

2. **Allez dans Paramètres → Apps et canaux de vente**
   - Cliquez sur "Développer des apps"
   - Cliquez sur "Créer une app"

3. **Nommez votre app**
   ```
   Nom : EcomFarm Publisher
   ```

4. **Configurez les permissions (Scopes)**
   
   Allez dans "Configuration" → "Admin API scopes" :
   
   ✅ **Produits :**
   - `read_products`
   - `write_products`
   
   ✅ **Collections :**
   - `read_collections`
   - `write_collections`
   
   ✅ **Contenu (Blogs/Articles) :**
   - `read_content`
   - `write_content`

5. **Installez l'app**
   - Cliquez sur "Installer l'app"
   - Confirmez l'installation

6. **Récupérez le Token d'accès**
   - Allez dans "API credentials"
   - Copiez le **Admin API access token**
   - ⚠️ **IMPORTANT :** Sauvegardez-le immédiatement (il ne sera affiché qu'une fois)

---

### **Étape 2 : Ajouter le Store dans EcomFarm**

1. **Ouvrez EcomFarm App**
   ```
   http://localhost:3000/shopify-stores
   ```

2. **Cliquez sur "Ajouter un Store"**

3. **Remplissez les informations :**
   ```
   Nom du Store : Ocean Jewelry
   Domaine Shopify : ocean-jewelry.myshopify.com
   Access Token : shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Version API : 2025-01 (Latest) ⭐
   ```

4. **Testez la connexion**
   - Cliquez sur "Tester la Connexion"
   - ✅ Vous devriez voir "Connexion réussie !"

5. **Sauvegardez**
   - Cliquez sur "Ajouter le Store"
   - Le store apparaît dans la liste

---

## 2️⃣ **PUBLICATION D'ARTICLES DE BLOG**

### **Workflow Complet**

```
1. Générer les articles (SERP + Rédaction)
   ↓
2. Sélectionner un Store Shopify
   ↓
3. Sélectionner un Blog Shopify
   ↓
4. Choisir le mode de publication
   ↓
5. Publier (tous ou individuellement)
```

---

### **Étape 1 : Générer les Articles**

1. **Allez sur la page Blog**
   ```
   http://localhost:3000/blog
   ```

2. **Configurez la génération**
   - **URL du site :** `https://mon-store.com`
   - **Langue :** Français (ou autre)
   - **Modèle Perplexity :** Sonar (recommandé) ou Sonar Pro

3. **Ajoutez vos mots-clés**
   ```
   Exemple (niche Grillz) :
   
   Groupe 1 - grillz-guide :
   - How Much Do Grillz Cost
   - Are Grillz Removable
   - Do Grillz Damage Your Teeth
   
   Groupe 2 - grillz-care :
   - How to Clean Grillz
   - Grillz Maintenance Tips
   ```

4. **Cliquez sur "Générer Tous les Articles"**
   - Attendez la fin de la génération (2-4 min par article)
   - Les articles apparaissent avec leur contenu HTML

---

### **Étape 2 : Publier sur Shopify**

#### **A. Sélectionner le Store et le Blog**

1. **La section "Publication sur Shopify" apparaît automatiquement** (après génération)

2. **Sélectionnez votre Store Shopify**
   - Dropdown avec tous vos stores
   - Exemple : "Mon Store Grillz"

3. **Sélectionnez le Blog cible**
   - Les blogs sont chargés automatiquement
   - Exemple : "News" ou "Guides"
   - ⚠️ Si aucun blog n'apparaît, créez-en un dans Shopify d'abord

---

#### **B. Choisir le Mode de Publication**

**3 modes disponibles :**

1. **📝 Brouillon (Draft)**
   - Articles non publiés
   - Visibles uniquement dans l'admin Shopify
   - Parfait pour relecture avant publication

2. **✅ Actif (Active)**
   - Articles publiés immédiatement
   - Visibles sur le site
   - Date de publication = maintenant

3. **📅 Programmé (Scheduled)**
   - Articles programmés pour une date future
   - Sélectionnez la date et l'heure
   - Publication automatique à la date choisie

---

#### **C. Publier les Articles**

**Option 1 : Publication en Masse**
```
1. Cliquez sur "Publier X articles sur Shopify"
2. Confirmez la publication
3. Attendez la fin (logs en temps réel)
4. Alert finale avec résumé (succès/erreurs)
```

**Option 2 : Publication Individuelle**
```
1. Trouvez l'article dans la liste
2. Cliquez sur "Publier cet article sur Shopify"
3. Confirmation immédiate
```

---

### **Vérification dans Shopify**

1. **Allez dans votre admin Shopify**
   ```
   https://votre-store.myshopify.com/admin/blogs
   ```

2. **Ouvrez le blog sélectionné**

3. **Vérifiez les articles**
   - ✅ Titre correct
   - ✅ Contenu HTML complet
   - ✅ Liens internes fonctionnels
   - ✅ Statut correct (Draft/Active/Scheduled)

---

## 3️⃣ **PUBLICATION DE FICHES PRODUITS**

### **Workflow Complet**

```
1. Importer un CSV Shopify
   ↓
2. Optimiser avec l'IA (titres + descriptions)
   ↓
3. Sélectionner un Store Shopify
   ↓
4. Choisir le mode de publication
   ↓
5. Publier (tous ou individuellement)
```

---

### **Étape 1 : Préparer le CSV**

**Format requis : CSV Shopify**

```csv
Title,Image Src,Vendor,Product Type
Gold Grillz,https://example.com/image.jpg,MyBrand,Jewelry
Diamond Grillz,https://example.com/image2.jpg,MyBrand,Jewelry
```

**Colonnes importantes :**
- `Title` : Titre du produit (requis)
- `Image Src` : URL de l'image (optionnel)
- Autres colonnes Shopify standard

---

### **Étape 2 : Optimiser avec l'IA**

1. **Allez sur la page Fiches Produits**
   ```
   http://localhost:3000/fiches-produits
   ```

2. **Configurez les paramètres**
   - **Langue :** Anglais (ou autre)
   - **Niche du produit :** Grillz (pour contexte)
   - **Mode :** Both (titre + description)
   - **Utiliser l'image :** ✅ (recommandé)

3. **Importez le CSV**
   - Cliquez sur "Importer CSV"
   - Sélectionnez votre fichier

4. **Lancez l'optimisation**
   - Cliquez sur "Lancer l'Optimisation IA"
   - Attendez la fin (5-10 secondes par produit)

---

### **Étape 3 : Publier sur Shopify**

1. **La section "Publication sur Shopify" apparaît** (après optimisation)

2. **Sélectionnez votre Store Shopify**

3. **Choisissez le mode de publication**
   - Draft / Active / Scheduled

4. **Publiez**
   - **Tous :** "Publier X produits sur Shopify"
   - **Individuels :** Boutons sur chaque produit (si besoin)

---

### **Ce qui est publié**

```typescript
{
  title: "Nouveau titre optimisé",
  body_html: "Nouvelle description optimisée",
  vendor: "Votre niche",
  product_type: "Votre niche",
  images: [{ src: "URL de l'image" }],
  status: "draft" | "active",
  published_at: "2025-11-14T19:00:00Z"
}
```

---

## 4️⃣ **PUBLICATION DE COLLECTIONS**

### **Workflow Complet**

```
1. Créer des groupes de collections
   ↓
2. Générer le contenu SEO avec maillage
   ↓
3. Sélectionner un Store Shopify
   ↓
4. Choisir le mode de publication
   ↓
5. Publier (toutes en une fois)
```

---

### **Étape 1 : Créer les Collections**

1. **Allez sur la page Collections**
   ```
   http://localhost:3000/collections
   ```

2. **Configurez**
   - **URL du site :** `https://mon-store.com`
   - **Langue :** Français (ou autre)

3. **Ajoutez un groupe**
   ```
   Exemple (niche Steampunk) :
   
   Groupe 1 - Vêtements :
   - Robes Steampunk
   - Vestes Steampunk
   - Accessoires Steampunk
   
   Groupe 2 - Décorations :
   - Horloges Steampunk
   - Lampes Steampunk
   - Cadres Steampunk
   ```

4. **Générez**
   - Cliquez sur "Générer Toutes les Collections"
   - Attendez la fin (10-15 secondes par collection)

---

### **Étape 2 : Publier sur Shopify**

1. **La section "Publication sur Shopify" apparaît**

2. **Sélectionnez votre Store**

3. **Choisissez le mode**
   - Draft / Active / Scheduled

4. **Publiez toutes les collections**
   - Cliquez sur "Publier X collections sur Shopify"
   - Confirmation et logs en temps réel

---

### **Ce qui est publié**

```typescript
{
  title: "Nom de la collection",
  body_html: "Contenu SEO avec maillage interne",
  handle: "nom-de-la-collection",
  published_at: "2025-11-14T19:00:00Z" | null
}
```

**Maillage interne inclus :**
- Liens vers collections précédente/suivante
- Liens vers homepage (premier article)
- Liens en boucle (dernier → premier)

---

## 5️⃣ **MODES DE PUBLICATION**

### **📝 Mode Brouillon (Draft)**

**Quand l'utiliser :**
- Relecture avant publication
- Modifications à faire
- Tests de contenu

**Comportement :**
```typescript
// Articles & Collections
{ published_at: null }

// Produits
{ status: 'draft', published_at: null }
```

**Résultat :**
- ❌ Non visible sur le site
- ✅ Visible dans l'admin Shopify
- ✅ Peut être publié manuellement plus tard

---

### **✅ Mode Actif (Active)**

**Quand l'utiliser :**
- Publication immédiate
- Contenu prêt à être vu
- Pas besoin de relecture

**Comportement :**
```typescript
// Articles & Collections
{ published_at: "2025-11-14T19:00:00Z" } // Date actuelle

// Produits
{ status: 'active', published_at: "2025-11-14T19:00:00Z" }
```

**Résultat :**
- ✅ Visible immédiatement sur le site
- ✅ Indexable par Google
- ✅ Accessible aux clients

---

### **📅 Mode Programmé (Scheduled)**

**Quand l'utiliser :**
- Planification de contenu
- Lancement coordonné
- Publication différée

**Comportement :**
```typescript
// Articles & Collections
{ published_at: "2025-12-25T10:00:00Z" } // Date future

// Produits
{ status: 'active', published_at: "2025-12-25T10:00:00Z" }
```

**Résultat :**
- ⏰ Publication automatique à la date choisie
- ❌ Non visible avant la date
- ✅ Visible automatiquement après la date

**Comment programmer :**
1. Sélectionnez "Programmé"
2. Choisissez la date et l'heure
3. Publiez
4. Shopify s'occupe du reste !

---

## 6️⃣ **FAQ & DÉPANNAGE**

### **❓ Questions Fréquentes**

#### **Q1 : Combien de stores puis-je ajouter ?**
**R :** Illimité ! Vous pouvez gérer autant de stores Shopify que vous voulez.

---

#### **Q2 : Les articles sont-ils publiés avec les liens internes ?**
**R :** Oui ! Le maillage interne est automatiquement inclus dans le HTML.

---

#### **Q3 : Puis-je modifier le contenu avant de publier ?**
**R :** Oui ! Deux options :
1. Publiez en mode Draft, puis modifiez dans Shopify
2. Copiez le HTML, modifiez-le, puis publiez manuellement

---

#### **Q4 : Que se passe-t-il si la publication échoue ?**
**R :** 
- Alert avec le message d'erreur
- Logs détaillés affichés
- Les autres publications continuent
- Résumé final (succès/erreurs)

---

#### **Q5 : Les images des produits sont-elles uploadées ?**
**R :** Non, seule l'URL de l'image est envoyée. L'image doit être hébergée ailleurs (ou déjà dans Shopify).

---

#### **Q6 : Puis-je publier sur plusieurs stores en même temps ?**
**R :** Non, vous devez sélectionner un store à la fois. Mais vous pouvez changer de store et republier.

---

### **🔧 Dépannage**

#### **Erreur : "Unauthorized" ou "401"**

**Cause :** Token d'accès invalide ou expiré

**Solution :**
1. Vérifiez le token dans Shopify
2. Régénérez le token si nécessaire
3. Mettez à jour le store dans EcomFarm

---

#### **Erreur : "Missing required scopes"**

**Cause :** Permissions insuffisantes

**Solution :**
1. Allez dans votre app Shopify
2. Ajoutez les scopes manquants :
   - `write_products`
   - `write_content`
   - `write_collections`
3. Réinstallez l'app

---

#### **Erreur : "Blog not found"**

**Cause :** Le blog n'existe pas dans Shopify

**Solution :**
1. Créez un blog dans Shopify :
   - Admin → Boutique en ligne → Pages de blog
   - Créer un blog
2. Rechargez la page EcomFarm
3. Sélectionnez le nouveau blog

---

#### **Erreur : "Rate limit exceeded"**

**Cause :** Trop de requêtes en peu de temps

**Solution :**
1. Attendez 1-2 minutes
2. Réessayez
3. Publiez en plusieurs fois (10-20 items max)

---

#### **Les liens internes ne fonctionnent pas**

**Cause :** URL du site incorrecte

**Solution :**
1. Vérifiez l'URL du site (sans trailing slash)
2. Format correct : `https://mon-store.com`
3. Régénérez les articles avec la bonne URL

---

#### **Le contenu n'apparaît pas sur le site**

**Cause :** Publié en mode Draft

**Solution :**
1. Allez dans Shopify admin
2. Trouvez l'article/produit/collection
3. Changez le statut en "Active"
4. Ou republiez depuis EcomFarm en mode "Actif"

---

## 📊 **RÉCAPITULATIF DES COÛTS**

### **Articles de Blog**

| Modèle | Coût SERP | Coût Rédaction | Total/Article |
|--------|-----------|----------------|---------------|
| Sonar | $0.0105 | $0.0345 | **$0.0450** |
| Sonar Pro | $0.0415 | $0.0345 | **$0.0760** |

**Recommandation :** Sonar Standard (excellent rapport qualité/prix)

---

### **Fiches Produits**

| Avec Image | Sans Image |
|------------|------------|
| $0.0007 | $0.000625 |

**Modèle :** Claude Haiku 4.5 (ultra rapide et économique)

---

### **Collections**

| Coût par Collection |
|---------------------|
| $0.0003 - $0.0005 |

**Modèle :** Claude Haiku (250-350 mots par collection)

---

## 🎯 **BONNES PRATIQUES**

### **Pour les Articles de Blog**

✅ **DO :**
- Relire en mode Draft avant publication
- Vérifier les liens internes
- Programmer pour un lancement coordonné
- Utiliser le maillage multi-groupes

❌ **DON'T :**
- Publier sans relire
- Oublier de configurer l'URL du site
- Négliger le choix du blog Shopify

---

### **Pour les Produits**

✅ **DO :**
- Utiliser des images de qualité
- Remplir la niche du produit
- Télécharger le CSV final (backup)
- Tester avec 5-10 produits d'abord

❌ **DON'T :**
- Publier 1000 produits d'un coup
- Oublier de vérifier les prix dans Shopify
- Négliger les variantes (à ajouter manuellement)

---

### **Pour les Collections**

✅ **DO :**
- Organiser par groupes thématiques
- Vérifier le maillage avant génération
- Télécharger le fichier texte (backup)
- Créer les collections dans Shopify d'abord (optionnel)

❌ **DON'T :**
- Mélanger des thèmes non liés
- Oublier de configurer l'URL du site
- Publier sans vérifier les handles

---

## 🚀 **PRÊT À PUBLIER !**

Vous avez maintenant tout ce qu'il faut pour publier automatiquement sur Shopify !

**Workflow recommandé pour débuter :**

```
1. Configurez 1 store Shopify
   ↓
2. Testez avec 1-2 articles en mode Draft
   ↓
3. Vérifiez dans Shopify
   ↓
4. Publiez en mode Actif
   ↓
5. Passez à l'échelle !
```

---

## 📞 **SUPPORT**

**Documentation officielle Shopify :**
- https://shopify.dev/docs/api/admin-rest/latest

**Fichiers de référence :**
- `SHOPIFY_API_REFERENCE.md` - Endpoints et propriétés
- `SHOPIFY_VERIFICATION.md` - Checklist de conformité
- `SHOPIFY_INTEGRATION.md` - Détails techniques

---

**Dernière mise à jour :** 14 novembre 2025  
**Version :** 1.0.0  
**Statut :** ✅ Production Ready
