"use client";

import { useState } from "react";
import { Info, Package, FileText, BookOpen, Zap, Globe, Search, Brain, Link2, Sparkles, CheckCircle, ArrowRight, ChevronDown, ChevronUp, DollarSign } from "lucide-react";

export default function InfoPage() {
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg">
              <Info className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Guide Complet EcomFarm</h1>
              <p className="text-gray-600">
                Tout ce que vous devez savoir sur votre assistant SEO IA
              </p>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border-2 border-purple-200 p-5">
            <div className="text-3xl font-bold text-purple-600 mb-1">5</div>
            <div className="text-sm text-gray-600">Outils Principaux</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-5">
            <div className="text-3xl font-bold text-blue-600 mb-1">3</div>
            <div className="text-sm text-gray-600">Modèles Claude</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-200 p-5">
            <div className="text-3xl font-bold text-indigo-600 mb-1">14</div>
            <div className="text-sm text-gray-600">Langues supportées</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-5">
            <div className="text-3xl font-bold text-green-600 mb-1">100%</div>
            <div className="text-sm text-gray-600">Automatisé</div>
          </div>
        </div>

        {/* Main Features */}
        <div className="space-y-6">
          
          {/* Articles de Blog */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Articles de Blog SEO</h2>
                  <p className="text-blue-100">Recherche SERP + Rédaction IA optimisée</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">10-15</div>
                  <div className="text-xs text-gray-600">Pages SERP</div>
                </div>
                <div className="bg-cyan-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-600">1200-1800</div>
                  <div className="text-xs text-gray-600">Mots/Article</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">$0.07</div>
                  <div className="text-xs text-gray-600">Prix/Article</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">2 min</div>
                  <div className="text-xs text-gray-600">Temps moyen</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Fonctionnalités
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Analyse SERP Perplexity</strong> : Scraping des 10-15 premiers résultats Google</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Rédaction Claude Sonnet 4.5</strong> : Articles 1200-1800 mots optimisés SEO</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Maillage interne automatique</strong> : 2 liens par article avec ancres optimisées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Publication Shopify</strong> : Draft, Actif ou Programmé avec planification auto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Planification automatique</strong> : Choisir les jours (Lun-Dim), 12h-15h random</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Groupes de maillage</strong> : Organisation par thématique avec liens croisés</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">💰 Coûts par Article</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-600">Analyse SERP</div>
                    <div className="font-bold text-blue-600">$0.0225</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Rédaction</div>
                    <div className="font-bold text-blue-600">$0.0345</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-300">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-900">Total</span>
                    <span className="text-xl font-bold text-blue-600">$0.057</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collections */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Collections Shopify</h2>
                  <p className="text-purple-100">Descriptions SEO avec maillage interne</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">300-500</div>
                  <div className="text-xs text-gray-600">Mots/Collection</div>
                </div>
                <div className="bg-pink-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-pink-600">2</div>
                  <div className="text-xs text-gray-600">Liens internes</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600">$0.01</div>
                  <div className="text-xs text-gray-600">Prix/Collection</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">30s</div>
                  <div className="text-xs text-gray-600">Temps moyen</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Fonctionnalités
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Rédaction Claude Haiku 4.5</strong> : Descriptions 300-500 mots optimisées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Maillage automatique</strong> : 2 liens vers autres collections avec title SEO</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Groupes de maillage</strong> : Organisation par thématique</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Publication Shopify</strong> : Actif ou Programmé avec délai personnalisable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Délai entre publications</strong> : Heures ou jours pour étaler dans le temps</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sync Collections */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Sync Collections Shopify</h2>
                  <p className="text-green-100">Synchronisation et auto-assignment produits</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  Fonctionnalités
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Synchronisation bidirectionnelle</strong> : Shopify ↔ Local en temps réel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Nombre réel de produits</strong> : Via API /collects.json (pas products_count)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Auto-Assignment intelligent</strong> : Analyse titre + tags + type + vendor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Interface de révision UX/UI</strong> : Approuver/rejeter les suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Scores de confiance</strong> : Barre visuelle + pourcentage (40-100%)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Multi-collections</strong> : Un produit peut aller dans plusieurs collections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Édition produits</strong> : Titre, images, ordre, suppression</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">🧠 Algorithme Auto-Assignment</h4>
                <ul className="space-y-1 text-xs text-green-800">
                  <li>• Analyse : Titre + Tags + Type + Vendor</li>
                  <li>• Split intelligent : Espaces, tirets, underscores, slashes</li>
                  <li>• Correspondance bidirectionnelle : "bijou" match "bijoux"</li>
                  <li>• Bonus multi-mots : +0.2 si 2+ mots, +0.2 si 3+ mots</li>
                  <li>• Seuil : 40% minimum (très permissif)</li>
                  <li>• Résultat : ~90% des produits assignés</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fiches Produits */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
              <div className="flex items-center gap-3 text-white">
                <Package className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">📦 Fiches Produits</h2>
                  <p className="text-green-100">Génération de titres et descriptions SEO optimisés</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Fonctionnalités Principales
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Génération de titres</strong> à partir d'images produits (Gemini Vision)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Descriptions SEO</strong> optimisées avec mots-clés (Claude Haiku)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Support multilingue</strong> : 14 langues disponibles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Export Shopify</strong> : Format CSV prêt à importer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Génération en masse</strong> : Traitez plusieurs produits d'un coup</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Modèles IA Utilisés
                </h4>
                <div className="space-y-1 text-sm text-green-800">
                  <div>🤖 <strong>Gemini 2.5 Flash</strong> - Analyse d'images pour titres</div>
                  <div>🤖 <strong>Claude 3.5 Haiku</strong> - Rédaction descriptions SEO</div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Cas d'usage</h4>
                <p className="text-sm text-blue-800">
                  Parfait pour créer rapidement des fiches produits optimisées SEO à partir de photos. 
                  L'IA analyse l'image, génère un titre pertinent, puis rédige une description engageante avec mots-clés.
                </p>
              </div>
            </div>
          </div>

          {/* Modèles IA */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
              <div className="flex items-center gap-3 text-white">
                <Brain className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">🤖 Modèles IA Utilisés</h2>
                  <p className="text-indigo-100">Claude Sonnet 4.5, Haiku 4.5, Perplexity Sonar</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-2">Claude Sonnet 4.5</h4>
                  <p className="text-xs text-blue-700 mb-2">Articles de blog</p>
                  <ul className="space-y-1 text-xs text-blue-800">
                    <li>• Analyse SERP</li>
                    <li>• Rédaction 1200-1800 mots</li>
                    <li>• $3/$15 par 1M tokens</li>
                  </ul>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-2">Claude Haiku 4.5</h4>
                  <p className="text-xs text-purple-700 mb-2">Collections & Produits</p>
                  <ul className="space-y-1 text-xs text-purple-800">
                    <li>• Descriptions collections</li>
                    <li>• Fiches produits</li>
                    <li>• $0.80/$4 par 1M tokens</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <h4 className="font-bold text-green-900 mb-2">Perplexity Sonar</h4>
                  <p className="text-xs text-green-700 mb-2">Recherche SERP</p>
                  <ul className="space-y-1 text-xs text-green-800">
                    <li>• Scraping Google TOP 10</li>
                    <li>• 10-15 pages analysées</li>
                    <li>• $0.0105 par recherche</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>EcomFarm - Votre assistant SEO IA pour e-commerce</p>
          <p className="mt-1">Dernière mise à jour : Novembre 2025</p>
        </div>
      </div>
    </div>
  );
}
