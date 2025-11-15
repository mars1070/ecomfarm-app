"use client";

import { useState, useEffect } from "react";
import { Plus, Store, Trash2, CheckCircle, XCircle, Edit2, Save, X } from "lucide-react";
import type { ShopifyStore } from "@/types/shopify";

export default function ShopifyStoresPage() {
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    shopDomain: "",
    accessToken: "",
    apiVersion: "2025-01",
  });

  // Load stores from localStorage
  useEffect(() => {
    const savedStores = localStorage.getItem("shopifyStores");
    if (savedStores) {
      setStores(JSON.parse(savedStores));
    }

    // Gérer le retour OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    const token = urlParams.get("token");
    const success = urlParams.get("success");
    const shopName = urlParams.get("name");

    if (success === "true" && shop && token) {
      // Utiliser le nom récupéré depuis Shopify, ou fallback sur le domaine
      const storeName = shopName || shop.replace(".myshopify.com", "").charAt(0).toUpperCase() + shop.replace(".myshopify.com", "").slice(1);
      
      // Créer automatiquement le store
      const newStore: ShopifyStore = {
        id: Date.now().toString(),
        name: storeName,
        shopDomain: shop,
        accessToken: token,
        apiVersion: "2025-01",
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const existingStores = JSON.parse(localStorage.getItem("shopifyStores") || "[]");
      
      // Vérifier si le store n'existe pas déjà
      const storeExists = existingStores.some((s: ShopifyStore) => s.shopDomain === shop);
      
      if (!storeExists) {
        const updatedStores = [...existingStores, newStore];
        localStorage.setItem("shopifyStores", JSON.stringify(updatedStores));
        setStores(updatedStores);
        alert(`✅ Store "${newStore.name}" connecté avec succès via OAuth !`);
      } else {
        alert(`⚠️ Ce store est déjà connecté !`);
      }

      // Nettoyer l'URL
      window.history.replaceState({}, document.title, "/shopify-stores");
    }
  }, []);

  // Save stores to localStorage
  const saveStores = (updatedStores: ShopifyStore[]) => {
    setStores(updatedStores);
    localStorage.setItem("shopifyStores", JSON.stringify(updatedStores));
  };

  const handleAddStore = () => {
    if (!formData.name || !formData.shopDomain || !formData.accessToken) {
      alert("⚠️ Veuillez remplir tous les champs");
      return;
    }

    const newStore: ShopifyStore = {
      id: Date.now().toString(),
      name: formData.name,
      shopDomain: formData.shopDomain,
      accessToken: formData.accessToken,
      apiVersion: formData.apiVersion,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    saveStores([...stores, newStore]);
    setFormData({ name: "", shopDomain: "", accessToken: "", apiVersion: "2025-01" });
    setShowAddForm(false);
    alert("✅ Store ajouté avec succès !");
  };

  const handleDeleteStore = (id: string) => {
    if (confirm("⚠️ Êtes-vous sûr de vouloir supprimer ce store ?")) {
      saveStores(stores.filter(s => s.id !== id));
      alert("✅ Store supprimé");
    }
  };

  const handleTestConnection = async (store: ShopifyStore) => {
    setTestingId(store.id);
    
    try {
      const response = await fetch("/api/shopify/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert("✅ Connexion réussie !");
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur de connexion: ${error.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const toggleActive = (id: string) => {
    const updatedStores = stores.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    saveStores(updatedStores);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Store className="w-10 h-10 text-green-600" />
            Mes Stores Shopify
          </h1>
          <p className="text-gray-600">
            Gérez vos connexions Shopify pour publier vos produits, collections et articles de blog
          </p>
        </div>

        {/* Add Store Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => {
              const shop = prompt("⚠️ IMPORTANT: Entrez votre domaine .myshopify.com\n\nExemple: ocean-jewelry.myshopify.com\n(PAS votre domaine personnalisé comme grillzteeth.store)\n\nVotre domaine .myshopify.com :");
              if (shop) {
                // Nettoyer l'input utilisateur
                const cleanShop = shop
                  .replace(/^https?:\/\//, '')
                  .replace(/^www\./, '')
                  .replace(/\/$/, '')
                  .trim();
                
                if (!cleanShop.includes('.myshopify.com')) {
                  alert("❌ Erreur: Vous devez utiliser votre domaine .myshopify.com\n\nExemple: ocean-jewelry.myshopify.com\n\nPour trouver votre domaine .myshopify.com:\n1. Allez dans votre admin Shopify\n2. Settings → Domains\n3. Copiez votre domaine .myshopify.com");
                  return;
                }
                
                window.location.href = `/api/auth/shopify/start?shop=${cleanShop}`;
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-medium"
          >
            <Store className="w-5 h-5" />
            🔗 Connecter via OAuth (Recommandé)
          </button>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            Ajouter Manuellement
          </button>
        </div>

        {/* Add Store Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-green-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nouveau Store Shopify</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Store
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Grillz Shop"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Domain
                </label>
                <input
                  type="text"
                  value={formData.shopDomain}
                  onChange={(e) => setFormData({ ...formData, shopDomain: e.target.value })}
                  placeholder="mystore.myshopify.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin API Access Token
                </label>
                <input
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                  placeholder="shpat_xxxxxxxxxxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Version
                </label>
                <select
                  value={formData.apiVersion}
                  onChange={(e) => setFormData({ ...formData, apiVersion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="2025-01">2025-01 (Latest) ⭐</option>
                  <option value="2024-10">2024-10</option>
                  <option value="2024-07">2024-07</option>
                  <option value="2024-04">2024-04</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddStore}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Stores List */}
        <div className="grid grid-cols-1 gap-4">
          {stores.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun store Shopify connecté</p>
              <p className="text-gray-400 text-sm mt-2">Cliquez sur "Ajouter un Store" pour commencer</p>
            </div>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                className={`bg-white rounded-2xl shadow-lg p-6 border-2 transition-all ${
                  store.isActive ? 'border-green-200' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{store.name}</h3>
                      {store.isActive ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Actif
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          Inactif
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>🌐 <span className="font-mono">{store.shopDomain}</span></p>
                      <p>📅 Ajouté le {new Date(store.createdAt).toLocaleDateString('fr-FR')}</p>
                      <p>🔧 API Version: {store.apiVersion}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestConnection(store)}
                      disabled={testingId === store.id}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                      title="Tester la connexion"
                    >
                      {testingId === store.id ? (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={() => toggleActive(store.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        store.isActive
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={store.isActive ? "Désactiver" : "Activer"}
                    >
                      {store.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => handleDeleteStore(store.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">📚 Comment obtenir vos credentials Shopify ?</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li><strong>1.</strong> Allez dans votre admin Shopify → Settings → Apps and sales channels</li>
            <li><strong>2.</strong> Cliquez sur "Develop apps" → "Create an app"</li>
            <li><strong>3.</strong> Donnez un nom à votre app (ex: "EcomFarm")</li>
            <li><strong>4.</strong> Dans "Configuration" → "Admin API integration" → Sélectionnez les scopes:</li>
            <ul className="ml-6 mt-1 space-y-1">
              <li>✅ <code className="bg-blue-100 px-2 py-0.5 rounded">write_products</code></li>
              <li>✅ <code className="bg-blue-100 px-2 py-0.5 rounded">read_products</code></li>
              <li>✅ <code className="bg-blue-100 px-2 py-0.5 rounded">write_content</code> (pour les articles de blog)</li>
              <li>✅ <code className="bg-blue-100 px-2 py-0.5 rounded">read_content</code></li>
            </ul>
            <li><strong>5.</strong> Installez l'app et copiez l'<strong>Admin API Access Token</strong></li>
            <li><strong>6.</strong> Collez le token ici avec votre shop domain (ex: mystore.myshopify.com)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
