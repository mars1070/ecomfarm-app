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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border-2 border-purple-200 p-5">
            <div className="text-3xl font-bold text-purple-600 mb-1">3</div>
            <div className="text-sm text-gray-600">Outils SEO</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-5">
            <div className="text-3xl font-bold text-blue-600 mb-1">4</div>
            <div className="text-sm text-gray-600">Modèles IA</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-200 p-5">
            <div className="text-3xl font-bold text-indigo-600 mb-1">14</div>
            <div className="text-sm text-gray-600">Langues supportées</div>
          </div>
        </div>

        {/* Main Features */}
        <div className="space-y-6">
          
          {/* Fiches Produits */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 overflow-hidden">
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

          {/* Collections */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
              <div className="flex items-center gap-3 text-white">
                <FileText className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">🔗 Collections (Maillage Interne)</h2>
                  <p className="text-purple-100">Système de liens internes en boucle par groupes</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-purple-500" />
                  Système de Maillage Intelligent
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Groupes indépendants</strong> : Organisez vos collections par thème</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Maillage en boucle</strong> : Chaque groupe a son propre circuit de liens</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span><strong>2 liens par collection</strong> : Optimisé pour le SEO</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Contenu HTML pur</strong> : Prêt pour Shopify (250-350 mots)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Ancres en minuscules</strong> : Grammaticalement correct</span>
                  </li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3">📊 Structure de Maillage</h4>
                <div className="space-y-2 text-sm text-purple-800">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    <span><strong>Collection 1</strong> → Page d'accueil + Collection 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    <span><strong>Collections du milieu</strong> → Précédente + Suivante</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    <span><strong>Dernière collection</strong> → Précédente + Retour à Collection 1</span>
                  </div>
                </div>
              </div>

              <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                <h4 className="font-semibold text-pink-900 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Modèle IA Utilisé
                </h4>
                <div className="text-sm text-pink-800">
                  🤖 <strong>Claude 3.5 Haiku</strong> - Génération rapide de contenu SEO structuré
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Cas d'usage</h4>
                <p className="text-sm text-blue-800">
                  Créez un réseau de liens internes puissant pour votre boutique. Exemple : Groupe "Vêtements Steampunk" 
                  avec 5 collections qui se lient entre elles en boucle, sans jamais pointer vers d'autres groupes.
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-2">⚡ Règles SEO Strictes</h4>
                <ul className="space-y-1 text-sm text-amber-800">
                  <li>• Mot-clé principal dans 3/4 des titres H2</li>
                  <li>• Strong tags minimal (1-3 par paragraphe)</li>
                  <li>• Pas de mot "collection" pour les catégories</li>
                  <li>• Pas de tirets longs (— ou –)</li>
                  <li>• Ancres adaptées à la langue cible</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Articles de Blog */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
              <div className="flex items-center gap-3 text-white">
                <BookOpen className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">📝 Articles de Blog SEO</h2>
                  <p className="text-blue-100">Recherche SERP + Rédaction optimisée + Calcul des coûts réels</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">10-15</div>
                  <div className="text-xs text-blue-700">Pages SERP</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-200">
                  <div className="text-2xl font-bold text-indigo-600">1500-2500</div>
                  <div className="text-xs text-indigo-700">Mots / Article</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">$0.07</div>
                  <div className="text-xs text-purple-700">Par Article (Sonar)</div>
                </div>
                <div className="bg-pink-50 rounded-lg p-3 text-center border border-pink-200">
                  <div className="text-2xl font-bold text-pink-600">2</div>
                  <div className="text-xs text-pink-700">Modèles IA</div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-500" />
                  Processus en 2 Étapes
                </h3>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                      Analyse SERP (Perplexity + Claude)
                    </div>
                    <ul className="space-y-1 text-sm text-blue-800 ml-8">
                      <li>• Recherche Google en temps réel</li>
                      <li>• Scraping des Top 10-15 résultats</li>
                      <li>• Extraction de l'intention utilisateur</li>
                      <li>• Identification des mots-clés essentiels</li>
                      <li>• Analyse de la structure qui fonctionne</li>
                      <li>• Création d'un brief structuré</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border-l-4 border-indigo-500">
                    <div className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                      Rédaction SEO (Claude Sonnet)
                    </div>
                    <ul className="space-y-1 text-sm text-indigo-800 ml-8">
                      <li>• Article complet 1500-2500 mots</li>
                      <li>• Respecte TOUTE l'analyse SERP</li>
                      <li>• Structure H1/H2/H3 optimisée</li>
                      <li>• Mots-clés naturellement intégrés</li>
                      <li>• Strong tags stratégiques (2-4 par section)</li>
                      <li>• Ton adapté à l'audience cible</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Modèles IA Utilisés
                </h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>🔍 <strong>Perplexity Sonar</strong> (modèle: "sonar") - Recherche et analyse SERP en temps réel</div>
                  <div>🤖 <strong>Claude Sonnet 4.5</strong> - Analyse du brief + Rédaction de l'article</div>
                  <div className="text-xs text-blue-600 mt-2">⚡ Modèles mis à jour Novembre 2025 - Sonnet 4.5 = Meilleure qualité SEO !</div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">💡 Pourquoi Perplexity ?</h4>
                <p className="text-sm text-green-800 mb-2">
                  Claude seul ne peut pas accéder à Internet. Perplexity agit comme "les yeux de l'IA sur Google" :
                </p>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>✅ Voit ce qui ranke <strong>aujourd'hui</strong></li>
                  <li>✅ Comprend l'intention utilisateur réelle</li>
                  <li>✅ Identifie les sujets obligatoires</li>
                  <li>✅ Garantit un article compétitif</li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">⚡ Règles SEO</h4>
                <ul className="space-y-1 text-sm text-purple-800">
                  <li>• H1 unique avec mot-clé principal</li>
                  <li>• 5-8 sections H2 (60% avec keyword)</li>
                  <li>• Keyword density 1-2%</li>
                  <li>• Paragraphes 60-120 mots</li>
                  <li>• Pas de mots marketing interdits</li>
                  <li>• HTML pur prêt à publier</li>
                </ul>
              </div>

              {/* Accordéons Détaillés */}
              <div className="space-y-3 mt-6">
                
                {/* Accordéon Coûts Détaillés */}
                <div className="border-2 border-purple-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('costs')}
                    className="w-full p-4 bg-gradient-to-r from-purple-50 to-pink-50 flex items-center justify-between hover:from-purple-100 hover:to-pink-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      <span className="font-bold text-purple-900">💰 Coûts Détaillés par Article</span>
                    </div>
                    {openAccordions['costs'] ? <ChevronUp className="w-5 h-5 text-purple-600" /> : <ChevronDown className="w-5 h-5 text-purple-600" />}
                  </button>
                  {openAccordions['costs'] && (
                    <div className="p-4 bg-white space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h5 className="font-bold text-blue-900 mb-3">Coût Total par Article</h5>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-blue-200">
                              <th className="text-left py-2 text-blue-900">Étape</th>
                              <th className="text-right py-2 text-blue-900">Sonar</th>
                              <th className="text-right py-2 text-blue-900">Sonar Pro</th>
                            </tr>
                          </thead>
                          <tbody className="text-blue-800">
                            <tr className="border-b border-blue-100">
                              <td className="py-2">Perplexity SERP</td>
                              <td className="text-right font-semibold">$0.0105</td>
                              <td className="text-right font-semibold">$0.0415</td>
                            </tr>
                            <tr className="border-b border-blue-50 text-xs">
                              <td className="py-1 pl-4 text-blue-600">↳ Tokens</td>
                              <td className="text-right text-blue-600">$0.0025</td>
                              <td className="text-right text-blue-600">$0.0315</td>
                            </tr>
                            <tr className="border-b border-blue-100 text-xs">
                              <td className="py-1 pl-4 text-blue-600">↳ Frais requête</td>
                              <td className="text-right text-blue-600">$0.008</td>
                              <td className="text-right text-blue-600">$0.010</td>
                            </tr>
                            <tr className="border-b border-blue-100">
                              <td className="py-2">Claude Analyse</td>
                              <td className="text-right font-semibold">$0.0225</td>
                              <td className="text-right font-semibold">$0.0225</td>
                            </tr>
                            <tr className="border-b border-blue-100">
                              <td className="py-2">Claude Rédaction</td>
                              <td className="text-right font-semibold">$0.0345</td>
                              <td className="text-right font-semibold">$0.0345</td>
                            </tr>
                            <tr className="bg-blue-100 font-bold">
                              <td className="py-2">TOTAL</td>
                              <td className="text-right text-green-900">$0.0675</td>
                              <td className="text-right text-purple-900">$0.0985</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h5 className="font-bold text-green-900 mb-3">Pour 50 Articles</h5>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-green-200">
                              <th className="text-left py-2 text-green-900">Modèle</th>
                              <th className="text-right py-2 text-green-900">SERP</th>
                              <th className="text-right py-2 text-green-900">Rédaction</th>
                              <th className="text-right py-2 text-green-900">Total</th>
                            </tr>
                          </thead>
                          <tbody className="text-green-800">
                            <tr className="border-b border-green-100">
                              <td className="py-2 font-semibold">Sonar Standard ✅</td>
                              <td className="text-right">$0.53</td>
                              <td className="text-right">$2.98</td>
                              <td className="text-right font-bold text-green-900">$3.50</td>
                            </tr>
                            <tr className="bg-green-100">
                              <td className="py-2 font-semibold">Sonar Pro</td>
                              <td className="text-right">$2.08</td>
                              <td className="text-right">$2.98</td>
                              <td className="text-right font-bold text-purple-900">$5.06</td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="mt-3 text-xs text-green-700 bg-white rounded p-2">
                          💡 <strong>Différence :</strong> Sonar Pro coûte $1.56 de plus pour 50 articles (+45%)
                        </div>
                      </div>

                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <h5 className="font-bold text-amber-900 mb-2">📊 Répartition des Coûts (Sonar Standard)</h5>
                        <div className="space-y-2 text-sm text-amber-800">
                          <div className="flex justify-between">
                            <span>Perplexity SERP:</span>
                            <span className="font-semibold">15% ($0.53)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Claude Analyse:</span>
                            <span className="font-semibold">32% ($1.13)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Claude Rédaction:</span>
                            <span className="font-semibold">49% ($1.73)</span>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-amber-700 bg-white rounded p-2">
                          ⚡ <strong>Le vrai coût c'est Claude Sonnet (88% du total) !</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordéon Comparaison Modèles */}
                <div className="border-2 border-indigo-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('models')}
                    className="w-full p-4 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between hover:from-indigo-100 hover:to-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-indigo-600" />
                      <span className="font-bold text-indigo-900">🔍 Sonar vs Sonar Pro - Comparaison Détaillée</span>
                    </div>
                    {openAccordions['models'] ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5 text-indigo-600" />}
                  </button>
                  {openAccordions['models'] && (
                    <div className="p-4 bg-white space-y-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-indigo-200">
                            <th className="text-left py-2 text-indigo-900">Aspect</th>
                            <th className="text-center py-2 text-indigo-900">Sonar</th>
                            <th className="text-center py-2 text-purple-900">Sonar Pro</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-indigo-100">
                            <td className="py-2 font-semibold text-gray-900">Pages visitées</td>
                            <td className="text-center text-indigo-700">Top 10-15</td>
                            <td className="text-center text-purple-700">Top 10-15 ✓</td>
                          </tr>
                          <tr className="border-b border-indigo-100">
                            <td className="py-2 font-semibold text-gray-900">Scraping</td>
                            <td className="text-center text-indigo-700">Complet</td>
                            <td className="text-center text-purple-700">Complet ✓</td>
                          </tr>
                          <tr className="border-b border-indigo-100">
                            <td className="py-2 font-semibold text-gray-900">Citations</td>
                            <td className="text-center text-indigo-700">Oui</td>
                            <td className="text-center text-purple-700">Oui ✓</td>
                          </tr>
                          <tr className="border-b border-indigo-100">
                            <td className="py-2 font-semibold text-gray-900">Questions reliées</td>
                            <td className="text-center text-indigo-700">Oui</td>
                            <td className="text-center text-purple-700">Oui ✓</td>
                          </tr>
                          <tr className="border-b border-indigo-100">
                            <td className="py-2 font-semibold text-gray-900">Temps réel</td>
                            <td className="text-center text-indigo-700">Oui</td>
                            <td className="text-center text-purple-700">Oui ✓</td>
                          </tr>
                          <tr className="border-b border-indigo-100">
                            <td className="py-2 font-semibold text-gray-900">Qualité analyse</td>
                            <td className="text-center text-indigo-700">Bonne (90%)</td>
                            <td className="text-center text-purple-700">Excellente (95%)</td>
                          </tr>
                          <tr className="border-b border-indigo-100">
                            <td className="py-2 font-semibold text-gray-900">Nuances</td>
                            <td className="text-center text-indigo-700">Standard</td>
                            <td className="text-center text-purple-700">Plus fines</td>
                          </tr>
                          <tr className="bg-indigo-50">
                            <td className="py-2 font-bold text-gray-900">Prix (50 articles)</td>
                            <td className="text-center font-bold text-green-700">$5.20</td>
                            <td className="text-center font-bold text-orange-700">$6.10</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h5 className="font-bold text-blue-900 mb-2">✅ Recommandation</h5>
                        <p className="text-sm text-blue-800 mb-2">
                          <strong>Commencez avec Sonar Standard</strong> car :
                        </p>
                        <ul className="space-y-1 text-sm text-blue-800">
                          <li>✅ Accès complet aux SERP (Top 10-15)</li>
                          <li>✅ Toutes les données nécessaires</li>
                          <li>✅ Claude Sonnet enrichit tout</li>
                          <li>✅ Qualité 90% vs 95% (différence minime)</li>
                          <li>✅ 5× moins cher que Sonar Pro</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordéon Fonctionnalités Avancées */}
                <div className="border-2 border-green-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('features')}
                    className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between hover:from-green-100 hover:to-emerald-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-green-600" />
                      <span className="font-bold text-green-900">⚡ Fonctionnalités Perplexity Intégrées</span>
                    </div>
                    {openAccordions['features'] ? <ChevronUp className="w-5 h-5 text-green-600" /> : <ChevronDown className="w-5 h-5 text-green-600" />}
                  </button>
                  {openAccordions['features'] && (
                    <div className="p-4 bg-white space-y-3">
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-2">🔍 Paramètres de Recherche</h5>
                        <ul className="space-y-1 text-sm text-green-800">
                          <li>• <strong>search_recency_filter:</strong> "day", "week", "month", "year"</li>
                          <li>• <strong>search_domain_filter:</strong> Inclure/exclure domaines</li>
                          <li>• <strong>search_mode:</strong> "web" ou "academic"</li>
                          <li>• <strong>return_images:</strong> URLs d'images pertinentes</li>
                          <li>• <strong>return_related_questions:</strong> Questions connexes</li>
                        </ul>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <h5 className="font-semibold text-blue-900 mb-2">📊 Données Enrichies Extraites</h5>
                        <ul className="space-y-1 text-sm text-blue-800">
                          <li>• <strong>Citations:</strong> Top 10-15 sources utilisées</li>
                          <li>• <strong>Questions reliées:</strong> Ce que les utilisateurs demandent</li>
                          <li>• <strong>Images:</strong> URLs d'images (si activé)</li>
                          <li>• <strong>Compteurs:</strong> Nombre total de chaque type</li>
                        </ul>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <h5 className="font-semibold text-purple-900 mb-2">🎯 Intégration dans le Workflow</h5>
                        <div className="space-y-2 text-sm text-purple-800">
                          <div><strong>1. Perplexity</strong> → Recherche + Extrait données</div>
                          <div><strong>2. Claude (Analyse)</strong> → Structure le brief avec citations + questions</div>
                          <div><strong>3. Claude (Rédaction)</strong> → Article complet optimisé</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6">
              <div className="flex items-center gap-3 text-white">
                <Sparkles className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">⚙️ Configuration & APIs</h2>
                  <p className="text-gray-300">Clés API requises pour utiliser EcomFarm</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-2">🤖 Claude (Anthropic)</h4>
                  <p className="text-sm text-purple-800 mb-2">
                    <strong>Obligatoire</strong> - Utilisé partout
                  </p>
                  <a 
                    href="https://console.anthropic.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:underline"
                  >
                    → console.anthropic.com
                  </a>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-2">👁️ Gemini (Google)</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Optionnel</strong> - Fiches Produits uniquement
                  </p>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    → aistudio.google.com/app/apikey
                  </a>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                  <h4 className="font-bold text-indigo-900 mb-2">🔍 Perplexity</h4>
                  <p className="text-sm text-indigo-800 mb-2">
                    <strong>Optionnel</strong> - Articles de Blog uniquement
                  </p>
                  <a 
                    href="https://www.perplexity.ai/settings/api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    → perplexity.ai/settings/api
                  </a>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <h4 className="font-bold text-green-900 mb-2">💰 Coûts</h4>
                  <p className="text-sm text-green-800">
                    Pay-as-you-go - Vous payez uniquement ce que vous utilisez
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
              <div className="flex items-center gap-3 text-white">
                <Globe className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">🌍 Langues Supportées</h2>
                  <p className="text-indigo-100">14 langues pour vos contenus SEO</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  "🇫🇷 Français",
                  "🇬🇧 Anglais",
                  "🇪🇸 Espagnol",
                  "🇩🇪 Allemand",
                  "🇮🇹 Italien",
                  "🇵🇹 Portugais",
                  "🇳🇱 Néerlandais",
                  "🇵🇱 Polonais",
                  "🇷🇺 Russe",
                  "🇯🇵 Japonais",
                  "🇨🇳 Chinois",
                  "🇰🇷 Coréen",
                  "🇸🇦 Arabe",
                  "🇮🇳 Hindi"
                ].map((lang) => (
                  <div key={lang} className="bg-indigo-50 rounded-lg p-3 text-center text-sm font-medium text-indigo-900 border border-indigo-200">
                    {lang}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer CTA */}
        <div className="mt-8 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-xl shadow-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">🚀 Prêt à optimiser votre SEO ?</h3>
          <p className="text-purple-100 mb-4">
            Configurez vos clés API dans les Paramètres et commencez à générer du contenu optimisé !
          </p>
          <a
            href="/parametres"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-purple-50 transition-colors shadow-lg"
          >
            Configurer maintenant
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
