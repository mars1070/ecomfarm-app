"use client";

import { useState } from "react";
import { Calculator, Info, Zap, DollarSign, TrendingDown, CheckCircle } from "lucide-react";

export default function Tarification() {
  const [productCount, setProductCount] = useState(1000);

  // Calculate costs
  const geminiCost = (productCount * 0.00018).toFixed(2);
  const claudeTitleCost = (productCount * 0.0002).toFixed(2);
  const claudeDescCost = (productCount * 0.0003).toFixed(2);
  const totalWithGemini = (parseFloat(geminiCost) + parseFloat(claudeDescCost)).toFixed(2);
  const totalWithClaude = (parseFloat(claudeTitleCost) + parseFloat(claudeDescCost)).toFixed(2);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tarification & Informations</h1>
          <p className="text-gray-600">
            Comprenez les coûts et optimisez votre utilisation d'EcomFarm
          </p>
        </div>

        {/* Cost Calculator */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-6 mb-6">
          <div className="flex items-center mb-4">
            <Calculator className="w-6 h-6 text-primary mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Calculateur de coûts</h2>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de produits à traiter
            </label>
            <input
              type="number"
              value={productCount}
              onChange={(e) => setProductCount(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              min="1"
              step="100"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Option 1: Gemini + Claude */}
            <div className="bg-white rounded-lg p-4 border-2 border-green-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Option 1 : Images (Recommandé)</h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                  MOINS CHER
                </span>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Titres (Gemini 2.5 Flash)</span>
                  <span className="font-medium">${geminiCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Descriptions (Claude Haiku)</span>
                  <span className="font-medium">${claudeDescCost}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-green-600 text-lg">${totalWithGemini}</span>
                </div>
              </div>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Analyse automatique des images produits</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Titres SEO basés sur le visuel réel</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Le plus économique</span>
                </li>
              </ul>
            </div>

            {/* Option 2: Claude only */}
            <div className="bg-white rounded-lg p-4 border-2 border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Option 2 : Texte uniquement</h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                  STANDARD
                </span>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Titres (Claude Haiku)</span>
                  <span className="font-medium">${claudeTitleCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Descriptions (Claude Haiku)</span>
                  <span className="font-medium">${claudeDescCost}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-700 text-lg">${totalWithClaude}</span>
                </div>
              </div>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-3 h-3 text-gray-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Optimisation du titre existant</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-3 h-3 text-gray-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Prompts personnalisables</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-3 h-3 text-gray-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Pas besoin d'images</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Savings */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingDown className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-900">
                  Économie avec l'option Images :
                </span>
              </div>
              <span className="text-lg font-bold text-green-600">
                ${(parseFloat(totalWithClaude) - parseFloat(totalWithGemini)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Tables */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Gemini Pricing */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Gemini 2.5 Flash</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Input (image)</span>
                  <span className="font-mono text-sm font-medium">$0.15 / 1M tokens</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Output (texte)</span>
                  <span className="font-mono text-sm font-medium">$0.60 / 1M tokens</span>
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Analyse d'images produits</p>
                  <p>• Génération de titres SEO</p>
                  <p>• Support multilingue (14 langues)</p>
                  <p>• Rapide et économique</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="text-xs font-medium text-gray-700">
                  Coût moyen par produit : <span className="text-primary">$0.00018</span>
                </div>
              </div>
            </div>
          </div>

          {/* Claude Pricing */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-purple-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Claude 3.5 Haiku</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Input (texte)</span>
                  <span className="font-mono text-sm font-medium">$0.80 / 1M tokens</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Output (texte)</span>
                  <span className="font-mono text-sm font-medium">$4.00 / 1M tokens</span>
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Génération de titres SEO</p>
                  <p>• Descriptions style télé-achat</p>
                  <p>• Prompts personnalisables</p>
                  <p>• Qualité premium</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="text-xs font-medium text-gray-700">
                  Coût moyen par produit : <span className="text-primary">$0.0005</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Pricing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center mb-4">
            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Tarification par volume</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Volume</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Images (Gemini + Claude)</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Texte (Claude seul)</th>
                  <th className="text-right py-3 px-4 font-semibold text-green-600">Économie</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">100 produits</td>
                  <td className="py-3 px-4 text-right font-mono">$0.05</td>
                  <td className="py-3 px-4 text-right font-mono">$0.05</td>
                  <td className="py-3 px-4 text-right font-mono text-green-600">$0.00</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">500 produits</td>
                  <td className="py-3 px-4 text-right font-mono">$0.24</td>
                  <td className="py-3 px-4 text-right font-mono">$0.25</td>
                  <td className="py-3 px-4 text-right font-mono text-green-600">$0.01</td>
                </tr>
                <tr className="border-b hover:bg-gray-50 bg-green-50">
                  <td className="py-3 px-4 text-gray-700 font-medium">1,000 produits</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">$0.48</td>
                  <td className="py-3 px-4 text-right font-mono">$0.50</td>
                  <td className="py-3 px-4 text-right font-mono text-green-600 font-medium">$0.02</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">5,000 produits</td>
                  <td className="py-3 px-4 text-right font-mono">$2.40</td>
                  <td className="py-3 px-4 text-right font-mono">$2.50</td>
                  <td className="py-3 px-4 text-right font-mono text-green-600">$0.10</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700 font-medium">10,000 produits</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">$4.80</td>
                  <td className="py-3 px-4 text-right font-mono">$5.00</td>
                  <td className="py-3 px-4 text-right font-mono text-green-600 font-medium">$0.20</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">50,000 produits</td>
                  <td className="py-3 px-4 text-right font-mono">$24.00</td>
                  <td className="py-3 px-4 text-right font-mono">$25.00</td>
                  <td className="py-3 px-4 text-right font-mono text-green-600">$1.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Facturation au token</h4>
                <p className="text-xs text-blue-800">
                  Vous ne payez que pour ce que vous utilisez. Pas d'abonnement mensuel, pas de frais cachés.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Traitement rapide</h4>
                <p className="text-xs text-green-800">
                  Batch de 5 produits en parallèle. ~1000 produits traités en moins de 5 minutes.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">Qualité garantie</h4>
                <p className="text-xs text-purple-800">
                  IA de pointe (Gemini 2.5 Flash + Claude 3.5 Haiku) pour des résultats professionnels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
