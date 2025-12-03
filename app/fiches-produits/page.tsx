"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Download, Pause, Play, Sparkles, FileText, ShoppingBag, RefreshCw, Store } from "lucide-react";
import Papa from "papaparse";
import ShopifyStoreSelector from '@/components/ShopifyStoreSelector';
import PublishModeSelector from '@/components/PublishModeSelector';
import type { ShopifyStore, PublishMode } from '@/types/shopify';

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

  // Shopify states
  const [selectedStore, setSelectedStore] = useState<ShopifyStore | null>(null);
  const [publishMode, setPublishMode] = useState<PublishMode>('draft');
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Planification states
  const [useScheduler, setUseScheduler] = useState(false);
  const [productsPerDay, setProductsPerDay] = useState(10);
  const [startDate, setStartDate] = useState<string>("");
  const [immediatePublish, setImmediatePublish] = useState(0);
  const [scheduledProducts, setScheduledProducts] = useState<Array<{
    product: ProcessedProduct;
    scheduledDate: Date;
  }>>([]);

  // Sync from Shopify states
  const [syncStore, setSyncStore] = useState<ShopifyStore | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataSource, setDataSource] = useState<'csv' | 'shopify' | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as ProductRow[];
        // Keep ALL rows including empty ones to preserve Shopify structure
        setCsvData(data);
        
        // Initialize processed products - only for rows with Title AND Handle
        // (lignes sans Handle = images supplémentaires, on les ignore pour le traitement)
        const products: ProcessedProduct[] = [];
        const seenHandles = new Set<string>();
        
        data.forEach((row, index) => {
          if (row.Title && row.Title.trim() && row.Handle && row.Handle.trim()) {
            // Ne traiter que la première ligne de chaque produit (avec Handle unique)
            if (!seenHandles.has(row.Handle)) {
              seenHandles.add(row.Handle);
              
              // Extract first image URL from "Image Src" column (Shopify CSV format)
              let imageUrl = "";
              if (row["Image Src"]) {
                // If multiple URLs separated by semicolon or comma, take the first one
                const urls = row["Image Src"].split(/[;,]/);
                imageUrl = urls[0].trim();
              }
              
              products.push({
                originalTitle: row.Title,
                imageUrl: imageUrl || undefined,
                newTitle: "",
                newDescription: "",
                status: "pending",
                rowIndex: index, // Keep original index to match csvData
              });
            }
          }
        });
        setProcessedProducts(products);
        setDataSource('csv');
      },
      error: (error) => {
        alert("Erreur lors de la lecture du fichier CSV: " + error.message);
      },
    });
  };

  const syncFromShopify = async () => {
    if (!syncStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    setIsSyncing(true);

    try {
      const response = await fetch('/api/shopify/sync-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: syncStore }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur de synchronisation');
      }

      const shopifyProducts = result.products || [];
      
      if (shopifyProducts.length === 0) {
        alert("⚠️ Aucun produit trouvé dans ce store");
        setIsSyncing(false);
        return;
      }

      // Convertir les produits Shopify en format CSV-like pour compatibilité
      const data: ProductRow[] = shopifyProducts.map((p: any) => ({
        Handle: p.handle || '',
        Title: p.title || '',
        'Body (HTML)': p.bodyHtml || '',
        Vendor: p.vendor || '',
        Type: p.productType || '',
        Tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
        Published: p.status === 'active' ? 'TRUE' : 'FALSE',
        'Image Src': p.images?.[0]?.src || '',
        'Variant SKU': p.variants?.[0]?.sku || '',
        'Variant Price': p.variants?.[0]?.price || '',
        'Variant Compare At Price': p.variants?.[0]?.compare_at_price || '',
        'Variant Inventory Qty': p.variants?.[0]?.inventory_quantity?.toString() || '',
        'Option1 Name': p.options?.[0]?.name || '',
        'Option1 Value': p.variants?.[0]?.option1 || '',
        'Option2 Name': p.options?.[1]?.name || '',
        'Option2 Value': p.variants?.[0]?.option2 || '',
        'Option3 Name': p.options?.[2]?.name || '',
        'Option3 Value': p.variants?.[0]?.option3 || '',
        // Stocker l'ID Shopify pour les mises à jour
        '_shopify_id': p.id || '',
      }));

      setCsvData(data);

      // Créer les produits à traiter
      const products: ProcessedProduct[] = data.map((row, index) => ({
        originalTitle: row.Title,
        imageUrl: row['Image Src'] || undefined,
        newTitle: "",
        newDescription: "",
        status: "pending" as const,
        rowIndex: index,
      }));

      setProcessedProducts(products);
      setDataSource('shopify');
      
      alert(`✅ ${shopifyProducts.length} produit(s) synchronisé(s) depuis ${syncStore.name || syncStore.shopDomain}`);

    } catch (error: any) {
      console.error('❌ Erreur sync Shopify:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const processProducts = async () => {
    // Check if API keys are set
    const storedClaudeKey = localStorage.getItem("anthropic_api_key");
    const storedGeminiKey = localStorage.getItem("google_gemini_api_key");
    
    // Si on utilise les images, Gemini génère TITRE + DESCRIPTION (pas besoin de Claude)
    if (useImageForTitle && !storedGeminiKey) {
      alert("Veuillez configurer votre clé API Google Gemini dans les Paramètres pour utiliser la génération depuis images");
      return;
    }

    // Si on n'utilise PAS les images, Claude est nécessaire pour générer le contenu
    // Claude sert aussi de fallback si Gemini échoue
    if (!useImageForTitle && !storedClaudeKey) {
      alert("Veuillez configurer votre clé API Claude dans les Paramètres");
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    pauseRef.current = false;

    // Filter only pending products (not yet processed)
    const pendingProducts = processedProducts.filter(p => p.status === "pending");
    
    if (pendingProducts.length === 0) {
      alert("Tous les produits ont déjà été traités !");
      setIsProcessing(false);
      return;
    }

    console.log(`🔄 Processing ${pendingProducts.length} pending products out of ${processedProducts.length} total`);

    // Process pending products in batches
    const totalBatches = Math.ceil(pendingProducts.length / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // Check if paused
      if (pauseRef.current) {
        setIsPaused(true);
        setIsProcessing(false);
        return;
      }

      setCurrentBatch(batchIndex + 1);
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, pendingProducts.length);
      const batch = pendingProducts.slice(start, end);

      // Get the row indices of products in this batch
      const batchRowIndices = batch.map(p => p.rowIndex);

      // Mark batch as processing
      setProcessedProducts(prev => 
        prev.map((p) => 
          batchRowIndices.includes(p.rowIndex) ? { ...p, status: "processing" } : p
        )
      );

      try {
        // Process batch in parallel - use rowIndex as identifier
        const batchData = batch.map((p) => ({
          originalTitle: p.originalTitle,
          imageUrl: p.imageUrl,
          index: p.rowIndex, // Use rowIndex to identify the product
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
            const productIndex = result.index;
            const product = processedProducts.find((p) => p.rowIndex === productIndex);

            if (!product) return;

            setProcessedProducts(prev => 
              prev.map((p) => 
                p.rowIndex === productIndex ? { 
                  ...p, 
                  newTitle: result.newTitle || p.newTitle, 
                  newDescription: result.description || p.newDescription,
                  status: "completed" 
                } : p
              )
            );

            // Mettre à jour csvData à la BONNE ligne (rowIndex du produit)
            setCsvData(prev => 
              prev.map((row, idx) => {
                if (idx === product.rowIndex) {
                  const updates: any = { ...row };
                  if (generationMode === "both" || generationMode === "title") {
                    updates.Title = result.newTitle;
                  }
                  if (generationMode === "both" || generationMode === "description") {
                    updates["Body (HTML)"] = result.description; // Replace Body (HTML) with new description
                  }
                  return updates;
                }
                return row;
              })
            );
          } else {
            setProcessedProducts(prev => 
              prev.map((p) => 
                p.rowIndex === result.index ? { ...p, status: "error" } : p
              )
            );
          }
        });

      } catch (error: any) {
        console.error("Error processing batch:", error);
        const errorMsg = error?.message || "Erreur lors du traitement";
        setErrorMessage(errorMsg);
        
        // Mark batch as error using rowIndex
        setProcessedProducts(prev => 
          prev.map((p) => 
            batchRowIndices.includes(p.rowIndex) ? { ...p, status: "error" } : p
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
    
    // Si on utilise les images, Gemini génère TITRE + DESCRIPTION (pas besoin de Claude)
    if (useImageForTitle && !storedGeminiKey) {
      alert("Veuillez configurer votre clé API Google Gemini dans les Paramètres pour utiliser la génération depuis images");
      return;
    }

    // Si on n'utilise PAS les images, Claude est nécessaire pour générer le contenu
    // Claude sert aussi de fallback si Gemini échoue
    if (!useImageForTitle && !storedClaudeKey) {
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

  // Préparer les données complètes du produit depuis le CSV
  const prepareProductData = (product: ProcessedProduct) => {
    const originalRow = csvData[product.rowIndex];
    let productHandle = originalRow?.Handle;
    
    // Si pas de Handle, le générer depuis le titre
    if (!productHandle || !productHandle.trim()) {
      productHandle = product.newTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    // Collecter toutes les images
    const allImages: { src: string }[] = [];
    if (originalRow?.Handle && csvData.length > 0) {
      csvData.forEach(row => {
        if (row.Handle === originalRow.Handle && row['Image Src'] && row['Image Src'].trim()) {
          allImages.push({ src: row['Image Src'].trim() });
        }
      });
    }
    if (allImages.length === 0 && product.imageUrl) {
      allImages.push({ src: product.imageUrl });
    }
    
    // Collecter toutes les variantes
    const variants: any[] = [];
    if (originalRow?.Handle && csvData.length > 0) {
      csvData.forEach(row => {
        if (row.Handle === originalRow.Handle || (!row.Handle && row['Variant SKU'])) {
          if (row['Variant SKU'] || row['Option1 Value']) {
            variants.push({
              sku: row['Variant SKU'] || '',
              price: row['Variant Price'] || originalRow['Variant Price'] || '0',
              compare_at_price: row['Variant Compare At Price'] || '',
              inventory_quantity: row['Variant Inventory Qty'] || 0,
              inventory_policy: row['Variant Inventory Policy'] || 'deny',
              fulfillment_service: row['Variant Fulfillment Service'] || 'manual',
              weight: row['Variant Grams'] ? parseFloat(row['Variant Grams']) / 1000 : 0,
              weight_unit: 'kg',
              option1: row['Option1 Value'] || null,
              option2: row['Option2 Value'] || null,
              option3: row['Option3 Value'] || null,
            });
          }
        }
      });
    }
    
    return {
      title: product.newTitle,
      body_html: product.newDescription,
      handle: productHandle,
      vendor: originalRow?.Vendor || productNiche || "EcomFarm",
      product_type: originalRow?.Type || productNiche || '',
      tags: originalRow?.Tags || '',
      published: originalRow?.Published === 'TRUE' || originalRow?.Published === 'true',
      options: [
        originalRow?.['Option1 Name'] ? { name: originalRow['Option1 Name'], values: [] } : null,
        originalRow?.['Option2 Name'] ? { name: originalRow['Option2 Name'], values: [] } : null,
        originalRow?.['Option3 Name'] ? { name: originalRow['Option3 Name'], values: [] } : null,
      ].filter(Boolean),
      images: allImages,
      variants: variants.length > 0 ? variants : undefined,
    };
  };

  const publishToShopify = async (product: ProcessedProduct) => {
    if (!selectedStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    if (!product.newTitle || !product.newDescription) {
      alert("⚠️ Le produit n'a pas de titre ou description à publier");
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch("/api/shopify/publish-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
          product: prepareProductData(product), // Utiliser la fonction helper
          publishMode,
          scheduledDate: publishMode === 'scheduled' ? scheduledDate : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Produit "${product.newTitle}" publié sur Shopify !`);
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur de publication: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Générer les dates de planification
  const generateScheduledDates = () => {
    if (!startDate) {
      alert("⚠️ Veuillez sélectionner une date de début");
      return;
    }

    const completedProducts = processedProducts.filter(p => p.status === "completed" && p.newTitle && p.newDescription);
    
    if (completedProducts.length === 0) {
      alert("⚠️ Aucun produit complété à planifier");
      return;
    }

    const scheduled: Array<{ product: ProcessedProduct; scheduledDate: Date }> = [];
    const start = new Date(startDate);
    
    // Produits à publier immédiatement
    const immediateProducts = completedProducts.slice(0, immediatePublish);
    const scheduledProductsData = completedProducts.slice(immediatePublish);

    // Publier immédiatement
    immediateProducts.forEach((product, index) => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + index * 2); // 2 min d'écart
      
      scheduled.push({ product, scheduledDate: now });
    });

    // Planifier les autres
    scheduledProductsData.forEach((product, index) => {
      const dayOffset = Math.floor(index / productsPerDay);
      const productDate = new Date(start);
      productDate.setDate(productDate.getDate() + dayOffset);
      
      // Ajouter un intervalle aléatoire entre 20-24h (en minutes)
      const baseMinutes = (index % productsPerDay) * (24 * 60 / productsPerDay);
      const randomOffset = Math.random() * 240 - 120; // ±2h de variation
      const totalMinutes = baseMinutes + randomOffset;
      
      productDate.setHours(0, 0, 0, 0);
      productDate.setMinutes(totalMinutes);
      
      scheduled.push({ product, scheduledDate: productDate });
    });

    // Trier par date
    scheduled.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    setScheduledProducts(scheduled);
    
    const totalDays = Math.ceil(scheduledProductsData.length / productsPerDay);
    const lastDate = scheduled[scheduled.length - 1].scheduledDate;
    
    alert(`✅ Planning généré !\n\n📊 ${scheduled.length} produits\n🚀 ${immediatePublish} immédiat(s)\n📅 ${scheduledProductsData.length} planifié(s) sur ${totalDays} jours\n📌 Dernier : ${lastDate.toLocaleDateString('fr-FR')} à ${lastDate.toLocaleTimeString('fr-FR')}`);
  };

  const publishAllToShopify = async () => {
    if (!selectedStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    const completedProducts = processedProducts.filter(p => p.status === "completed" && p.newTitle && p.newDescription);
    
    if (completedProducts.length === 0) {
      alert("⚠️ Aucun produit complété à publier");
      return;
    }

    // Si mode planification activé
    if (useScheduler && publishMode === 'scheduled') {
      if (scheduledProducts.length === 0) {
        alert("⚠️ Veuillez d'abord générer le planning");
        return;
      }
      
      if (!confirm(`Publier ${scheduledProducts.length} produit(s) avec planification automatique ?`)) {
        return;
      }
    } else {
      if (!confirm(`Publier ${completedProducts.length} produit(s) sur Shopify ?`)) {
        return;
      }
    }

    setIsPublishing(true);
    let successCount = 0;
    let errorCount = 0;

    // Utiliser les produits planifiés si mode scheduler activé
    const productsToPublish = useScheduler && publishMode === 'scheduled' 
      ? scheduledProducts 
      : completedProducts.map(p => ({ product: p, scheduledDate: new Date() }));

    for (const item of productsToPublish) {
      const product = 'product' in item ? item.product : item;
      const schedDate = 'scheduledDate' in item ? item.scheduledDate : undefined;
      
      try {
        const response = await fetch("/api/shopify/publish-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store: selectedStore,
            product: prepareProductData(product), // Utiliser la fonction helper
            publishMode,
            scheduledDate: publishMode === 'scheduled' && schedDate ? schedDate.toISOString() : undefined,
          }),
        });

        const result = await response.json();

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }

        // Petit délai entre chaque publication
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        errorCount++;
      }
    }

    setIsPublishing(false);
    alert(`Publication terminée !\n✅ ${successCount} réussi(s)\n❌ ${errorCount} erreur(s)`);
  };

  // Function to retry failed products
  const retryErrors = () => {
    const errorProducts = processedProducts.filter(p => p.status === "error");
    if (errorProducts.length === 0) {
      alert("Aucun produit en erreur à régénérer !");
      return;
    }
    
    // Reset error products to pending
    setProcessedProducts(prev =>
      prev.map(p => p.status === "error" ? { ...p, status: "pending" } : p)
    );
    
    console.log(`🔄 ${errorProducts.length} produit(s) en erreur remis en attente`);
  };

  // Calculate statistics
  const completedCount = processedProducts.filter(p => p.status === "completed").length;
  const errorCount = processedProducts.filter(p => p.status === "error").length;
  const pendingCount = processedProducts.filter(p => p.status === "pending").length;
  const totalCount = processedProducts.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  // Claude Haiku 4.5 pricing: $1/M input + $5/M output
  // Average per product: ~150 input tokens + ~95 output tokens = $0.000625
  // With Gemini image: +$0.000075 = $0.0007 total
  const estimatedCost = useImageForTitle 
    ? (totalCount * 0.0007).toFixed(2) 
    : (totalCount * 0.000625).toFixed(2);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fiches Produits</h1>
              <p className="text-gray-600">
                Optimisez vos titres et descriptions produits avec l'IA
              </p>
            </div>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4 bg-green-50">
              <div className="text-sm text-gray-600 mb-1">✅ Traités</div>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4 bg-blue-50">
              <div className="text-sm text-gray-600 mb-1">⏳ En attente</div>
              <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
            </div>
            {errorCount > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 bg-red-50">
                <div className="text-sm text-gray-600 mb-1">❌ Erreurs</div>
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              </div>
            )}
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

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Source de données */}
          {csvData.length === 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Source des produits
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Synchroniser depuis Shopify */}
                <div className="border-2 border-blue-200 rounded-xl p-5 bg-blue-50/50">
                  <h3 className="text-base font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Synchroniser depuis Shopify
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Récupérer les produits directement depuis votre store
                  </p>
                  
                  <div className="mb-4">
                    <ShopifyStoreSelector 
                      onStoreSelect={setSyncStore}
                      selectedStoreId={syncStore?.id}
                    />
                  </div>
                  
                  <button
                    onClick={syncFromShopify}
                    disabled={!syncStore || isSyncing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Synchronisation...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Synchroniser les produits
                      </>
                    )}
                  </button>
                </div>

                {/* Option 2: Importer CSV */}
                <div className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50/50">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Importer un fichier CSV
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Format Shopify avec colonne "Title" requise
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-md font-medium"
                  >
                    <Upload className="w-5 h-5" />
                    Sélectionner un fichier CSV
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  {dataSource === 'shopify' ? (
                    <>
                      <Store className="w-5 h-5 text-blue-600" />
                      Produits depuis {syncStore?.name || syncStore?.shopDomain}
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 text-gray-600" />
                      Produits importés depuis CSV
                    </>
                  )}
                </h2>
                <p className="text-sm text-gray-600">
                  {totalCount} produit(s) chargé(s) • {completedCount} traité(s) • {pendingCount} en attente
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
                {csvData.length > 0 && (
                  <>
                  {!isProcessing && !isPaused && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={processProducts}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
                      >
                        <Play className="w-5 h-5" />
                        {pendingCount > 0 ? `Lancer (${pendingCount} restant${pendingCount > 1 ? 's' : ''})` : 'Lancer l\'Optimisation IA'}
                      </button>
                      {errorCount > 0 && (
                        <button
                          onClick={retryErrors}
                          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg font-medium"
                          title={`Régénérer ${errorCount} produit(s) en erreur`}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Régénérer erreurs ({errorCount})
                        </button>
                      )}
                    </div>
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
          )}
        </div>

        {/* Shopify Publication Section */}
        {completedCount > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-green-600" />
              Publication sur Shopify
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Store Selector */}
              <ShopifyStoreSelector 
                onStoreSelect={setSelectedStore}
                selectedStoreId={selectedStore?.id}
              />

              {/* Publish Mode Selector */}
              {selectedStore && (
                <div>
                  <PublishModeSelector 
                    onModeChange={(mode, date) => {
                      setPublishMode(mode);
                      if (date) setScheduledDate(date);
                    }}
                    defaultMode={publishMode}
                  />
                </div>
              )}
            </div>

            {/* Planification Automatique */}
            {selectedStore && publishMode === 'scheduled' && (
              <div className="bg-white border-2 border-blue-200 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="useScheduler"
                    checked={useScheduler}
                    onChange={(e) => setUseScheduler(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="useScheduler" className="text-lg font-bold text-gray-900 cursor-pointer">
                    🗓️ Planification Automatique
                  </label>
                </div>

                {useScheduler && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          📅 Date de début
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          📊 Produits par jour
                        </label>
                        <input
                          type="number"
                          value={productsPerDay}
                          onChange={(e) => setProductsPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          max="100"
                          className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🚀 Publication immédiate
                        </label>
                        <input
                          type="number"
                          value={immediatePublish}
                          onChange={(e) => setImmediatePublish(Math.max(0, Math.min(completedCount, parseInt(e.target.value) || 0)))}
                          min="0"
                          max={completedCount}
                          className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Publier maintenant (reste planifié)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={generateScheduledDates}
                      disabled={!startDate || completedCount === 0}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ⚡ Générer le Planning ({completedCount} produits)
                    </button>

                    {scheduledProducts.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          ✅ Planning généré : {scheduledProducts.length} produits
                        </p>
                        {immediatePublish > 0 && (
                          <p className="text-xs text-orange-700 mb-1">
                            🚀 {immediatePublish} produit(s) immédiat(s) • 📅 {scheduledProducts.length - immediatePublish} planifié(s) sur {Math.ceil((scheduledProducts.length - immediatePublish) / productsPerDay)} jours
                          </p>
                        )}
                        {immediatePublish === 0 && (
                          <p className="text-xs text-blue-700 mb-1">
                            📅 {scheduledProducts.length} produit(s) planifié(s) sur {Math.ceil(scheduledProducts.length / productsPerDay)} jours
                          </p>
                        )}
                        <p className="text-xs text-blue-700">
                          📌 Premier : {scheduledProducts[0].scheduledDate.toLocaleString('fr-FR')}<br/>
                          📌 Dernier : {scheduledProducts[scheduledProducts.length - 1].scheduledDate.toLocaleString('fr-FR')}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          ⏱️ Intervalle aléatoire de 20-24h entre chaque produit avec minutes variables
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Publish All Button */}
            {selectedStore && (
              <>
                <div className="flex gap-3">
                  <button
                    onClick={publishAllToShopify}
                    disabled={isPublishing || completedCount === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Publication en cours...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        Publier {completedCount} produit{completedCount > 1 ? 's' : ''} sur Shopify
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                  💡 <strong>Info :</strong> Les produits seront publiés en mode <strong>{publishMode === 'draft' ? 'Brouillon' : publishMode === 'scheduled' ? 'Programmé' : 'Actif'}</strong>
                  {publishMode === 'scheduled' && useScheduler && scheduledProducts.length > 0 && (
                    <span className="text-blue-600 font-semibold"> avec planification automatique sur {Math.ceil(scheduledProducts.length / productsPerDay)} jours</span>
                  )}
                  {publishMode === 'scheduled' && !useScheduler && scheduledDate && ` le ${new Date(scheduledDate).toLocaleDateString('fr-FR')}`}
                </div>
              </>
            )}
          </div>
        )}

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
