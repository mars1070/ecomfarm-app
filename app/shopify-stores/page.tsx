"use client";

import { useState, useEffect } from "react";
import { Plus, Store, Trash2, CheckCircle, XCircle, Edit2, Save, X, Settings } from "lucide-react";
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

  // ENV variables state
  const [envData, setEnvData] = useState({
    clientId: "",
    clientSecret: "",
  });
  const [isUpdatingEnv, setIsUpdatingEnv] = useState(false);

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

  const handleUpdateEnv = async () => {
    if (!envData.clientId || !envData.clientSecret) {
      alert("⚠️ Veuillez remplir le Client ID et le Client Secret");
      return;
    }

    setIsUpdatingEnv(true);

    try {
      const response = await fetch("/api/update-env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: envData.clientId,
          clientSecret: envData.clientSecret,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsUpdatingEnv(false);
    }
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

        {/* ENV Configuration Section */}
        <div className="mb-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-900">⚙️ Configuration .env.local (Tests locaux)</h3>
              <p className="text-sm text-orange-700">Modifiez vos Client ID et Secret pour les tests en local</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client ID (SHOPIFY_API_KEY)
              </label>
              <input
                type="text"
                value={envData.clientId}
                onChange={(e) => setEnvData({ ...envData, clientId: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                placeholder="ecee28c96df03a44de6939aba72391d5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client Secret (SHOPIFY_API_SECRET)
              </label>
              <input
                type="text"
                value={envData.clientSecret}
                onChange={(e) => setEnvData({ ...envData, clientSecret: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                placeholder="shpss_xxxxx"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleUpdateEnv}
              disabled={isUpdatingEnv}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingEnv ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Mettre à jour .env.local
                </>
              )}
            </button>

            <div className="text-xs text-orange-800 bg-orange-100 px-3 py-2 rounded-lg">
              ⚠️ Redémarrez le serveur après la mise à jour
            </div>
          </div>
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

        {/* Tutorial Box */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-900">📚 Créer votre App Shopify</h3>
              <p className="text-sm text-blue-700">Configuration complète en 6 étapes</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Step 1 */}
            <div className="bg-white rounded-xl p-5 border-l-4 border-blue-500">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 bg-blue-500 text-white rounded-full text-sm">1</span>
                Créer l'app
              </h4>
              <p className="text-sm text-gray-700 ml-9">
                Admin Shopify → <strong>Settings</strong> → <strong>Apps and sales channels</strong> → <strong>Develop apps</strong> → <strong>Create an app</strong>
              </p>
              <p className="text-sm text-gray-700 ml-9 mt-2">
                Nom : <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">EcomFarm</code>
              </p>
            </div>

            {/* Step 2 - Scopes */}
            <div className="bg-white rounded-xl p-5 border-l-4 border-purple-500">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 bg-purple-500 text-white rounded-full text-sm">2</span>
                Configurer les Scopes (Admin API)
              </h4>
              <p className="text-sm text-gray-700 ml-9 mb-3">
                Cliquez sur <strong>"Configure Admin API scopes"</strong> et copiez-collez ces permissions :
              </p>
              
              <div className="ml-9 bg-gray-900 rounded-lg p-4 relative">
                <code className="text-green-400 text-xs font-mono block whitespace-pre-wrap break-all">
                  read_customers,read_orders,read_product_listings,read_products,write_products,write_publications,read_content,write_content
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('read_customers,read_orders,read_product_listings,read_products,write_products,write_publications,read_content,write_content');
                    alert('✅ Scopes copiés !');
                  }}
                  className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Copier
                </button>
              </div>
            </div>

            {/* Step 3 - URLs */}
            <div className="bg-white rounded-xl p-5 border-l-4 border-green-500">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 bg-green-500 text-white rounded-full text-sm">3</span>
                Configurer les URLs
              </h4>
              <div className="ml-9 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">App URL :</p>
                  <div className="bg-gray-900 rounded-lg p-3 relative">
                    <code className="text-green-400 text-xs font-mono">https://ecomfarm-app.vercel.app/</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('https://ecomfarm-app.vercel.app/');
                        alert('✅ App URL copiée !');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Copier
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Allowed redirection URL(s) :</p>
                  <p className="text-xs text-orange-700 mb-2 bg-orange-50 p-2 rounded border border-orange-200">
                    ⚠️ <strong>Important :</strong> Ajoutez les 2 URLs (production ET localhost pour les tests)
                  </p>
                  
                  <div className="space-y-2">
                    <div className="bg-gray-900 rounded-lg p-3 relative">
                      <code className="text-green-400 text-xs font-mono">https://ecomfarm-app.vercel.app/api/auth/shopify/callback</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('https://ecomfarm-app.vercel.app/api/auth/shopify/callback');
                          alert('✅ URL Production copiée !');
                        }}
                        className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Copier
                      </button>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-3 relative">
                      <code className="text-yellow-400 text-xs font-mono">http://localhost:3000/api/auth/shopify/callback</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('http://localhost:3000/api/auth/shopify/callback');
                          alert('✅ URL Localhost copiée !');
                        }}
                        className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Copier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 - Client ID & Secret */}
            <div className="bg-white rounded-xl p-5 border-l-4 border-indigo-500">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 bg-indigo-500 text-white rounded-full text-sm">4</span>
                Récupérer Client ID et Client Secret
              </h4>
              <p className="text-sm text-gray-700 ml-9 mb-3">
                Dans <strong>"API credentials"</strong>, vous trouverez :
              </p>
              <div className="ml-9 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Client ID :</p>
                  <div className="bg-gray-900 rounded-lg p-3 relative">
                    <code className="text-green-400 text-xs font-mono">ecee28c96df03a44de6939aba72391d5</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('ecee28c96df03a44de6939aba72391d5');
                        alert('✅ Client ID copié !');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Copier
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Client Secret :</p>
                  <div className="bg-gray-900 rounded-lg p-3 relative">
                    <code className="text-green-400 text-xs font-mono">{envData.clientSecret || 'shpss_xxxxx...'}</code>
                    <button
                      onClick={() => {
                        if (envData.clientSecret) {
                          navigator.clipboard.writeText(envData.clientSecret);
                          alert('✅ Client Secret copié !');
                        }
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Copier
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 ml-9 mt-3 italic">
                💡 Ces valeurs sont déjà configurées dans l'app EcomFarm
              </p>
            </div>

            {/* Step 5 - Webhooks Version */}
            <div className="bg-white rounded-xl p-5 border-l-4 border-pink-500">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 bg-pink-500 text-white rounded-full text-sm">5</span>
                Webhooks API Version
              </h4>
              <p className="text-sm text-gray-700 ml-9 mb-2">
                Dans <strong>"App setup"</strong>, définissez la version :
              </p>
              <div className="ml-9 bg-gray-900 rounded-lg p-3 inline-block">
                <code className="text-green-400 text-xs font-mono">2025-10</code>
              </div>
            </div>

            {/* Step 6 - Install */}
            <div className="bg-white rounded-xl p-5 border-l-4 border-orange-500">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 bg-orange-500 text-white rounded-full text-sm">6</span>
                Installer et récupérer le token
              </h4>
              <div className="ml-9 space-y-2">
                <p className="text-sm text-gray-700">
                  1. Cliquez sur <strong>"Install app"</strong>
                </p>
                <p className="text-sm text-gray-700">
                  2. Allez dans <strong>"API credentials"</strong>
                </p>
                <p className="text-sm text-gray-700">
                  3. Copiez l'<strong>"Admin API access token"</strong> (commence par <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">shpat_</code>)
                </p>
                <p className="text-sm text-gray-700 mt-3">
                  4. Revenez ici et ajoutez votre store avec :
                </p>
                <ul className="text-sm text-gray-700 ml-4 space-y-1">
                  <li>• <strong>Shop Domain</strong> : <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">votre-store.myshopify.com</code></li>
                  <li>• <strong>Access Token</strong> : <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">shpat_xxxxx</code></li>
                  <li>• <strong>API Version</strong> : <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">2025-01</code></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h5 className="font-bold text-yellow-900 mb-1">Important</h5>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Le token est <strong>secret</strong> - ne le partagez jamais</li>
                  <li>• Utilisez votre domaine <strong>.myshopify.com</strong>, pas votre domaine personnalisé</li>
                  <li>• Webhooks version : <strong>2025-10</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
