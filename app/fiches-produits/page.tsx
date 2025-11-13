"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Download, Pause, Play, Sparkles } from "lucide-react";
import Papa from "papaparse";

interface ProductRow {
  [key: string]: string;
  Title: string;
}

interface ProcessedProduct {
  originalTitle: string;
  imageUrl?: string;
  newTitle: string;
  newDescription: string;
  status: "pending" | "processing" | "completed" | "error";
  rowIndex: number;
}

export default function FichesProduits() {
  const [csvData, setCsvData] = useState<ProductRow[]>([]);
  const [processedProducts, setProcessedProducts] = useState<ProcessedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [generationMode, setGenerationMode] = useState<"both" | "title" | "description">("both");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [useImageForTitle, setUseImageForTitle] = useState(true);
  const [productNiche, setProductNiche] = useState("");
  const [useCustomTitlePrompt, setUseCustomTitlePrompt] = useState(false);
  const [customTitlePrompt, setCustomTitlePrompt] = useState("");
  const [useCustomDescPrompt, setUseCustomDescPrompt] = useState(false);
  const [customDescPrompt, setCustomDescPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pauseRef = useRef(false);
  const BATCH_SIZE = 5; // Process 5 products at a time

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as ProductRow[];
        setCsvData(data.filter(row => row.Title)); // Filter out empty rows
        
        // Initialize processed products
        const products: ProcessedProduct[] = data
          .filter(row => row.Title)
          .map((row, index) => {
            // Extract first image URL from "Image Src" column (Shopify CSV format)
            let imageUrl = "";
            if (row["Image Src"]) {
              // If multiple URLs separated by semicolon or comma, take the first one
              const urls = row["Image Src"].split(/[;,]/);
              imageUrl = urls[0].trim();
            }
            
            return {
              originalTitle: row.Title,
              imageUrl: imageUrl || undefined,
              newTitle: "",
              newDescription: "",
              status: "pending",
              rowIndex: index,
            };
          });
        setProcessedProducts(products);
      },
      error: (error) => {
        alert("Erreur lors de la lecture du fichier CSV: " + error.message);
      },
    });
  };

  const processProducts = async () => {
    // Check if API keys are set
    const storedClaudeKey = localStorage.getItem("anthropic_api_key");
    const storedGeminiKey = localStorage.getItem("google_gemini_api_key");
    
    // Si on utilise les images pour les titres, on a besoin de Gemini
    if (useImageForTitle && !storedGeminiKey) {
      alert("Veuillez configurer votre clé API Google Gemini dans les Paramètres pour utiliser la génération depuis images");
      return;
    }

    // Si on génère des descriptions OU si on n'utilise pas les images pour les titres, on a besoin de Claude
    const needsClaude = (generationMode === "both" || generationMode === "description") || !useImageForTitle;
    if (needsClaude && !storedClaudeKey) {
      alert("Veuillez configurer votre clé API Claude dans les Paramètres");
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    pauseRef.current = false;

    // Process in batches of BATCH_SIZE
    const totalProducts = processedProducts.length;
    const totalBatches = Math.ceil(totalProducts / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // Check if paused
      if (pauseRef.current) {
        setIsPaused(true);
        setIsProcessing(false);
        return;
      }

      setCurrentBatch(batchIndex + 1);
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, totalProducts);
      const batch = processedProducts.slice(start, end);

      // Mark batch as processing
      setProcessedProducts(prev => 
        prev.map((p, idx) => 
          idx >= start && idx < end ? { ...p, status: "processing" } : p
        )
      );

      try {
        // Process batch in parallel
        const batchData = batch.map((p, idx) => ({
          originalTitle: p.originalTitle,
          imageUrl: p.imageUrl,
          index: start + idx,
        }));

        // Use different route if using images
        const apiRoute = useImageForTitle ? "/api/generate-batch-with-images" : "/api/generate-batch";

        const response = await fetch(apiRoute, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            products: batchData,
            claudeApiKey: storedClaudeKey,
            geminiApiKey: storedGeminiKey,
            apiKey: storedClaudeKey, // For backward compatibility with old route
            mode: generationMode,
            language: targetLanguage,
            useImageForTitle: useImageForTitle,
            productNiche: productNiche || null,
            customTitlePrompt: useCustomTitlePrompt ? customTitlePrompt : null,
            customDescPrompt: useCustomDescPrompt ? customDescPrompt : null
          }),
        });

        if (!response.ok) throw new Error("Erreur génération batch");
        const { results } = await response.json();

        // Update with results
        results.forEach((result: any) => {
          if (result.success) {
            setProcessedProducts(prev => 
              prev.map((p, idx) => 
                idx === result.index ? { 
                  ...p, 
                  newTitle: result.newTitle || p.newTitle, 
                  newDescription: result.description || p.newDescription,
                  status: "completed" 
                } : p
              )
            );

            setCsvData(prev => 
              prev.map((row, idx) => {
                if (idx === result.index) {
                  const updates: any = { ...row };
                  if (generationMode === "both" || generationMode === "title") {
                    updates.Title = result.newTitle;
                  }
                  if (generationMode === "both" || generationMode === "description") {
                    updates.Description = result.description;
                    updates["Body (HTML)"] = result.description; // Replace Body (HTML) with new description
                  }
                  return updates;
                }
                return row;
              })
            );
          } else {
            setProcessedProducts(prev => 
              prev.map((p, idx) => 
                idx === result.index ? { ...p, status: "error" } : p
              )
            );
          }
        });

      } catch (error: any) {
        console.error("Error processing batch:", error);
        const errorMsg = error?.message || "Erreur lors du traitement";
        setErrorMessage(errorMsg);
        
        // Mark batch as error
        setProcessedProducts(prev => 
          prev.map((p, idx) => 
            idx >= start && idx < end ? { ...p, status: "error" } : p
          )
        );
        
        // Clear error after 10 seconds
        setTimeout(() => setErrorMessage(""), 10000);
      }
    }

    setIsProcessing(false);
    setCurrentBatch(0);
  };

  const togglePause = () => {
    if (isProcessing && !isPaused) {
      pauseRef.current = true;
      setIsPaused(true);
    } else if (isPaused) {
      setIsPaused(false);
      resumeProcessing();
    }
  };

  const resumeProcessing = async () => {
    const storedClaudeKey = localStorage.getItem("anthropic_api_key");
    const storedGeminiKey = localStorage.getItem("google_gemini_api_key");
    
    // Si on utilise les images pour les titres, on a besoin de Gemini
    if (useImageForTitle && !storedGeminiKey) {
      alert("Veuillez configurer votre clé API Google Gemini dans les Paramètres pour utiliser la génération depuis images");
      return;
    }

    // Si on génère des descriptions OU si on n'utilise pas les images pour les titres, on a besoin de Claude
    const needsClaude = (generationMode === "both" || generationMode === "description") || !useImageForTitle;
    if (needsClaude && !storedClaudeKey) {
      alert("Veuillez configurer votre clé API Claude dans les Paramètres");
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    pauseRef.current = false;

    // Find first pending product
    const firstPendingIndex = processedProducts.findIndex(p => p.status === "pending");
    if (firstPendingIndex === -1) {
      setIsProcessing(false);
      return;
    }

    const totalProducts = processedProducts.length;
    const startBatch = Math.floor(firstPendingIndex / BATCH_SIZE);
    const totalBatches = Math.ceil(totalProducts / BATCH_SIZE);

    for (let batchIndex = startBatch; batchIndex < totalBatches; batchIndex++) {
      if (pauseRef.current) {
        setIsPaused(true);
        setIsProcessing(false);
        return;
      }

      setCurrentBatch(batchIndex + 1);
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, totalProducts);
      const batch = processedProducts.slice(start, end).filter(p => p.status === "pending");

      if (batch.length === 0) continue;

      const batchIndices = batch.map(p => p.rowIndex);
      setProcessedProducts(prev => 
        prev.map((p, idx) => 
          batchIndices.includes(idx) ? { ...p, status: "processing" } : p
        )
      );

      try {
        const batchData = batch.map((p) => ({
          originalTitle: p.originalTitle,
          imageUrl: p.imageUrl,
          index: p.rowIndex,
        }));

        // Use different route if using images
        const apiRoute = useImageForTitle ? "/api/generate-batch-with-images" : "/api/generate-batch";

        const response = await fetch(apiRoute, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            products: batchData,
            claudeApiKey: storedClaudeKey,
            geminiApiKey: storedGeminiKey,
            apiKey: storedClaudeKey, // For backward compatibility
            mode: generationMode,
            language: targetLanguage,
            useImageForTitle: useImageForTitle,
            customTitlePrompt: useCustomTitlePrompt ? customTitlePrompt : null,
            customDescPrompt: useCustomDescPrompt ? customDescPrompt : null
          }),
        });

        if (!response.ok) throw new Error("Erreur génération batch");
        const { results } = await response.json();

        results.forEach((result: any) => {
          if (result.success) {
            setProcessedProducts(prev => 
              prev.map((p, idx) => 
                idx === result.index ? { 
                  ...p, 
                  newTitle: result.newTitle || p.newTitle, 
                  newDescription: result.description || p.newDescription,
                  status: "completed" 
                } : p
              )
            );

            setCsvData(prev => 
              prev.map((row, idx) => {
                if (idx === result.index) {
                  const updates: any = { ...row };
                  if (generationMode === "both" || generationMode === "title") {
                    updates.Title = result.newTitle;
                  }
                  if (generationMode === "both" || generationMode === "description") {
                    updates.Description = result.description;
                    updates["Body (HTML)"] = result.description; // Replace Body (HTML) with new description
                  }
                  return updates;
                }
                return row;
              })
            );
          } else {
            setProcessedProducts(prev => 
              prev.map((p, idx) => 
                idx === result.index ? { ...p, status: "error" } : p
              )
            );
          }
        });

      } catch (error) {
        console.error("Error processing batch:", error);
        batchIndices.forEach(idx => {
          setProcessedProducts(prev => 
            prev.map((p, i) => 
              i === idx ? { ...p, status: "error" } : p
            )
          );
        });
      }
    }

    setIsProcessing(false);
    setCurrentBatch(0);
  };

  const downloadCSV = () => {
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "produits_optimises.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics
  const completedCount = processedProducts.filter(p => p.status === "completed").length;
  const totalCount = processedProducts.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const estimatedCost = useImageForTitle 
    ? (totalCount * 0.00048).toFixed(2) 
    : (totalCount * 0.0005).toFixed(2);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fiches Produits</h1>
          <p className="mt-2 text-gray-600">
            Optimisez vos titres et descriptions produits avec l'IA
          </p>
        </div>

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => setErrorMessage("")}
                className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Statistics Panel */}
        {totalCount > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Produits importés</div>
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Traités</div>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Mode</div>
              <div className="text-lg font-semibold text-gray-900">
                {useImageForTitle ? "Images (Gemini)" : "Texte (Claude)"}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-primary/20 p-4 bg-primary/5">
              <div className="text-sm text-gray-600 mb-1">Coût estimé</div>
              <div className="text-2xl font-bold text-primary">${estimatedCost}</div>
            </div>
          </div>
        )}

        {/* Generation Mode Selection */}
        {csvData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Options de génération
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGenerationMode("both")}
                disabled={isProcessing}
                className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                  generationMode === "both"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <svg className={`w-5 h-5 ${generationMode === "both" ? "text-primary" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${generationMode === "both" ? "text-primary" : "text-gray-900"}`}>
                    Titre + Description
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Génération complète</div>
                </div>
                {generationMode === "both" && (
                  <div className="absolute top-1.5 right-1.5">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setGenerationMode("title")}
                disabled={isProcessing}
                className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                  generationMode === "title"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <svg className={`w-5 h-5 ${generationMode === "title" ? "text-primary" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${generationMode === "title" ? "text-primary" : "text-gray-900"}`}>
                    Titres
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Création de titres SEO</div>
                </div>
                {generationMode === "title" && (
                  <div className="absolute top-1.5 right-1.5">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setGenerationMode("description")}
                disabled={isProcessing}
                className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                  generationMode === "description"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <svg className={`w-5 h-5 ${generationMode === "description" ? "text-primary" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${generationMode === "description" ? "text-primary" : "text-gray-900"}`}>
                    Descriptions
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Rédaction SEO longue</div>
                </div>
                {generationMode === "description" && (
                  <div className="absolute top-1.5 right-1.5">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>

            {/* Image-based Title Generation Toggle */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setUseImageForTitle(!useImageForTitle)}
                disabled={isProcessing}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border-2 transition-all ${
                  useImageForTitle
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🖼️</span>
                  <div className="text-left">
                    <div className={`text-sm font-medium ${useImageForTitle ? "text-blue-900" : "text-gray-900"}`}>
                      Générer depuis images (Gemini 2.5 Flash)
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Analyse visuelle des produits</div>
                  </div>
                </div>
                <div className={`flex-shrink-0 w-10 h-5 rounded-full transition-colors ${
                  useImageForTitle ? "bg-blue-500" : "bg-gray-300"
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${
                    useImageForTitle ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                  }`} />
                </div>
              </button>
            </div>

            {/* Niche et Langue sur la même ligne */}
            {useImageForTitle && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                  <label className="block text-sm font-semibold text-yellow-900 mb-2">
                    🌍 Langue cible
                  </label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    disabled={isProcessing}
                    className="w-full px-3 py-2.5 text-sm border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white font-medium"
                  >
                    <option value="en">Anglais</option>
                    <option value="fr">Français</option>
                    <option value="es">Espagnol</option>
                    <option value="de">Allemand</option>
                    <option value="it">Italien</option>
                    <option value="pt">Portugais</option>
                    <option value="nl">Néerlandais</option>
                    <option value="pl">Polonais</option>
                    <option value="ru">Russe</option>
                    <option value="ja">Japonais</option>
                    <option value="zh">Chinois</option>
                    <option value="ko">Coréen</option>
                    <option value="ar">Arabe</option>
                    <option value="tr">Turc</option>
                  </select>
                </div>
                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <label className="block text-sm font-semibold text-purple-900 mb-2">
                    🎯 Niche / Catégorie
                  </label>
                  <input
                    type="text"
                    value={productNiche}
                    onChange={(e) => setProductNiche(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Ex: Bijoux, Vêtements, Décoration, Jouets..."
                    className="w-full px-3 py-2.5 text-sm border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white placeholder-gray-500 font-medium"
                  />
                  <p className="text-xs text-purple-700 mt-1.5">
                    Optionnel
                  </p>
                </div>
              </div>
            )}

            {/* Custom Prompts */}
            <div className="mt-6 space-y-4">
              <div className="border-t pt-4">
                <label className="flex items-center cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={useCustomDescPrompt}
                    onChange={(e) => setUseCustomDescPrompt(e.target.checked)}
                    disabled={isProcessing}
                    className="w-4 h-4 text-primary focus:ring-primary rounded"
                  />
                  <span className="ml-2 text-sm font-semibold text-gray-900">
                    Utiliser mon propre prompt pour les descriptions
                  </span>
                </label>
                {useCustomDescPrompt && (
                  <textarea
                    value={customDescPrompt}
                    onChange={(e) => setCustomDescPrompt(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Écrivez votre prompt personnalisé pour les descriptions... Utilisez {title} pour insérer le titre du produit."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    rows={6}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Importer un fichier CSV
              </h2>
              <p className="text-sm text-gray-600">
                Format Shopify avec colonne "Title" requise
              </p>
            </div>
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              {csvData.length === 0 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer CSV
                </button>
              )}
              {csvData.length > 0 && (
                <>
                  {!isProcessing && !isPaused && (
                    <button
                      onClick={processProducts}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                      <Play className="w-5 h-5" />
                      Lancer l'Optimisation IA
                    </button>
                  )}
                  {(isProcessing || isPaused) && (
                    <>
                      <button
                        onClick={togglePause}
                        className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        {isPaused ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Reprendre
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        )}
                      </button>
                      <div className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                        {isPaused ? (
                          "En pause"
                        ) : (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Batch {currentBatch} / {Math.ceil(processedProducts.length / BATCH_SIZE)}
                          </>
                        )}
                      </div>
                    </>
                  )}
                  {completedCount > 0 && (
                    <button
                      onClick={downloadCSV}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all shadow-md hover:shadow-lg font-medium transform hover:scale-105"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger Final
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Products Table */}
        {processedProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titre Original
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nouveau Titre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {processedProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-md truncate">{product.originalTitle}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.status === "processing" && (generationMode === "both" || generationMode === "title") ? (
                          <div className="flex items-center text-blue-600">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Génération en cours...
                          </div>
                        ) : product.newTitle ? (
                          <div className="max-w-md">{product.newTitle}</div>
                        ) : (generationMode === "both" || generationMode === "title") ? (
                          <span className="text-gray-400">En attente</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.status === "processing" && (generationMode === "both" || generationMode === "description") ? (
                          <div className="flex items-center text-blue-600">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Génération en cours...
                          </div>
                        ) : product.newDescription ? (
                          <div className="max-w-lg text-xs">{product.newDescription}</div>
                        ) : (generationMode === "both" || generationMode === "description") ? (
                          <span className="text-gray-400">En attente</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.status === "completed" && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Terminé
                          </span>
                        )}
                        {product.status === "processing" && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            En cours
                          </span>
                        )}
                        {product.status === "pending" && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            En attente
                          </span>
                        )}
                        {product.status === "error" && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Erreur
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {processedProducts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun fichier importé
            </h3>
            <p className="text-gray-600">
              Importez un fichier CSV Shopify pour commencer l'optimisation
            </p>
          </div>
        )}
      </div>

      {/* Fixed Progress Notification Bubble - Bottom Right */}
      {totalCount > 0 && (isProcessing || completedCount > 0) && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`bg-gradient-to-r ${
            progressPercentage === 100 
              ? 'from-green-500 to-emerald-500' 
              : isProcessing 
                ? 'from-blue-500 to-indigo-500' 
                : 'from-gray-500 to-gray-600'
          } text-white rounded-xl shadow-lg p-4 min-w-[200px] transform transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">
                {progressPercentage === 100 ? '✓ Terminé' : isProcessing ? '⚡ En cours' : '⏸ Pause'}
              </span>
              {isProcessing && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>
            
            <div className="flex items-baseline gap-2 mb-2.5">
              <span className="text-3xl font-bold">{progressPercentage}%</span>
              <span className="text-sm opacity-75">
                {completedCount}/{totalCount}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {isProcessing && currentBatch > 0 && (
              <div className="mt-2 text-xs opacity-75">
                Batch {currentBatch} / {Math.ceil(totalCount / BATCH_SIZE)}
              </div>
            )}

            {/* Download Button when completed */}
            {progressPercentage === 100 && (
              <button
                onClick={downloadCSV}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium text-sm shadow-sm"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
