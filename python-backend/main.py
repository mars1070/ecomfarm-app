"""
EcomFarm - Système d'Auto-Assignment Produits → Collections
Backend Python avec FastAPI et Machine Learning
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import time
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI(title="EcomFarm Auto-Assignment API")

# CORS pour permettre les requêtes depuis Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== MODELS =====

class ShopifyStore(BaseModel):
    shop_domain: str
    access_token: str
    api_version: str = "2025-01"

class AssignmentRequest(BaseModel):
    store: ShopifyStore
    auto_apply: bool = False
    confidence_threshold: float = 0.7
    max_suggestions_per_product: int = 3

class Suggestion(BaseModel):
    product_id: str
    product_title: str
    collection_id: str
    collection_title: str
    collection_type: str
    confidence_score: float
    already_assigned: bool = False

# ===== SHOPIFY API FUNCTIONS =====

def make_shopify_request(store: ShopifyStore, endpoint: str, method: str = "GET", data: dict = None):
    """Fait une requête à l'API Shopify avec rate limiting"""
    url = f"https://{store.shop_domain}/admin/api/{store.api_version}{endpoint}"
    headers = {
        'X-Shopify-Access-Token': store.access_token,
        'Content-Type': 'application/json',
    }
    
    # Rate limiting: 2 req/sec max
    time.sleep(0.5)
    
    if method == "GET":
        response = requests.get(url, headers=headers)
    elif method == "POST":
        response = requests.post(url, headers=headers, json=data)
    else:
        raise ValueError(f"Unsupported method: {method}")
    
    if response.status_code not in [200, 201]:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Shopify API error: {response.text}"
        )
    
    return response.json()

def fetch_all_products(store: ShopifyStore) -> List[dict]:
    """Récupère tous les produits Shopify"""
    print("📦 Récupération des produits...")
    
    all_products = []
    endpoint = "/products.json?limit=250"
    
    while endpoint:
        data = make_shopify_request(store, endpoint)
        products = data.get('products', [])
        all_products.extend(products)
        
        # Pagination via Link header
        # Pour simplifier, on s'arrête à 250 produits
        # TODO: Implémenter pagination complète
        break
    
    print(f"✅ {len(all_products)} produits récupérés")
    return all_products

def fetch_all_collections(store: ShopifyStore) -> List[dict]:
    """Récupère toutes les collections (custom + smart)"""
    print("📁 Récupération des collections...")
    
    # Custom collections
    custom_data = make_shopify_request(store, "/custom_collections.json?limit=250")
    custom_collections = custom_data.get('custom_collections', [])
    
    # Smart collections
    smart_data = make_shopify_request(store, "/smart_collections.json?limit=250")
    smart_collections = smart_data.get('smart_collections', [])
    
    # Ajouter le type à chaque collection
    for c in custom_collections:
        c['collection_type'] = 'custom'
    for c in smart_collections:
        c['collection_type'] = 'smart'
    
    all_collections = custom_collections + smart_collections
    print(f"✅ {len(all_collections)} collections récupérées ({len(custom_collections)} custom, {len(smart_collections)} smart)")
    
    return all_collections

def get_existing_collects(store: ShopifyStore, product_id: str) -> List[str]:
    """Récupère les collections auxquelles un produit est déjà assigné"""
    try:
        data = make_shopify_request(store, f"/collects.json?product_id={product_id}&limit=250")
        collects = data.get('collects', [])
        return [str(c['collection_id']) for c in collects]
    except:
        return []

def add_product_to_collection(store: ShopifyStore, product_id: str, collection_id: str) -> bool:
    """Ajoute un produit à une collection custom"""
    try:
        data = {
            'collect': {
                'product_id': int(product_id),
                'collection_id': int(collection_id),
            }
        }
        make_shopify_request(store, "/collects.json", method="POST", data=data)
        return True
    except Exception as e:
        print(f"❌ Erreur lors de l'ajout: {e}")
        return False

# ===== MACHINE LEARNING FUNCTIONS =====

def match_products_to_collections_tfidf(products: List[dict], collections: List[dict], threshold: float = 0.7) -> List[dict]:
    """
    Méthode 1: TF-IDF + Cosine Similarity
    Rapide et efficace pour la plupart des cas
    """
    print("🤖 Analyse avec TF-IDF + Cosine Similarity...")
    
    # Extraire les titres
    product_titles = [p['title'] for p in products]
    collection_names = [c['title'] for c in collections]
    
    if not product_titles or not collection_names:
        return []
    
    # Vectorisation TF-IDF
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),  # Unigrammes et bigrammes
        lowercase=True,
        max_features=1000
    )
    
    all_texts = product_titles + collection_names
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    # Séparer produits et collections
    product_vectors = tfidf_matrix[:len(products)]
    collection_vectors = tfidf_matrix[len(products):]
    
    # Calculer similarité
    similarity_matrix = cosine_similarity(product_vectors, collection_vectors)
    
    # Générer suggestions
    suggestions = []
    for i, product in enumerate(products):
        # Trouver les meilleures collections pour ce produit
        scores = similarity_matrix[i]
        top_indices = np.argsort(scores)[::-1]  # Tri décroissant
        
        for j in top_indices:
            score = scores[j]
            if score >= threshold:
                suggestions.append({
                    'product_id': str(product['id']),
                    'product_title': product['title'],
                    'collection_id': str(collections[j]['id']),
                    'collection_title': collections[j]['title'],
                    'collection_type': collections[j]['collection_type'],
                    'confidence_score': float(score),
                })
    
    print(f"✅ {len(suggestions)} suggestions générées")
    return suggestions

# ===== API ENDPOINTS =====

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "online",
        "service": "EcomFarm Auto-Assignment API",
        "version": "1.0.0"
    }

@app.post("/api/suggest-collections", response_model=dict)
async def suggest_collections(request: AssignmentRequest):
    """
    Analyse les produits et suggère des associations avec collections
    
    Args:
        request: Contient store credentials, auto_apply flag, et paramètres
    
    Returns:
        Suggestions d'associations avec scores de confiance
    """
    try:
        print("\n" + "="*60)
        print("🚀 DÉBUT DE L'ANALYSE AUTO-ASSIGNMENT")
        print("="*60)
        
        # 1. Récupérer produits
        products = fetch_all_products(request.store)
        if not products:
            raise HTTPException(status_code=404, detail="Aucun produit trouvé")
        
        # 2. Récupérer collections
        collections = fetch_all_collections(request.store)
        if not collections:
            raise HTTPException(status_code=404, detail="Aucune collection trouvée")
        
        # Filtrer uniquement les custom collections pour l'assignment
        custom_collections = [c for c in collections if c['collection_type'] == 'custom']
        if not custom_collections:
            raise HTTPException(status_code=404, detail="Aucune collection custom trouvée")
        
        # 3. Calculer suggestions avec TF-IDF
        raw_suggestions = match_products_to_collections_tfidf(
            products, 
            custom_collections, 
            threshold=request.confidence_threshold
        )
        
        # 4. Vérifier les assignments existants
        print("🔍 Vérification des assignments existants...")
        suggestions_with_status = []
        
        for suggestion in raw_suggestions:
            existing_collections = get_existing_collects(
                request.store, 
                suggestion['product_id']
            )
            
            already_assigned = suggestion['collection_id'] in existing_collections
            
            suggestions_with_status.append({
                **suggestion,
                'already_assigned': already_assigned
            })
        
        # Limiter le nombre de suggestions par produit
        product_suggestion_counts = {}
        filtered_suggestions = []
        
        for suggestion in sorted(suggestions_with_status, key=lambda x: x['confidence_score'], reverse=True):
            product_id = suggestion['product_id']
            count = product_suggestion_counts.get(product_id, 0)
            
            if count < request.max_suggestions_per_product:
                filtered_suggestions.append(suggestion)
                product_suggestion_counts[product_id] = count + 1
        
        # 5. Si auto_apply, appliquer les suggestions
        applied = []
        if request.auto_apply:
            print("⚡ Application automatique des suggestions...")
            
            for suggestion in filtered_suggestions:
                # Appliquer uniquement si:
                # - Score élevé (> 0.8)
                # - Pas déjà assigné
                # - Collection custom
                if (suggestion['confidence_score'] > 0.8 and 
                    not suggestion['already_assigned'] and
                    suggestion['collection_type'] == 'custom'):
                    
                    success = add_product_to_collection(
                        request.store,
                        suggestion['product_id'],
                        suggestion['collection_id']
                    )
                    
                    if success:
                        applied.append(suggestion)
                        print(f"  ✅ {suggestion['product_title'][:50]} → {suggestion['collection_title']}")
            
            print(f"✅ {len(applied)} assignments appliqués")
        
        print("="*60)
        print("✅ ANALYSE TERMINÉE")
        print("="*60 + "\n")
        
        return {
            'success': True,
            'suggestions': filtered_suggestions,
            'applied': applied if request.auto_apply else [],
            'stats': {
                'total_products': len(products),
                'total_collections': len(collections),
                'custom_collections': len(custom_collections),
                'total_suggestions': len(filtered_suggestions),
                'total_applied': len(applied) if request.auto_apply else 0,
                'new_assignments': len([s for s in filtered_suggestions if not s['already_assigned']]),
                'already_assigned': len([s for s in filtered_suggestions if s['already_assigned']]),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/apply-suggestion")
async def apply_suggestion(
    store: ShopifyStore,
    product_id: str,
    collection_id: str
):
    """
    Applique une suggestion spécifique manuellement
    """
    try:
        success = add_product_to_collection(store, product_id, collection_id)
        
        if success:
            return {
                'success': True,
                'message': 'Produit ajouté à la collection avec succès'
            }
        else:
            raise HTTPException(status_code=500, detail="Échec de l'ajout")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("🚀 Démarrage du serveur EcomFarm Auto-Assignment...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
