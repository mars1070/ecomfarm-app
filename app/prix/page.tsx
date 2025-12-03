"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { DollarSign, Upload, Download, Play, FileText, Plus, Trash2 } from "lucide-react";

interface PriceProduct {
  rowIndex: number;
  originalPrice: number;
  newPrice: number;
  appliedRule?: string;
  [key: string]: any;
}

interface PriceRule {
  id: string;
  minPrice: number;
  maxPrice: number;
  multiplier: number;
}

export default function PricePage() {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [products, setProducts] = useState<PriceProduct[]>([]);
  const [priceColumnIndex, setPriceColumnIndex] = useState<number>(0);
  const [endingPrice, setEndingPrice] = useState<string>("9.90");
  const [smartRounding, setSmartRounding] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Price rules (tranches)
  const [priceRules, setPriceRules] = useState<PriceRule[]>([
    { id: "1", minPrice: 0, maxPrice: 20, multiplier: 4 },
    { id: "2", minPrice: 20, maxPrice: 60, multiplier: 2.5 },
    { id: "3", minPrice: 60, maxPrice: 10000, multiplier: 2 },
  ]);

  // Handle CSV file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        console.log(`✅ ${results.data.length} lignes chargées`);
        
        // Auto-detect "Variant Price" column
        if (results.data.length > 0) {
          const firstRow = results.data[0] as Record<string, any>;
          const columns = Object.keys(firstRow);
          const variantPriceIndex = columns.findIndex(col => 
            col.toLowerCase().includes('variant') && col.toLowerCase().includes('price')
          );
          if (variantPriceIndex !== -1) {
            setPriceColumnIndex(variantPriceIndex);
            console.log(`✅ Colonne "Variant Price" détectée automatiquement`);
          }
        }
      },
      error: (error) => {
        console.error("Erreur lors de la lecture du CSV:", error);
        alert("Erreur lors de la lecture du fichier CSV");
      },
    });
  };

  // Get available columns from CSV
  const availableColumns = csvData.length > 0 ? Object.keys(csvData[0]) : [];

  // Add new price rule
  const addPriceRule = () => {
    const newId = (Math.max(...priceRules.map(r => parseInt(r.id))) + 1).toString();
    setPriceRules([...priceRules, {
      id: newId,
      minPrice: 0,
      maxPrice: 100,
      multiplier: 2,
    }]);
  };

  // Remove price rule
  const removePriceRule = (id: string) => {
    if (priceRules.length > 1) {
      setPriceRules(priceRules.filter(r => r.id !== id));
    }
  };

  // Update price rule
  const updatePriceRule = (id: string, field: keyof PriceRule, value: number) => {
    setPriceRules(priceRules.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  // Find applicable multiplier for a price
  const findMultiplier = (price: number): { multiplier: number; rule: string } => {
    // Sort rules by minPrice to apply the first matching rule
    const sortedRules = [...priceRules].sort((a, b) => a.minPrice - b.minPrice);
    
    for (const rule of sortedRules) {
      if (price >= rule.minPrice && price < rule.maxPrice) {
        return { 
          multiplier: rule.multiplier, 
          rule: `${rule.minPrice}€-${rule.maxPrice}€ (×${rule.multiplier})`
        };
      }
    }
    
    // Default to last rule if no match
    const lastRule = sortedRules[sortedRules.length - 1];
    return { 
      multiplier: lastRule.multiplier, 
      rule: `${lastRule.minPrice}€+ (×${lastRule.multiplier})`
    };
  };

  // Smart rounding function
  const applySmartRounding = (price: number, ending: number): number => {
    const endingOnes = Math.floor(ending) % 10;
    const endingCents = ending - Math.floor(ending);
    
    // Get the tens digit
    const tens = Math.floor(price / 10) * 10;
    
    // Try rounding down first (e.g., 509.90 → 499.90)
    let roundedDown = tens + endingOnes + endingCents;
    
    // Try rounding up (e.g., 509.90 → 519.90)
    let roundedUp = tens + 10 + endingOnes + endingCents;
    
    // Calculate distances
    const distanceDown = Math.abs(price - roundedDown);
    const distanceUp = Math.abs(price - roundedUp);
    
    // Special case: Avoid X09.90, X19.90, X29.90, etc. for prices > 100€
    // Prefer X99.90, 199.90, 299.90 instead of 109.90, 209.90, 309.90
    if (price >= 100 && endingOnes === 9) {
      const hundreds = Math.floor(price / 100) * 100;
      const roundedToNinetyNine = hundreds + 99 + endingCents;
      
      // If we're close to X99.90 (within 15€), prefer it
      if (price < roundedToNinetyNine + 15) {
        return roundedToNinetyNine;
      }
    }
    
    // If rounding down is closer and not too far, use it
    // This handles cases like 509.90 → 499.90 and 20.90 → 19.90
    if (distanceDown <= distanceUp && roundedDown > 0) {
      return roundedDown;
    }
    
    return roundedUp;
  };

  // Process prices
  const processPrices = () => {
    if (csvData.length === 0) {
      alert("Veuillez d'abord importer un fichier CSV");
      return;
    }

    if (!availableColumns[priceColumnIndex]) {
      alert("Veuillez sélectionner une colonne de prix valide");
      return;
    }

    setIsProcessing(true);

    const priceColumn = availableColumns[priceColumnIndex];
    const processedProducts: PriceProduct[] = [];

    csvData.forEach((row, index) => {
      const originalPriceStr = row[priceColumn];
      if (!originalPriceStr) return;

      // Parse original price (handle different formats: 31.76, 31,76, €31.76, etc.)
      const cleanPrice = originalPriceStr
        .toString()
        .replace(/[€$£\s]/g, "")
        .replace(",", ".");
      const originalPrice = parseFloat(cleanPrice);

      if (isNaN(originalPrice)) return;

      // Find applicable multiplier based on price rules
      const { multiplier, rule } = findMultiplier(originalPrice);

      // Calculate new price with multiplier
      let newPrice = originalPrice * multiplier;

      // Apply ending price rounding
      if (endingPrice) {
        const ending = parseFloat(endingPrice);
        if (!isNaN(ending)) {
          if (smartRounding) {
            // Smart rounding (prefer rounding down when closer)
            newPrice = applySmartRounding(newPrice, ending);
          } else {
            // Standard rounding (always round up if needed)
            const endingOnes = Math.floor(ending) % 10;
            const endingCents = ending - Math.floor(ending);
            const tens = Math.floor(newPrice / 10) * 10;
            let roundedPrice = tens + endingOnes + endingCents;
            
            if (roundedPrice < newPrice) {
              roundedPrice = tens + 10 + endingOnes + endingCents;
            }
            
            newPrice = roundedPrice;
          }
        }
      }

      // Round to 2 decimals
      newPrice = Math.round(newPrice * 100) / 100;

      processedProducts.push({
        rowIndex: index,
        originalPrice,
        newPrice,
        appliedRule: rule,
        ...row,
      });
    });

    setProducts(processedProducts);
    setIsProcessing(false);
    console.log(`✅ ${processedProducts.length} prix calculés`);
  };

  // Apply prices to CSV
  const applyPrices = () => {
    if (products.length === 0) {
      alert("Veuillez d'abord calculer les nouveaux prix");
      return;
    }

    const priceColumn = availableColumns[priceColumnIndex];
    const updatedCsvData = csvData.map((row, index) => {
      const product = products.find((p) => p.rowIndex === index);
      if (product) {
        return {
          ...row,
          [priceColumn]: product.newPrice.toFixed(2),
        };
      }
      return row;
    });

    setCsvData(updatedCsvData);
    alert("✅ Prix appliqués au CSV !");
  };

  // Export CSV
  const exportCSV = () => {
    if (csvData.length === 0) {
      alert("Aucune donnée à exporter");
      return;
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `prix_modifies_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProducts = products.length;
  const totalOriginal = products.reduce((sum, p) => sum + p.originalPrice, 0);
  const totalNew = products.reduce((sum, p) => sum + p.newPrice, 0);
  const averageIncrease =
    totalProducts > 0
      ? (((totalNew - totalOriginal) / totalOriginal) * 100).toFixed(1)
      : "0";

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Modification de Prix
              </h1>
              <p className="text-gray-600">
                Modifiez vos prix en masse avec multiplicateur et arrondissement
              </p>
            </div>
          </div>
        </div>

        {/* CSV Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. Importer le fichier CSV
          </h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <Upload className="w-5 h-5" />
            Importer CSV Shopify
          </button>
          {csvData.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <FileText className="w-5 h-5" />
                <span className="font-medium">
                  {csvData.length} produits chargés
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Configuration */}
        {csvData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              2. Configuration des prix
            </h2>
            
            {/* Price Column Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Colonne des prix
              </label>
              <select
                value={priceColumnIndex}
                onChange={(e) => setPriceColumnIndex(Number(e.target.value))}
                className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {availableColumns.map((col, index) => (
                  <option key={index} value={index}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Rules */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Règles de prix (tranches)
                </label>
                <button
                  onClick={addPriceRule}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter règle
                </button>
              </div>
              <div className="space-y-3">
                {priceRules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Prix min (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={rule.minPrice}
                          onChange={(e) => updatePriceRule(rule.id, 'minPrice', Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Prix max (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={rule.maxPrice}
                          onChange={(e) => updatePriceRule(rule.id, 'maxPrice', Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Multiplicateur</label>
                        <input
                          type="number"
                          step="0.1"
                          value={rule.multiplier}
                          onChange={(e) => updatePriceRule(rule.id, 'multiplier', Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removePriceRule(rule.id)}
                      disabled={priceRules.length === 1}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Supprimer la règle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-1">💡 Exemple avec les règles par défaut :</p>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• Produit à <strong>15€</strong> → Règle 0-20€ (×4) = <strong>60€</strong></div>
                  <div>• Produit à <strong>35€</strong> → Règle 20-60€ (×2.5) = <strong>87.50€</strong></div>
                  <div>• Produit à <strong>150€</strong> → Règle 60-10000€ (×2) = <strong>300€</strong></div>
                </div>
              </div>
            </div>

            {/* Ending Price & Smart Rounding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Terminaison du prix
                </label>
                <input
                  type="text"
                  value={endingPrice}
                  onChange={(e) => setEndingPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="9.90"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ex: 9.90 → 79.90, 89.90, 99.90...
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Arrondi intelligent
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    id="smartRounding"
                    checked={smartRounding}
                    onChange={(e) => setSmartRounding(e.target.checked)}
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor="smartRounding" className="text-sm text-gray-700 cursor-pointer">
                    Activer l'arrondi intelligent
                  </label>
                </div>
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                  <div className="font-medium mb-1">✅ Arrondi intelligent activé :</div>
                  <div className="space-y-0.5 text-green-700">
                    <div>• 409.90€ → <strong>399.90€</strong> (évite X09.90)</div>
                    <div>• 109.90€ → <strong>99.90€</strong> (évite X09.90)</div>
                    <div>• 520.90€ → <strong>519.90€</strong> (plus proche)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={processPrices}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
                Calculer les nouveaux prix
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Produits</div>
              <div className="text-2xl font-bold text-gray-900">
                {totalProducts}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Total original</div>
              <div className="text-2xl font-bold text-blue-600">
                {totalOriginal.toFixed(2)}€
              </div>
            </div>
            <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Total nouveau</div>
              <div className="text-2xl font-bold text-green-600">
                {totalNew.toFixed(2)}€
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Augmentation moy.</div>
              <div className="text-2xl font-bold text-purple-600">
                +{averageIncrease}%
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        {products.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Aperçu des prix ({products.length} produits)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Prix original
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Règle
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      →
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Nouveau prix
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Différence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.slice(0, 50).map((product, index) => {
                    const difference = product.newPrice - product.originalPrice;
                    const percentChange =
                      ((difference / product.originalPrice) * 100).toFixed(1);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {product.Title || product.Handle || `Produit ${index + 1}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {product.originalPrice.toFixed(2)}€
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                            {product.appliedRule}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-gray-400">→</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                          {product.newPrice.toFixed(2)}€
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className="text-green-600 font-medium">
                            +{difference.toFixed(2)}€ (+{percentChange}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {products.length > 50 && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
                Affichage des 50 premiers produits sur {products.length}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {products.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              3. Appliquer et exporter
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={applyPrices}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <Play className="w-5 h-5" />
                Appliquer les prix au CSV
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <Download className="w-5 h-5" />
                Télécharger CSV modifié
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              💡 Cliquez d'abord sur "Appliquer" pour mettre à jour le CSV, puis
              "Télécharger" pour l'exporter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
