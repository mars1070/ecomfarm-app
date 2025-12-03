# 🤖 EcomFarm Auto-Assignment Backend (Python)

Backend Python avec FastAPI pour l'auto-assignment intelligent de produits aux collections Shopify.

## 🚀 Installation

### 1. Créer un environnement virtuel

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 3. Lancer le serveur

```bash
python main.py
```

Ou avec uvicorn directement :

```bash
uvicorn main:app --reload --port 8000
```

Le serveur sera accessible sur : **http://localhost:8000**

## 📡 API Endpoints

### 1. Health Check

```bash
GET http://localhost:8000/
```

**Response:**
```json
{
  "status": "online",
  "service": "EcomFarm Auto-Assignment API",
  "version": "1.0.0"
}
```

### 2. Suggérer des associations

```bash
POST http://localhost:8000/api/suggest-collections
```

**Request Body:**
```json
{
  "store": {
    "shop_domain": "mystore.myshopify.com",
    "access_token": "shpat_xxxxx",
    "api_version": "2025-01"
  },
  "auto_apply": false,
  "confidence_threshold": 0.7,
  "max_suggestions_per_product": 3
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "product_id": "123",
      "product_title": "Collier Or 18K",
      "collection_id": "456",
      "collection_title": "Bijoux en Or",
      "collection_type": "custom",
      "confidence_score": 0.95,
      "already_assigned": false
    }
  ],
  "applied": [],
  "stats": {
    "total_products": 150,
    "total_collections": 25,
    "custom_collections": 20,
    "total_suggestions": 87,
    "total_applied": 0,
    "new_assignments": 87,
    "already_assigned": 0
  }
}
```

### 3. Appliquer une suggestion

```bash
POST http://localhost:8000/api/apply-suggestion
```

**Request Body:**
```json
{
  "store": {
    "shop_domain": "mystore.myshopify.com",
    "access_token": "shpat_xxxxx"
  },
  "product_id": "123",
  "collection_id": "456"
}
```

## 🧠 Algorithme de Matching

### TF-IDF + Cosine Similarity

L'algorithme utilise :

1. **TF-IDF Vectorization** : Convertit les titres en vecteurs numériques
2. **Cosine Similarity** : Calcule la similarité entre produits et collections
3. **Threshold Filtering** : Ne garde que les suggestions > seuil (0.7 par défaut)

### Exemples de Matching

| Produit | Collection | Score |
|---------|-----------|-------|
| "Collier Or 18K Diamants" | "Bijoux en Or" | 0.95 |
| "T-Shirt Homme Coton Bio" | "T-Shirts Homme" | 0.97 |
| "Montre Automatique Acier" | "Montres" | 0.92 |

## ⚙️ Configuration

### Paramètres de la requête

- **auto_apply** (bool) : Si `true`, applique automatiquement les suggestions avec score > 0.8
- **confidence_threshold** (float) : Seuil minimum de confiance (0.0 - 1.0)
- **max_suggestions_per_product** (int) : Nombre max de suggestions par produit

### Rate Limiting

Le backend respecte automatiquement le rate limit Shopify :
- **2 requêtes/seconde** maximum
- Délai de 0.5s entre chaque requête

## 🔒 Scopes Shopify Requis

Assurez-vous que votre app Shopify a ces scopes :

- ✅ `read_products` - Lire les produits
- ✅ `read_content` - Lire les collections
- ✅ `write_content` - Modifier les collections (ajouter produits)

## 📊 Statistiques Retournées

```json
{
  "total_products": 150,        // Nombre total de produits
  "total_collections": 25,      // Nombre total de collections
  "custom_collections": 20,     // Collections custom (modifiables)
  "total_suggestions": 87,      // Suggestions générées
  "total_applied": 0,           // Suggestions appliquées (si auto_apply)
  "new_assignments": 87,        // Nouvelles associations possibles
  "already_assigned": 0         // Produits déjà dans les collections
}
```

## 🐛 Debugging

### Activer les logs détaillés

Les logs sont automatiquement affichés dans la console :

```
🚀 DÉBUT DE L'ANALYSE AUTO-ASSIGNMENT
📦 Récupération des produits...
✅ 150 produits récupérés
📁 Récupération des collections...
✅ 25 collections récupérées (20 custom, 5 smart)
🤖 Analyse avec TF-IDF + Cosine Similarity...
✅ 87 suggestions générées
🔍 Vérification des assignments existants...
✅ ANALYSE TERMINÉE
```

### Tester avec curl

```bash
curl -X POST http://localhost:8000/api/suggest-collections \
  -H "Content-Type: application/json" \
  -d '{
    "store": {
      "shop_domain": "mystore.myshopify.com",
      "access_token": "shpat_xxxxx"
    },
    "auto_apply": false,
    "confidence_threshold": 0.7
  }'
```

## 🚀 Déploiement

### Option 1: Heroku

```bash
heroku create ecomfarm-autoassign
git push heroku main
```

### Option 2: Railway

```bash
railway init
railway up
```

### Option 3: Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 Notes

- Les **Smart Collections** utilisent des règles automatiques et ne peuvent pas être modifiées manuellement
- Seules les **Custom Collections** peuvent recevoir des produits via l'API
- Le système vérifie automatiquement si un produit est déjà dans une collection avant de suggérer

## 🔗 Intégration avec Next.js

Voir le fichier `PRODUCT_COLLECTION_AUTO_ASSIGNMENT.md` pour l'interface frontend.
