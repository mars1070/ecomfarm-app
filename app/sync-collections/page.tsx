"use client";

import { useState } from "react";
import { RefreshCw, Package, CheckCircle, XCircle, Search, Filter, ArrowUpDown, FolderOpen, ShoppingBag, FileText, File, Eye, GripVertical, Save, Edit2, ExternalLink, Trash2, Sparkles } from "lucide-react";
import ShopifyStoreSelector from "@/components/ShopifyStoreSelector";
import type { ShopifyStore } from "@/types/shopify";

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  type: 'custom' | 'smart';
  productsCount: number;
  published: boolean;
  image: string | null;
  bodyHtml: string;
  products?: any[]; // List of products in this collection
}

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: string;
  variants: any[];
  images: any[];
}

interface LocalCollection {
  name: string;
  description: string;
}

type TabType = 'collections' | 'products' | 'articles' | 'pages';

export default function SyncCollectionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('collections');
  const [selectedStore, setSelectedStore] = useState<ShopifyStore | null>(null);
  
  // Collections
  const [shopifyCollections, setShopifyCollections] = useState<ShopifyCollection[]>([]);
  const [localCollections, setLocalCollections] = useState<LocalCollection[]>([]);
  const [isSyncingCollections, setIsSyncingCollections] = useState(false);
  
  // Products
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [isSyncingProducts, setIsSyncingProducts] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>('');
  
  // Popup
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [editedImages, setEditedImages] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showJsonData, setShowJsonData] = useState(false);
  const [isImageOnlyMode, setIsImageOnlyMode] = useState(false);
  const [isUpdatingHandles, setIsUpdatingHandles] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<string>('');
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  
  // Auto-assignment suggestions
  const [showSuggestionsPopup, setShowSuggestionsPopup] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [applyingAssignment, setApplyingAssignment] = useState<string | null>(null);
  const [isRemovingAll, setIsRemovingAll] = useState(false);
  
  // AI logs
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [showAiLogs, setShowAiLogs] = useState(false);
  
  // Single collection AI assignment
  const [assigningCollectionId, setAssigningCollectionId] = useState<string | null>(null);
  
  // Unassigned products
  const [unassignedProducts, setUnassignedProducts] = useState<any[]>([]);
  const [isLoadingUnassigned, setIsLoadingUnassigned] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'smart'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'products' | 'type'>('title');

  // Load local collections from localStorage
  const loadLocalCollections = () => {
    const saved = localStorage.getItem("collections");
    if (saved) {
      const collections = JSON.parse(saved);
      setLocalCollections(collections);
      console.log(`📦 ${collections.length} collections locales chargées`);
    }
  };

  // Sync collections from Shopify
  const handleSyncCollections = async () => {
    if (!selectedStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    setIsSyncingCollections(true);
    loadLocalCollections();

    try {
      const response = await fetch("/api/shopify/sync-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: selectedStore }),
      });

      const result = await response.json();

      if (result.success) {
        setShopifyCollections(result.collections);
        alert(`✅ ${result.total} collections synchronisées depuis Shopify !`);
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur de synchronisation: ${error.message}`);
    } finally {
      setIsSyncingCollections(false);
    }
  };

  // Sync products from Shopify
  const handleSyncProducts = async () => {
    if (!selectedStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    setIsSyncingProducts(true);

    try {
      const response = await fetch("/api/shopify/sync-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: selectedStore }),
      });

      const result = await response.json();

      if (result.success) {
        setShopifyProducts(result.products);
        alert(`✅ ${result.total} produits synchronisés depuis Shopify !`);
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur de synchronisation: ${error.message}`);
    } finally {
      setIsSyncingProducts(false);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...editedImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setEditedImages(newImages);
    setDraggedIndex(index);
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Reset all product handles (slugs)
  const handleResetAllSlugs = async () => {
    if (!selectedStore || shopifyProducts.length === 0) return;

    // 10 requêtes en parallèle toutes les secondes = 10 produits/sec
    const estimatedTime = Math.ceil(shopifyProducts.length / 10); // 10 products per second
    const minutes = Math.floor(estimatedTime / 60);
    const seconds = estimatedTime % 60;
    const timeStr = minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`;

    const confirm = window.confirm(
      `⚠️ Voulez-vous vraiment réinitialiser les slugs de ${shopifyProducts.length} produits ?\n\n` +
      `Les slugs seront régénérés automatiquement depuis les titres des produits.\n\n` +
      `⏱️ Temps estimé : ${timeStr}\n` +
      `(Traitement ultra-rapide par batch de 10 produits en parallèle)`
    );

    if (!confirm) return;

    setIsUpdatingHandles(true);
    setUpdateProgress(`0/${shopifyProducts.length}`);

    try {
      const response = await fetch("/api/shopify/update-product-handles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
          products: shopifyProducts,
          action: 'reset',
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
        // Refresh products
        handleSyncProducts();
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsUpdatingHandles(false);
    }
  };

  // Auto-assign products to collections
  const handleAutoAssignCollections = async () => {
    if (!selectedStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    // Si les produits ne sont pas chargés, les synchroniser d'abord
    let productsToUse = shopifyProducts;
    
    if (shopifyProducts.length === 0) {
      const shouldSync = window.confirm(
        `🤖 Auto-Assignment Intelligent\n\n` +
        `Les produits ne sont pas encore synchronisés.\n\n` +
        `Voulez-vous synchroniser les produits et lancer l'auto-assignment ?\n\n` +
        `Cela peut prendre quelques minutes selon le nombre de produits.`
      );

      if (!shouldSync) return;

      setIsSyncingCollections(true);

      try {
        // Synchroniser les produits
        const syncResponse = await fetch("/api/shopify/sync-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store: selectedStore }),
        });

        const syncResult = await syncResponse.json();

        if (!syncResult.success) {
          alert(`❌ Erreur lors de la synchronisation: ${syncResult.message}`);
          setIsSyncingCollections(false);
          return;
        }

        productsToUse = syncResult.products;
        setShopifyProducts(syncResult.products);
        
        console.log(`✅ ${syncResult.total} produits synchronisés`);
      } catch (error: any) {
        alert(`❌ Erreur de synchronisation: ${error.message}`);
        setIsSyncingCollections(false);
        return;
      }
    } else {
      // Les produits sont déjà chargés, demander confirmation
      const confirm = window.confirm(
        `🤖 Auto-Assignment Intelligent\n\n` +
        `Cette fonctionnalité va analyser vos ${productsToUse.length} produits et les assigner automatiquement aux collections pertinentes.\n\n` +
        `✅ Un produit peut être ajouté à plusieurs collections\n` +
        `✅ Seules les correspondances avec confiance > 80% seront appliquées\n` +
        `✅ Les produits déjà assignés seront ignorés\n\n` +
        `Voulez-vous continuer ?`
      );

      if (!confirm) return;
    }

    setIsSyncingCollections(true);
    setAiLogs([]);
    setShowAiLogs(true);

    try {
      // Récupérer la clé API Claude depuis localStorage
      const claudeApiKey = localStorage.getItem("anthropic_api_key");
      
      if (!claudeApiKey) {
        alert("⚠️ Veuillez configurer votre clé API Claude dans les Paramètres");
        setIsSyncingCollections(false);
        return;
      }

      // Ajouter log initial
      setAiLogs(prev => [...prev, "🤖 Démarrage de l'analyse IA..."]);
      setAiLogs(prev => [...prev, `📦 ${productsToUse.length} produits à analyser`]);
      setAiLogs(prev => [...prev, `📁 ${shopifyCollections.length} collections disponibles`]);

      const response = await fetch("/api/shopify/ai-assign-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
          claudeApiKey: claudeApiKey,
          autoApply: false,
          confidenceThreshold: 0.5,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const stats = result.stats;
        
        // Logs de résultats
        setAiLogs(prev => [...prev, ""]);
        setAiLogs(prev => [...prev, "✅ Analyse terminée !"]);
        setAiLogs(prev => [...prev, `📊 ${stats.total_products} produits analysés`]);
        setAiLogs(prev => [...prev, `🎯 ${stats.products_with_matches} produits avec correspondances`]);
        setAiLogs(prev => [...prev, `💡 ${stats.total_suggestions} suggestions générées`]);
        setAiLogs(prev => [...prev, `⭐ ${stats.high_confidence_suggestions} suggestions haute confiance (≥70%)`]);
        
        // Afficher les suggestions dans une popup
        setSuggestions(result.matches || []);
        setShowSuggestionsPopup(true);
      } else {
        setAiLogs(prev => [...prev, `❌ Erreur: ${result.message}`]);
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      setAiLogs(prev => [...prev, `❌ Erreur: ${error.message}`]);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsSyncingCollections(false);
    }
  };

  // Apply a single suggestion
  const handleApplySuggestion = async (productId: string, collectionId: string, index: number) => {
    if (!selectedStore) return;

    const key = `${productId}-${collectionId}`;
    setApplyingAssignment(key);

    try {
      const response = await fetch("/api/shopify/apply-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
          product_id: productId,
          collection_id: collectionId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Marquer comme appliqué dans la liste
        setSuggestions(prev => 
          prev.map((s, i) => {
            if (i === index) {
              return {
                ...s,
                applied: true,
              };
            }
            return s;
          })
        );
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setApplyingAssignment(null);
    }
  };

  // Apply all high-confidence suggestions
  const handleApplyAllSuggestions = async () => {
    if (!selectedStore || suggestions.length === 0) return;

    const confirm = window.confirm(
      `Voulez-vous appliquer toutes les suggestions avec un score > 80% ?\n\n` +
      `Cela peut prendre quelques minutes.`
    );

    if (!confirm) return;

    setIsSyncingCollections(true);

    let applied = 0;
    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i];
      
      // Appliquer toutes les collections avec score > 0.8
      for (let j = 0; j < suggestion.collectionIds.length; j++) {
        if (suggestion.scores[j] >= 0.8 && !suggestion.applied) {
          try {
            await handleApplySuggestion(
              suggestion.productId,
              suggestion.collectionIds[j],
              i
            );
            applied++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
          } catch (error) {
            console.error('Error applying suggestion:', error);
          }
        }
      }
    }

    setIsSyncingCollections(false);
    alert(`✅ ${applied} assignments appliqués !`);
    
    // Refresh collections
    handleSyncCollections();
  };

  // Remove all collection assignments
  const handleRemoveAllAssignments = async () => {
    if (!selectedStore) return;

    const confirm = window.confirm(
      `⚠️ ATTENTION - Suppression de TOUS les assignments\n\n` +
      `Cette action va supprimer TOUS les produits de TOUTES les collections.\n\n` +
      `Cela peut prendre plusieurs minutes selon le nombre de produits.\n\n` +
      `Êtes-vous absolument sûr de vouloir continuer ?`
    );

    if (!confirm) return;

    setIsRemovingAll(true);

    try {
      // 1. Synchroniser les produits d'abord (automatique)
      console.log('🔄 Synchronisation des produits...');
      const syncResponse = await fetch("/api/shopify/sync-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: selectedStore }),
      });

      const syncResult = await syncResponse.json();
      
      if (!syncResult.success) {
        throw new Error('Erreur synchronisation produits');
      }

      console.log(`✅ ${syncResult.total} produits synchronisés`);

      // 2. Supprimer tous les assignments
      console.log('🗑️ Suppression des assignments...');
      const response = await fetch("/api/shopify/remove-all-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.removed} assignments supprimés avec succès !`);
        // Refresh collections
        handleSyncCollections();
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsRemovingAll(false);
    }
  };

  // Load unassigned products
  const handleLoadUnassignedProducts = async () => {
    if (!selectedStore) return;

    setIsLoadingUnassigned(true);
    setAiLogs([]);
    setShowAiLogs(true);

    try {
      setAiLogs(prev => [...prev, "🔍 Recherche des produits NON assignés..."]);
      
      const response = await fetch("/api/shopify/unassigned-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: selectedStore }),
      });

      const result = await response.json();

      if (result.success) {
        setUnassignedProducts(result.unassignedProducts);
        setShowUnassignedOnly(true);
        
        setAiLogs(prev => [...prev, ""]);
        setAiLogs(prev => [...prev, "✅ Recherche terminée !"]);
        setAiLogs(prev => [...prev, `📊 ${result.total} produits au total`]);
        setAiLogs(prev => [...prev, `❌ ${result.unassignedCount} produits NON assignés`]);
        setAiLogs(prev => [...prev, `✅ ${result.total - result.unassignedCount} produits assignés`]);
        
        alert(`✅ ${result.unassignedCount} produits non assignés trouvés !`);
      } else {
        setAiLogs(prev => [...prev, `❌ Erreur: ${result.message}`]);
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      setAiLogs(prev => [...prev, `❌ Erreur: ${error.message}`]);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoadingUnassigned(false);
    }
  };

  // AI assign single collection
  const handleAiAssignSingleCollection = async (collectionId: string, collectionTitle: string) => {
    if (!selectedStore) return;

    const confirm = window.confirm(
      `🤖 Auto-Assignment IA pour "${collectionTitle}"\n\n` +
      `L'IA va analyser TOUS les produits et déterminer lesquels appartiennent à cette collection.\n\n` +
      `Voulez-vous continuer ?`
    );

    if (!confirm) return;

    setAssigningCollectionId(collectionId);
    setAiLogs([]);
    setShowAiLogs(true);

    try {
      // Récupérer la clé API Claude
      const claudeApiKey = localStorage.getItem("anthropic_api_key");
      
      if (!claudeApiKey) {
        alert("⚠️ Veuillez configurer votre clé API Claude dans les Paramètres");
        setAssigningCollectionId(null);
        return;
      }

      // Synchroniser les produits si nécessaire
      if (shopifyProducts.length === 0) {
        setAiLogs(prev => [...prev, "📦 Synchronisation des produits..."]);
        const syncResponse = await fetch("/api/shopify/sync-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store: selectedStore }),
        });
        const syncResult = await syncResponse.json();
        setShopifyProducts(syncResult.products);
        setAiLogs(prev => [...prev, `✅ ${syncResult.total} produits synchronisés`]);
      }

      setAiLogs(prev => [...prev, `🤖 Analyse IA pour "${collectionTitle}"...`]);
      setAiLogs(prev => [...prev, `📦 ${shopifyProducts.length} produits à analyser`]);

      // Appeler l'API avec le filtre de collection
      const response = await fetch("/api/shopify/ai-assign-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
          claudeApiKey: claudeApiKey,
          autoApply: false,
          confidenceThreshold: 0.5,
          singleCollectionId: collectionId, // Filtrer pour une seule collection
        }),
      });

      const result = await response.json();

      if (result.success) {
        const stats = result.stats;
        
        // Filtrer les suggestions pour cette collection uniquement
        const collectionSuggestions = result.matches.map((match: any) => {
          const collectionIndex = match.collectionIds.indexOf(collectionId);
          if (collectionIndex !== -1) {
            return {
              ...match,
              collectionIds: [collectionId],
              collectionTitles: [match.collectionTitles[collectionIndex]],
              scores: [match.scores[collectionIndex]],
              reasoning: [match.reasoning[collectionIndex]],
            };
          }
          return null;
        }).filter((s: any) => s !== null);

        setAiLogs(prev => [...prev, ""]);
        setAiLogs(prev => [...prev, "✅ Analyse terminée !"]);
        setAiLogs(prev => [...prev, `🎯 ${collectionSuggestions.length} produits correspondent à cette collection`]);
        
        // Afficher les suggestions
        setSuggestions(collectionSuggestions);
        setShowSuggestionsPopup(true);
      } else {
        setAiLogs(prev => [...prev, `❌ Erreur: ${result.message}`]);
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      setAiLogs(prev => [...prev, `❌ Erreur: ${error.message}`]);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setAssigningCollectionId(null);
    }
  };

  // Save images order to Shopify
  const handleSaveImages = async () => {
    if (!selectedStore || !selectedItem || editedImages.length === 0) return;

    setIsSavingImages(true);

    try {
      const response = await fetch("/api/shopify/update-product-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
          productId: selectedItem.id,
          images: editedImages,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
        setHasUnsavedChanges(false);
        
        // Update the selected item with new order
        const updatedItem = {
          ...selectedItem,
          images: editedImages
        };
        setSelectedItem(updatedItem);
        
        // Update in the products list
        setShopifyProducts(prev => 
          prev.map(p => p.id === selectedItem.id ? { ...p, images: editedImages } : p)
        );
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsSavingImages(false);
    }
  };

  // Save product title to Shopify
  const handleSaveTitle = async () => {
    if (!selectedStore || !selectedItem || !editedTitle.trim()) return;

    setIsSavingTitle(true);

    try {
      const response = await fetch("/api/shopify/update-product-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
          productId: selectedItem.id,
          title: editedTitle.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
        setHasUnsavedChanges(false);
        // Update the selected item and the products list
        const updatedItem = { ...selectedItem, title: editedTitle.trim() };
        setSelectedItem(updatedItem);
        
        // Update in the products list
        setShopifyProducts(prev => 
          prev.map(p => p.id === selectedItem.id ? { ...p, title: editedTitle.trim() } : p)
        );
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsSavingTitle(false);
    }
  };

  // Delete product image from Shopify
  const handleDeleteImage = async (imageId: string, imageIndex: number) => {
    if (!selectedStore || !selectedItem) return;

    const confirmDelete = window.confirm(
      `⚠️ Voulez-vous vraiment supprimer cette image ?\n\nCette action est irréversible et supprimera l'image de Shopify.`
    );

    if (!confirmDelete) return;

    setDeletingImageId(imageId);

    try {
      const response = await fetch("/api/shopify/delete-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
          productId: selectedItem.id,
          imageId: imageId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
        
        // Remove image from editedImages
        const newImages = editedImages.filter((_, idx) => idx !== imageIndex);
        setEditedImages(newImages);
        
        // Update the selected item
        const updatedItem = { ...selectedItem, images: newImages };
        setSelectedItem(updatedItem);
        
        // Update in the products list
        setShopifyProducts(prev => 
          prev.map(p => p.id === selectedItem.id ? { ...p, images: newImages } : p)
        );
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setDeletingImageId(null);
    }
  };

  // Auto-match collections based on title similarity
  const findMatches = () => {
    if (shopifyCollections.length === 0 || localCollections.length === 0) {
      alert("⚠️ Veuillez d'abord synchroniser les collections Shopify et avoir des collections locales");
      return;
    }

    let matchCount = 0;
    const matches: Array<{ shopify: ShopifyCollection; local: LocalCollection; score: number }> = [];

    shopifyCollections.forEach((shopifyCol) => {
      localCollections.forEach((localCol) => {
        const score = calculateSimilarity(shopifyCol.title, localCol.name);
        if (score > 0.6) {
          // 60% similarity threshold
          matches.push({ shopify: shopifyCol, local: localCol, score });
          matchCount++;
        }
      });
    });

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    console.log("🎯 Matches trouvés:", matches);
    alert(`🎯 ${matchCount} correspondances potentielles trouvées ! (Voir console)`);
  };

  // Calculate string similarity (simple Levenshtein-like)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Word overlap
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    
    if (commonWords.length > 0) {
      return commonWords.length / Math.max(words1.length, words2.length);
    }

    return 0;
  };

  // Filter and sort collections
  const filteredCollections = shopifyCollections
    .filter((col) => {
      if (filterType !== 'all' && col.type !== filterType) return false;
      if (searchQuery && !col.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'products') return b.productsCount - a.productsCount;
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return 0;
    });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg">
              <RefreshCw className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion Shopify
              </h1>
              <p className="text-gray-600">
                Synchronisez et gérez vos collections, produits, articles et pages
              </p>
            </div>
          </div>
        </div>

        {/* Store Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sélectionner votre store Shopify
          </h2>
          <ShopifyStoreSelector onStoreSelect={setSelectedStore} />
        </div>

        {/* Tabs */}
        {selectedStore && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('collections')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'collections'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FolderOpen className="w-5 h-5" />
                    Collections
                    {shopifyCollections.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {shopifyCollections.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'products'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Produits
                    {shopifyProducts.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {shopifyProducts.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('articles')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'articles'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    Articles de Blog
                  </button>

                  <button
                    onClick={() => setActiveTab('pages')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'pages'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <File className="w-5 h-5" />
                    Pages
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Collections Tab */}
                {activeTab === 'collections' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Collections Shopify
                      </h2>
                      <button
                        onClick={handleSyncCollections}
                        disabled={isSyncingCollections}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className={`w-5 h-5 ${isSyncingCollections ? 'animate-spin' : ''}`} />
                        {isSyncingCollections ? "Synchronisation..." : "Synchroniser"}
                      </button>
                    </div>

                    {shopifyCollections.length > 0 && (
                      <>
                        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2 text-purple-800">
                            <FolderOpen className="w-5 h-5" />
                            <span className="font-medium">
                              {shopifyCollections.length} collections trouvées
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleAutoAssignCollections}
                              disabled={!selectedStore || isSyncingCollections}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Sparkles className={`w-4 h-4 ${isSyncingCollections ? 'animate-spin' : ''}`} />
                              {isSyncingCollections ? 'Analyse IA...' : 'Auto-Assigner (IA)'}
                            </button>
                            <button
                              onClick={handleLoadUnassignedProducts}
                              disabled={!selectedStore || isLoadingUnassigned}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all shadow-md hover:shadow-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Package className={`w-4 h-4 ${isLoadingUnassigned ? 'animate-spin' : ''}`} />
                              {isLoadingUnassigned ? 'Recherche...' : 'Produits Non Assignés'}
                            </button>
                            <button
                              onClick={handleRemoveAllAssignments}
                              disabled={!selectedStore || isRemovingAll}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className={`w-4 h-4 ${isRemovingAll ? 'animate-spin' : ''}`} />
                              {isRemovingAll ? 'Suppression...' : 'Supprimer Tout'}
                            </button>
                            <input
                              type="text"
                              placeholder="Rechercher..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* AI Logs */}
                        {showAiLogs && aiLogs.length > 0 && (
                          <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4 mb-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Logs d'analyse IA en temps réel
                              </h3>
                              <button
                                onClick={() => setShowAiLogs(false)}
                                className="text-gray-400 hover:text-white text-xs font-medium"
                              >
                                Masquer
                              </button>
                            </div>
                            <div className="bg-black rounded-lg p-3 max-h-96 overflow-y-auto font-mono text-xs space-y-1">
                              {aiLogs.map((log, index) => {
                                // Coloriser selon le contenu
                                let colorClass = "text-gray-300"; // Par défaut
                                
                                if (log.includes("✅") || log.includes("TERMINÉ")) {
                                  colorClass = "text-green-400";
                                } else if (log.includes("❌") || log.includes("ERREUR")) {
                                  colorClass = "text-red-400";
                                } else if (log.includes("⚠️")) {
                                  colorClass = "text-yellow-400";
                                } else if (log.includes("🤖") || log.includes("🧠")) {
                                  colorClass = "text-blue-400";
                                } else if (log.includes("📦") || log.includes("BATCH")) {
                                  colorClass = "text-purple-400";
                                } else if (log.includes("📊") || log.includes("📁")) {
                                  colorClass = "text-cyan-400";
                                } else if (log.includes("🔍")) {
                                  colorClass = "text-orange-400";
                                } else if (log.includes("━━━")) {
                                  colorClass = "text-gray-600";
                                }
                                
                                return (
                                  <div key={index} className={colorClass}>
                                    {log}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Liste compacte des collections */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-16">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Image</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Titre</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produits</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {shopifyCollections
                                .filter(c => 
                                  searchQuery === '' || 
                                  c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  c.handle.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((collection, index) => (
                                <tr key={collection.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-500">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3">
                                    {collection.image ? (
                                      <img 
                                        src={collection.image} 
                                        alt={collection.title}
                                        className="w-12 h-12 object-cover rounded border border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                        <FolderOpen className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900 text-sm">{collection.title}</div>
                                    <div className="text-xs text-gray-500">{collection.handle}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      collection.type === 'custom' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-purple-100 text-purple-700'
                                    }`}>
                                      {collection.type === 'custom' ? '📁 Custom' : '⚡ Smart'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {collection.productsCount} produits
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      collection.published 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {collection.published ? '✅ Publié' : '⏸️ Non publié'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setSelectedItem(collection);
                                          setEditedImages(collection.image ? [{ src: collection.image }] : []);
                                          setHasUnsavedChanges(false);
                                          setShowDetailPopup(true);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        Voir détails
                                      </button>
                                      <button
                                        onClick={() => handleAiAssignSingleCollection(collection.id, collection.title)}
                                        disabled={assigningCollectionId === collection.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {assigningCollectionId === collection.id ? "Analyse..." : "Assigner par IA"}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Produits Shopify
                      </h2>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSyncProducts}
                          disabled={isSyncingProducts}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`w-5 h-5 ${isSyncingProducts ? 'animate-spin' : ''}`} />
                          {isSyncingProducts ? (
                            <span>
                              Synchronisation...
                              {syncProgress && <span className="ml-2 text-xs">({syncProgress})</span>}
                            </span>
                          ) : "Synchroniser TOUS les produits"}
                        </button>
                        {shopifyProducts.length > 0 && (
                          <button
                            onClick={handleResetAllSlugs}
                            disabled={isUpdatingHandles}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdatingHandles ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>
                                  Mise à jour...
                                  {updateProgress && <span className="ml-2 text-xs">({updateProgress})</span>}
                                </span>
                              </>
                            ) : (
                              <>
                                <Package className="w-5 h-5" />
                                Réinitialiser tous les slugs
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {shopifyProducts.length > 0 && (
                      <>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-800">
                            <ShoppingBag className="w-5 h-5" />
                            <span className="font-medium">
                              {shopifyProducts.length} produits trouvés
                            </span>
                          </div>
                          <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Liste compacte des produits */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-16">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-20">Image</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-80">Titre</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-24">Prix</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-32">Statut</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-36">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {shopifyProducts
                                .filter(p => 
                                  searchQuery === '' || 
                                  p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  p.vendor.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((product, index) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-500">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3">
                                    {product.images && product.images.length > 0 ? (
                                      <img 
                                        src={product.images[0].src} 
                                        alt={product.title}
                                        onClick={() => {
                                          setSelectedItem(product);
                                          setEditedImages(product.images || []);
                                          setHasUnsavedChanges(false);
                                          setIsImageOnlyMode(true);
                                          setShowDetailPopup(true);
                                        }}
                                        className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-start gap-2">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900 text-sm line-clamp-2">
                                          {product.title}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">{product.handle}</div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setSelectedItem(product);
                                          setEditedImages(product.images || []);
                                          setEditedTitle(product.title);
                                          setHasUnsavedChanges(false);
                                          setIsImageOnlyMode(false);
                                          setShowDetailPopup(true);
                                        }}
                                        className="p-1.5 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                                        title="Modifier le titre"
                                      >
                                        <Edit2 className="w-4 h-4 text-blue-600" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {product.variants && product.variants.length > 0 
                                      ? `${product.variants[0].price}€`
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      product.status === 'active' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {product.status === 'active' ? '✅ Publié' : '⏸️ Brouillon'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setSelectedItem(product);
                                          setEditedImages(product.images || []);
                                          setEditedTitle(product.title);
                                          setHasUnsavedChanges(false);
                                          setIsImageOnlyMode(false);
                                          setShowDetailPopup(true);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        Modifier
                                      </button>
                                      <a
                                        href={`https://${selectedStore?.shopDomain}/products/${product.handle}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Ouvrir sur Shopify"
                                      >
                                        <ExternalLink className="w-4 h-4 text-gray-600" />
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Articles Tab */}
                {activeTab === 'articles' && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Articles de Blog</h3>
                    <p className="text-gray-600">Fonctionnalité à venir...</p>
                  </div>
                )}

                {/* Pages Tab */}
                {activeTab === 'pages' && (
                  <div className="text-center py-12">
                    <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Pages</h3>
                    <p className="text-gray-600">Fonctionnalité à venir...</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}


        {/* Popup Détails */}
        {showDetailPopup && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header - Compact */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between gap-3">
                  {/* Editable Title */}
                  {selectedItem.variants ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => {
                        setEditedTitle(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="flex-1 px-4 py-2.5 text-base font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Titre du produit"
                    />
                  ) : (
                    <h3 className="flex-1 text-base font-semibold text-gray-900">{selectedItem.title}</h3>
                  )}
                  <button
                    onClick={() => setShowDetailPopup(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <XCircle className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {/* Mode Images Uniquement */}
                  {isImageOnlyMode ? (
                    <>
                      {/* Images avec Drag & Drop */}
                      {editedImages && editedImages.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-bold text-gray-900">📷 Modifier l'ordre des images</h4>
                            {hasUnsavedChanges && (
                              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-medium">
                                ⚠️ Modifications non sauvegardées
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            💡 Glissez-déposez les images pour réorganiser l'ordre d'affichage sur votre boutique
                          </p>
                          <div className="grid grid-cols-3 gap-4">
                            {editedImages.map((img: any, idx: number) => (
                              <div
                                key={img.id || idx}
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                className={`relative group cursor-move ${
                                  draggedIndex === idx ? 'opacity-50' : ''
                                }`}
                              >
                                <div className="absolute top-3 left-3 bg-black bg-opacity-80 text-white text-sm font-bold px-3 py-1.5 rounded-lg z-10 shadow-lg">
                                  #{idx + 1}
                                </div>
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <div className="bg-black bg-opacity-80 text-white p-2 rounded-lg shadow-lg">
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteImage(img.id, idx);
                                    }}
                                    disabled={deletingImageId === img.id}
                                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-lg transition-colors disabled:opacity-50"
                                    title="Supprimer l'image"
                                  >
                                    {deletingImageId === img.id ? (
                                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 className="w-5 h-5" />
                                    )}
                                  </button>
                                </div>
                                <div className="w-full aspect-square">
                                  <img 
                                    src={img.src} 
                                    alt={`Image ${idx + 1}`}
                                    className="w-full h-full object-contain rounded-lg border-2 border-gray-300 group-hover:border-blue-500 transition-colors bg-white shadow-sm"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Mode Complet - Images avec Drag & Drop */}
                      {editedImages && editedImages.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">📷 Images ({editedImages.length})</h4>
                        {hasUnsavedChanges && (
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-medium">
                            ⚠️ Modifications non sauvegardées
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        💡 Glissez-déposez les images pour réorganiser l'ordre
                      </p>
                      <div className="grid grid-cols-4 gap-3">
                        {editedImages.map((img: any, idx: number) => (
                          <div
                            key={img.id || idx}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`relative group cursor-move ${
                              draggedIndex === idx ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded z-10">
                              #{idx + 1}
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <div className="bg-black bg-opacity-70 text-white p-1 rounded">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(img.id, idx);
                                }}
                                disabled={deletingImageId === img.id}
                                className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors disabled:opacity-50"
                                title="Supprimer l'image"
                              >
                                {deletingImageId === img.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <div className="w-full aspect-square">
                              <img 
                                src={img.src} 
                                alt={`Image ${idx + 1}`}
                                className="w-full h-full object-contain rounded border-2 border-gray-200 group-hover:border-blue-400 transition-colors bg-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Infos principales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Handle (URL)</p>
                      <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">{selectedItem.handle}</p>
                    </div>
                    {selectedItem.vendor && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Vendor</p>
                        <p className="text-sm text-gray-900">{selectedItem.vendor}</p>
                      </div>
                    )}
                    {selectedItem.productType && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Type de Produit</p>
                        <p className="text-sm text-gray-900">{selectedItem.productType}</p>
                      </div>
                    )}
                    {selectedItem.status && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Statut</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedItem.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedItem.status === 'active' ? '✅ Publié' : '⏸️ Brouillon'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">🏷️ Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variants */}
                  {selectedItem.variants && selectedItem.variants.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 Variants ({selectedItem.variants.length})</h4>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Titre</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">SKU</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Prix</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Inventaire</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedItem.variants.map((variant: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-3 py-2">{variant.title}</td>
                                <td className="px-3 py-2 font-mono text-xs">{variant.sku || '-'}</td>
                                <td className="px-3 py-2 font-semibold">{variant.price}€</td>
                                <td className="px-3 py-2">{variant.inventory_quantity || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Description HTML */}
                  {selectedItem.bodyHtml && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">📝 Description</h4>
                      <div 
                        className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg border border-gray-200"
                        dangerouslySetInnerHTML={{ __html: selectedItem.bodyHtml }}
                      />
                    </div>
                  )}

                  {/* JSON Complet - Accordéon */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowJsonData(!showJsonData)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="text-sm font-semibold text-gray-700">🔧 Données Shopify Complètes (JSON)</h4>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${showJsonData ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showJsonData && (
                      <div className="p-4 bg-white">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(selectedItem, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer - Compact */}
              <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                  {hasUnsavedChanges && (
                    <p className="text-xs text-orange-600 font-medium">
                      ⚠️ Modifications non sauvegardées
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDetailPopup(false)}
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    Fermer
                  </button>
                  {/* Save Title Button (for products only) */}
                  {selectedItem.variants && editedTitle !== selectedItem.title && (
                    <button
                      onClick={handleSaveTitle}
                      disabled={isSavingTitle || !editedTitle.trim()}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingTitle ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sauvegarde...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3" />
                          <span>Titre</span>
                        </>
                      )}
                    </button>
                  )}
                  {/* Save Images Button */}
                  {editedImages.length > 0 && (
                    <button
                      onClick={handleSaveImages}
                      disabled={!hasUnsavedChanges || isSavingImages}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingImages ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3" />
                          <span>Images</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popup Suggestions Auto-Assignment */}
        {showSuggestionsPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <Sparkles className="w-7 h-7 text-green-600" />
                      Suggestions d'Auto-Assignment IA
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      🤖 Analyse sémantique par Claude Haiku • {suggestions.length} produits avec des correspondances trouvées
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSuggestionsPopup(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5 hover:border-blue-400 transition-all"
                    >
                      {/* Product Title */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Package className="w-6 h-6 text-blue-600 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">
                              {suggestion.productTitle}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {suggestion.collectionIds.length} collection(s) suggérée(s)
                            </p>
                          </div>
                        </div>
                        {suggestion.applied && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Appliqué
                          </span>
                        )}
                      </div>

                      {/* Collections Suggestions */}
                      <div className="space-y-2">
                        {suggestion.collectionTitles.map((collectionTitle: string, colIndex: number) => {
                          const score = suggestion.scores[colIndex];
                          const collectionId = suggestion.collectionIds[colIndex];
                          const key = `${suggestion.productId}-${collectionId}`;
                          const isApplying = applyingAssignment === key;

                          return (
                            <div
                              key={colIndex}
                              className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-all"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <FolderOpen className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">
                                    {collectionTitle}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-2">
                                      <div className="bg-gray-200 rounded-full h-2 w-32">
                                        <div
                                          className={`h-2 rounded-full ${
                                            score >= 0.8
                                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                              : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                          }`}
                                          style={{ width: `${score * 100}%` }}
                                        />
                                      </div>
                                      <span
                                        className={`text-xs font-bold ${
                                          score >= 0.8 ? 'text-green-600' : 'text-orange-600'
                                        }`}
                                      >
                                        {(score * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                    {score >= 0.7 && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                        Haute confiance
                                      </span>
                                    )}
                                  </div>
                                  {suggestion.reasoning && suggestion.reasoning[colIndex] && (
                                    <p className="text-xs text-gray-600 mt-2 italic">
                                      💡 {suggestion.reasoning[colIndex]}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleApplySuggestion(suggestion.productId, collectionId, index)}
                                disabled={suggestion.applied || isApplying}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isApplying ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Application...</span>
                                  </>
                                ) : suggestion.applied ? (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Appliqué</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Appliquer</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{suggestions.filter(s => s.applied).length}</span> sur{' '}
                  <span className="font-semibold">{suggestions.length}</span> appliqués
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSuggestionsPopup(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={handleApplyAllSuggestions}
                    disabled={isSyncingCollections}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncingCollections ? 'Application...' : 'Appliquer tout (>80%)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
