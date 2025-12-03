"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, XCircle, Loader2, TrendingUp, Package, FolderOpen, Zap } from "lucide-react";
import ShopifyStoreSelector from "@/components/ShopifyStoreSelector";
import type { ShopifyStore } from "@/types/shopify";

interface Suggestion {
  product_id: string;
  product_title: string;
  collection_id: string;
  collection_title: string;
  collection_type: string;
  confidence_score: number;
  already_assigned: boolean;
}

interface Stats {
  total_products: number;
  total_collections: number;
  custom_collections: number;
  total_suggestions: number;
  total_applied: number;
  new_assignments: number;
  already_assigned: number;
}

export default function AutoAssignPage() {
  const [selectedStore, setSelectedStore] = useState<ShopifyStore | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [maxSuggestions, setMaxSuggestions] = useState(3);

  const analyzeSuggestions = async (autoApply: boolean = false) => {
    if (!selectedStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    setLoading(true);
    setSuggestions([]);
    setStats(null);

    try {
      const response = await fetch('http://localhost:8000/api/suggest-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store: selectedStore,
          auto_apply: autoApply,
          confidence_threshold: confidenceThreshold,
          max_suggestions_per_product: maxSuggestions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
        setStats(data.stats);
        
        if (autoApply && data.stats.total_applied > 0) {
          alert(`✅ ${data.stats.total_applied} produits assignés automatiquement !`);
        }
      } else {
        alert(`❌ Erreur: ${data.message || 'Erreur inconnue'}`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Erreur de connexion au backend Python:\n${error.message}\n\nAssurez-vous que le serveur Python est lancé sur http://localhost:8000`);
    } finally {
      setLoading(false);
    }
  };

  const applyAssignment = async (suggestion: Suggestion) => {
    if (!selectedStore) return;

    setApplying(suggestion.product_id + suggestion.collection_id);

    try {
      const response = await fetch('http://localhost:8000/api/apply-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store: selectedStore,
          product_id: suggestion.product_id,
          collection_id: suggestion.collection_id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${suggestion.product_title} ajouté à ${suggestion.collection_title}`);
        
        // Marquer comme assigné
        setSuggestions(prev =>
          prev.map(s =>
            s.product_id === suggestion.product_id && s.collection_id === suggestion.collection_id
              ? { ...s, already_assigned: true }
              : s
          )
        );
      } else {
        alert(`❌ Erreur: ${data.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Auto-Assignment IA
              </h1>
              <p className="text-gray-600 mt-1">
                Associez automatiquement vos produits aux collections pertinentes
              </p>
            </div>
          </div>

          {/* Store Selector */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-purple-100">
            <ShopifyStoreSelector
              selectedStore={selectedStore}
              onStoreSelect={setSelectedStore}
            />
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-2 border-blue-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Configuration</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seuil de confiance minimum
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold text-purple-600 w-16">
                  {(confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Plus le seuil est élevé, plus les suggestions sont précises
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggestions max par produit
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={maxSuggestions}
                  onChange={(e) => setMaxSuggestions(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold text-blue-600 w-16">
                  {maxSuggestions}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Nombre de collections suggérées par produit
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => analyzeSuggestions(false)}
            disabled={!selectedStore || loading}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                Analyser et Suggérer
              </>
            )}
          </button>

          <button
            onClick={() => analyzeSuggestions(true)}
            disabled={!selectedStore || loading}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Application en cours...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Appliquer Automatiquement
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produits</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_products}</p>
                </div>
                <Package className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Collections</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.custom_collections}</p>
                </div>
                <FolderOpen className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Suggestions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_suggestions}</p>
                </div>
                <Sparkles className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Appliqués</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_applied}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                💡 {suggestions.length} Suggestions trouvées
              </h2>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  ✨ {suggestions.filter(s => !s.already_assigned).length} nouvelles
                </span>
                <span className="text-gray-500">
                  ✓ {suggestions.filter(s => s.already_assigned).length} déjà assignées
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    suggestion.already_assigned
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <p className="font-semibold text-gray-900">
                          {suggestion.product_title}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 ml-8">
                        <span className="text-gray-400">→</span>
                        <FolderOpen className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <p className="text-sm text-gray-700">
                          {suggestion.collection_title}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 mt-3 ml-8">
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-200 rounded-full h-2 w-32">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                              style={{ width: `${suggestion.confidence_score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-green-600">
                            {(suggestion.confidence_score * 100).toFixed(0)}%
                          </span>
                        </div>

                        {suggestion.already_assigned && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Déjà assigné
                          </span>
                        )}
                      </div>
                    </div>

                    {!suggestion.already_assigned && (
                      <button
                        onClick={() => applyAssignment(suggestion)}
                        disabled={applying === suggestion.product_id + suggestion.collection_id}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                      >
                        {applying === suggestion.product_id + suggestion.collection_id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Application...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Appliquer</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Backend */}
        <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>ℹ️ Backend Python requis :</strong> Assurez-vous que le serveur Python est lancé sur{' '}
            <code className="bg-yellow-100 px-2 py-1 rounded">http://localhost:8000</code>
            <br />
            <span className="text-xs">
              Commande : <code className="bg-yellow-100 px-2 py-1 rounded">cd python-backend && python main.py</code>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
