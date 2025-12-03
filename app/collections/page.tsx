"use client";

import { useState, useRef } from "react";
import { Link2, Loader2, Download, Plus, Trash2, ArrowRight, Home, RefreshCw, Sparkles, AlertCircle, FolderOpen, ChevronDown, Pause, Play, Upload, PlusCircle } from "lucide-react";
import ShopifyStoreSelector from '@/components/ShopifyStoreSelector';
import PublishModeSelectorSimple from '@/components/PublishModeSelectorSimple';
import type { ShopifyStore, PublishMode } from '@/types/shopify';

// Custom CSS for subtle pulse animation
const pulseStyle = `
  @keyframes pulse-subtle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.85;
    }
  }
  .animate-pulse-subtle {
    animation: pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

interface Collection {
  name: string;
  handle: string;
  content: string;
  status: "pending" | "processing" | "completed" | "error";
  linkCount?: number;
  createInShopify?: boolean;
  shopifyId?: string;
}

interface CollectionGroup {
  id: string;
  name: string;
  collections: Collection[];
}

export default function Collections() {
  const [shopUrl, setShopUrl] = useState("");
  const [groups, setGroups] = useState<CollectionGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [errorMessage, setErrorMessage] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentProgress, setCurrentProgress] = useState({ current: 0, total: 0, collectionName: "" });
  const pauseRef = useRef(false);

  // Shopify states
  const [selectedStore, setSelectedStore] = useState<ShopifyStore | null>(null);
  const [publishMode, setPublishMode] = useState<PublishMode>('active');
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [delayBetweenPublications, setDelayBetweenPublications] = useState(0); // Délai en heures
  const [isUpdatingShopify, setIsUpdatingShopify] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });
  const [isCreatingCollections, setIsCreatingCollections] = useState(false);
  const [createProgress, setCreateProgress] = useState({ current: 0, total: 0, created: 0, skipped: 0 });

  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const cleanShopUrl = (url: string): string => {
    return url.trim().replace(/\/+$/, "");
  };

  const addGroup = () => {
    if (!bulkInput.trim()) return;
    
    const lines = bulkInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length === 0) return;

    const newCollections: Collection[] = lines.map(name => ({
      name: name,
      handle: slugify(name),
      content: "",
      status: "pending",
    }));

    // Auto-name group with first collection
    const groupName = lines[0];

    const newGroup: CollectionGroup = {
      id: Date.now().toString(),
      name: groupName,
      collections: newCollections,
    };

    setGroups([...groups, newGroup]);
    setBulkInput("");
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const removeCollection = (groupId: string, collectionIndex: number) => {
    setGroups(prev => 
      prev.map(g => 
        g.id === groupId 
          ? { ...g, collections: g.collections.filter((_, idx) => idx !== collectionIndex) }
          : g
      ).filter(g => g.collections.length > 0) // Remove group if no collections left
    );
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(pauseRef.current);
  };

  const generateAllContent = async () => {
    const claudeApiKey = localStorage.getItem("anthropic_api_key");
    
    if (!claudeApiKey) {
      setErrorMessage("⚠️ Veuillez configurer votre clé API Claude dans les Paramètres");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    if (!shopUrl.trim()) {
      setErrorMessage("⚠️ Veuillez entrer l'URL de votre boutique");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    if (groups.length === 0) {
      setErrorMessage("⚠️ Veuillez ajouter au moins un groupe de collections");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    // Open first group automatically
    if (groups.length > 0 && !expandedGroups.has(groups[0].id)) {
      setExpandedGroups(new Set([groups[0].id]));
      // Scroll to first group
      setTimeout(() => {
        const element = document.getElementById(`group-${groups[0].id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    // Calculate total collections
    const totalCollections = groups.reduce((sum, g) => sum + g.collections.length, 0);
    let processedCount = 0;

    // Process each group independently
    for (const group of groups) {
      const collections = group.collections;

      // Process collections in this group one by one
      for (let i = 0; i < collections.length; i++) {
        // Check for pause
        while (pauseRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const collection = collections[i];
        processedCount++;
        
        // Update progress
        setCurrentProgress({
          current: processedCount,
          total: totalCollections,
          collectionName: collection.name
        });
        
        // Mark as processing
        setGroups(prev => 
          prev.map(g => 
            g.id === group.id ? {
              ...g,
              collections: g.collections.map((col, idx) => 
                idx === i ? { ...col, status: "processing" as const } : col
              )
            } : g
          )
        );

        try {
          const isFirst = i === 0;
          const isLast = i === collections.length - 1;
          const previousCollection = i > 0 ? collections[i - 1] : null;
          const nextCollection = i < collections.length - 1 ? collections[i + 1] : null;

          const response = await fetch("/api/generate-collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              collectionName: collection.name,
              collectionHandle: collection.handle,
              shopUrl: cleanShopUrl(shopUrl),
              previousCollection,
              nextCollection,
              isFirst,
              isLast,
              allCollections: collections,
              claudeApiKey,
              language,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Erreur lors de la génération");
          }

          const { content, linkCount, warning } = await response.json();

          setGroups(prev => 
            prev.map(g => 
              g.id === group.id ? {
                ...g,
                collections: g.collections.map((col, idx) => 
                  idx === i ? { 
                    ...col, 
                    content, 
                    linkCount,
                    status: "completed" as const,
                  } : col
                )
              } : g
            )
          );

          if (warning) {
            console.warn(warning);
          }

        } catch (error: any) {
          console.error("Error generating collection:", error);
          setGroups(prev => 
            prev.map(g => 
              g.id === group.id ? {
                ...g,
                collections: g.collections.map((col, idx) => 
                  idx === i ? { ...col, status: "error" as const } : col
                )
              } : g
            )
          );
          setErrorMessage(`⚠️ Erreur pour "${collection.name}": ${error.message}`);
        }
      }
    }

    setIsProcessing(false);
    setIsPaused(false);
    pauseRef.current = false;
    setCurrentProgress({ current: 0, total: 0, collectionName: "" });
  };

  const downloadShopifyFormat = () => {
    const cleanUrl = cleanShopUrl(shopUrl);
    
    // CSV Header
    const csvRows = [
      ['Handle', 'Title', 'Body (HTML)', 'URL', 'Status', 'Links Count', 'Group'].join(',')
    ];
    
    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (!value) return '';
      // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    // Add each collection as a row
    groups.forEach((group) => {
      group.collections.forEach((col) => {
        const row = [
          escapeCSV(col.handle),
          escapeCSV(col.name),
          escapeCSV(col.content || ''),
          escapeCSV(`${cleanUrl}/collections/${col.handle}`),
          escapeCSV(col.status),
          col.linkCount?.toString() || '0',
          escapeCSV(group.name)
        ].join(',');
        csvRows.push(row);
      });
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `collections-shopify-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateShopifyDescriptions = async () => {
    if (!selectedStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    // Compter les collections complétées
    const completedCollections = groups.flatMap(g => g.collections).filter(c => c.status === 'completed' && c.content);
    
    if (completedCollections.length === 0) {
      alert("⚠️ Aucune collection complétée à publier");
      return;
    }

    const confirm = window.confirm(
      `🚀 Mise à jour Shopify\n\n` +
      `${completedCollections.length} descriptions seront écrasées sur Shopify.\n\n` +
      `⚠️ ATTENTION: Cette action est irréversible !\n\n` +
      `Les descriptions existantes seront remplacées.\n\n` +
      `Voulez-vous continuer ?`
    );

    if (!confirm) return;

    setIsUpdatingShopify(true);
    setUpdateProgress({ current: 0, total: completedCollections.length });

    try {
      // Synchroniser UNE SEULE FOIS les collections Shopify pour récupérer les IDs
      const syncResponse = await fetch('/api/shopify/sync-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: selectedStore }),
      });

      const syncResult = await syncResponse.json();

      if (!syncResult.success || !Array.isArray(syncResult.collections)) {
        throw new Error('Impossible de synchroniser les collections Shopify');
      }

      const collectionsByHandle = new Map(
        syncResult.collections.map((c: any) => [c.handle, c])
      );

      let success = 0;
      let errors = 0;

      for (let i = 0; i < completedCollections.length; i++) {
        const collection = completedCollections[i];

        try {
          setUpdateProgress({ current: i + 1, total: completedCollections.length });

          const shopifyCollection = collectionsByHandle.get(collection.handle);

          if (!shopifyCollection) {
            throw new Error(`Collection "${collection.name}" introuvable sur Shopify`);
          }

          console.log(`📝 Mise à jour: ${collection.name} (ID: ${shopifyCollection.id})`);

          const updateResponse = await fetch('/api/shopify/update-collection-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              store: selectedStore,
              collectionId: shopifyCollection.id,
              bodyHtml: collection.content,
            }),
          });

          const updateResult = await updateResponse.json();

          if (updateResult.success) {
            success++;
            console.log(`✅ ${collection.name} mis à jour`);
          } else {
            throw new Error(updateResult.message);
          }

        } catch (error: any) {
          errors++;
          console.error(`❌ Erreur ${collection.name}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (errors === 0) {
        alert(`✅ ${success} descriptions mises à jour avec succès sur Shopify !`);
      } else {
        alert(`⚠️ ${success} réussis, ${errors} erreurs\n\nConsultez la console pour plus de détails.`);
      }

    } catch (error: any) {
      console.error('❌ Erreur globale mise à jour descriptions:', error.message);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsUpdatingShopify(false);
      setUpdateProgress({ current: 0, total: 0 });
    }
  };

  const createCollectionsOnShopify = async () => {
    if (!selectedStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    const completedCollections = groups.flatMap(g => g.collections).filter(c => c.status === 'completed' && c.content);
    
    if (completedCollections.length === 0) {
      alert("⚠️ Aucune collection complétée à créer");
      return;
    }

    setIsCreatingCollections(true);
    setCreateProgress({ current: 0, total: completedCollections.length, created: 0, skipped: 0 });

    try {
      // Synchroniser les collections existantes pour éviter les doublons
      const syncResponse = await fetch('/api/shopify/sync-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: selectedStore }),
      });

      const syncResult = await syncResponse.json();
      const existingHandles = new Set(
        syncResult.success && Array.isArray(syncResult.collections)
          ? syncResult.collections.map((c: any) => c.handle)
          : []
      );

      let created = 0;
      let skipped = 0;

      for (let i = 0; i < completedCollections.length; i++) {
        const collection = completedCollections[i];
        setCreateProgress({ current: i + 1, total: completedCollections.length, created, skipped });

        // Vérifier si la collection existe déjà
        if (existingHandles.has(collection.handle)) {
          console.log(`⏭️ Collection "${collection.name}" existe déjà, ignorée`);
          skipped++;
          continue;
        }

        try {
          const response = await fetch('/api/shopify/create-collection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              store: selectedStore,
              collection: {
                title: collection.name,
                handle: collection.handle,
                body_html: collection.content,
                published: publishMode === 'active',
              },
            }),
          });

          const result = await response.json();

          if (result.success) {
            created++;
            console.log(`✅ Collection "${collection.name}" créée`);
          } else {
            console.error(`❌ Erreur création "${collection.name}":`, result.message);
          }
        } catch (error: any) {
          console.error(`❌ Erreur création "${collection.name}":`, error.message);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setCreateProgress({ current: completedCollections.length, total: completedCollections.length, created, skipped });

      if (skipped > 0) {
        alert(`✅ Création terminée !\n\n📦 ${created} collection(s) créée(s)\n⏭️ ${skipped} collection(s) ignorée(s) (déjà existantes)`);
      } else {
        alert(`✅ ${created} collection(s) créée(s) sur Shopify !`);
      }

    } catch (error: any) {
      console.error('❌ Erreur globale création collections:', error.message);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsCreatingCollections(false);
      setCreateProgress({ current: 0, total: 0, created: 0, skipped: 0 });
    }
  };

  const publishToShopify = async (collection: Collection) => {
    if (!selectedStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    if (!collection.content) {
      alert("⚠️ La collection n'a pas de contenu à publier");
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch("/api/shopify/publish-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
          collection: {
            title: collection.name,
            body_html: collection.content,
            handle: collection.handle,
          },
          publishMode,
          scheduledDate: publishMode === 'scheduled' ? scheduledDate : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Collection "${collection.name}" publiée sur Shopify !`);
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ Erreur de publication: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const publishAllToShopify = async () => {
    if (!selectedStore) {
      alert("⚠️ Veuillez sélectionner un store Shopify");
      return;
    }

    const completedCollections = groups.flatMap(g => 
      g.collections.filter(c => c.status === "completed" && c.content)
    );
    
    if (completedCollections.length === 0) {
      alert("⚠️ Aucune collection complétée à publier");
      return;
    }

    if (!confirm(`Publier ${completedCollections.length} collection(s) sur Shopify ?`)) {
      return;
    }

    setIsPublishing(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < completedCollections.length; i++) {
      const collection = completedCollections[i];
      
      // Calculer la date de publication avec délai
      let publicationDate = scheduledDate;
      if (publishMode === 'scheduled' && delayBetweenPublications > 0 && i > 0) {
        const baseDate = new Date(scheduledDate);
        const delayInHours = delayBetweenPublications * i;
        baseDate.setHours(baseDate.getHours() + delayInHours);
        publicationDate = baseDate.toISOString();
      }
      
      try {
        const response = await fetch("/api/shopify/publish-collection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store: selectedStore,
            collection: {
              title: collection.name,
              body_html: collection.content,
              handle: collection.handle,
            },
            publishMode,
            scheduledDate: publishMode === 'scheduled' ? publicationDate : undefined,
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

  const totalCollections = groups.reduce((sum, g) => sum + g.collections.length, 0);
  const completedCount = groups.reduce((sum, g) => 
    sum + g.collections.filter(c => c.status === "completed").length, 0
  );
  const progressPercentage = totalCollections > 0 
    ? Math.round((completedCount / totalCollections) * 100) 
    : 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pulseStyle }} />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <FolderOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Collections SEO</h1>
              <p className="text-gray-600">
                Maillage interne intelligent par groupes
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Progress Notification */}
        {isProcessing && currentProgress.total > 0 && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Génération en cours... {completedCount}/{totalCollections}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Collection actuelle : {currentProgress.collectionName}
                </p>
              </div>
              <div className="text-sm font-bold text-blue-600">
                {progressPercentage}%
              </div>
            </div>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Statistics */}
        {groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Groupes</div>
              <div className="text-2xl font-bold text-gray-900">{groups.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Collections</div>
              <div className="text-2xl font-bold text-gray-900">{totalCollections}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Générées</div>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Progression</div>
              <div className="text-2xl font-bold text-purple-600">{progressPercentage}%</div>
            </div>
          </div>
        )}

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Configuration
          </h2>

          {/* Shop URL and Language 50/50 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌐 URL de votre boutique
              </label>
              <input
                type="url"
                value={shopUrl}
                onChange={(e) => setShopUrl(e.target.value)}
                placeholder="https://maboutique.myshopify.com"
                disabled={isProcessing}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌍 Langue
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isProcessing}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium"
              >
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
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
          </div>

          {/* Add Group Section - Split Layout */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-500" />
              Collections
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left: Collections Input (3/4) */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📦 Liste des collections <span className="text-gray-500 font-normal">(une par ligne)</span>
                </label>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder={"Collez les collections de ce groupe :\n\nRobes Steampunk\nChemises Steampunk\nPantalons Steampunk\nAccessoires Steampunk"}
                  disabled={isProcessing}
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium bg-purple-50/50"
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-600">
                    💡 {bulkInput.split('\n').filter(l => l.trim()).length} collection(s) • Groupe: <strong>{bulkInput.split('\n').filter(l => l.trim())[0] || "..."}</strong>
                  </p>
                  <button
                    onClick={addGroup}
                    disabled={isProcessing || !bulkInput.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter ce groupe
                  </button>
                </div>
              </div>

              {/* Right: Groups Menu (1/4) */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📋 Mes groupes de maillages
                </label>
                <div className="space-y-2">
                  {groups.map((group, index) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        const element = document.getElementById(`group-${group.id}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="w-full text-left px-3 py-2 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-sm font-medium text-gray-700 hover:text-purple-700 flex items-center gap-2"
                    >
                      <span className="text-purple-500 font-bold">{index + 1}</span>
                      <span className="truncate">{group.name}</span>
                      <span className="ml-auto text-xs text-gray-500">({group.collections.length})</span>
                    </button>
                  ))}
                  
                  {/* Add New Group Button */}
                  <button
                    onClick={() => {
                      const textarea = document.querySelector('textarea');
                      textarea?.focus();
                    }}
                    className="w-full px-3 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50/50 transition-all text-sm font-medium text-gray-500 hover:text-purple-600 flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Nouveau groupe</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Groups List */}
        {groups.length > 0 && (
          <div className="space-y-6 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-purple-500" />
                Groupes de Maillage ({groups.length})
              </h2>
              <div className="flex gap-3 flex-1 justify-end">
                {!isProcessing && (
                  <button
                    onClick={generateAllContent}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium text-base min-w-[200px] animate-pulse-subtle"
                  >
                    <Sparkles className="w-5 h-5" />
                    Générer Tout
                  </button>
                )}
                {isProcessing && (
                  <>
                    <div className="flex items-center px-5 py-2.5 bg-blue-100 text-blue-800 rounded-lg font-medium">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </div>
                    <button
                      onClick={togglePause}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                        isPaused 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-4 h-4" />
                          Reprendre
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      )}
                    </button>
                  </>
                )}
                {completedCount > 0 && (
                  <button
                    onClick={downloadShopifyFormat}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger CSV
                  </button>
                )}
              </div>
            </div>

            {/* Shopify Publication Section */}
            {completedCount > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-green-600" />
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
                    <div className="space-y-4">
                      <PublishModeSelectorSimple 
                        onModeChange={(mode, date) => {
                          setPublishMode(mode);
                          if (date) setScheduledDate(date);
                        }}
                        defaultMode={publishMode}
                      />
                      
                      {/* Délai entre publications */}
                      {publishMode === 'scheduled' && (
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                          <label className="block text-sm font-semibold text-blue-900 mb-2">
                            ⏱️ Délai entre chaque publication
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              max={delayBetweenPublications >= 24 ? "7" : "23"}
                              value={delayBetweenPublications >= 24 ? Math.floor(delayBetweenPublications / 24) : delayBetweenPublications}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (delayBetweenPublications >= 24) {
                                  setDelayBetweenPublications(val * 24);
                                } else {
                                  setDelayBetweenPublications(val);
                                }
                              }}
                              className="w-24 px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-semibold"
                            />
                            <select
                              value={delayBetweenPublications >= 24 ? 'days' : 'hours'}
                              onChange={(e) => {
                                if (e.target.value === 'days') {
                                  const days = Math.max(1, Math.floor(delayBetweenPublications / 24));
                                  setDelayBetweenPublications(days * 24);
                                } else {
                                  const hours = Math.min(23, delayBetweenPublications);
                                  setDelayBetweenPublications(hours);
                                }
                              }}
                              className="px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                            >
                              <option value="hours">Heures</option>
                              <option value="days">Jours</option>
                            </select>
                          </div>
                          <p className="text-xs text-blue-700 mt-2">
                            {delayBetweenPublications === 0 
                              ? "Toutes les collections seront publiées en même temps"
                              : delayBetweenPublications >= 24 
                                ? `Chaque collection sera publiée ${Math.floor(delayBetweenPublications / 24)} jour(s) après la précédente`
                                : `Chaque collection sera publiée ${delayBetweenPublications} heure(s) après la précédente`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Publish All Button */}
                {selectedStore && (
                  <>
                    <div className="flex gap-3">
                      <button
                        onClick={publishAllToShopify}
                        disabled={isPublishing || completedCount === 0 || isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPublishing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Publication en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Publier {completedCount} collection{completedCount > 1 ? 's' : ''} sur Shopify
                          </>
                        )}
                      </button>
                    </div>

                    {/* Create Collections Button */}
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={createCollectionsOnShopify}
                        disabled={isCreatingCollections || completedCount === 0 || isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingCollections ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Création {createProgress.current}/{createProgress.total} ({createProgress.created} créées, {createProgress.skipped} ignorées)
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-5 h-5" />
                            Créer {completedCount} collection{completedCount > 1 ? 's' : ''} sur Shopify
                          </>
                        )}
                      </button>
                    </div>

                    {/* Update Descriptions Button */}
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={updateShopifyDescriptions}
                        disabled={isUpdatingShopify || completedCount === 0 || isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingShopify ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Mise à jour {updateProgress.current}/{updateProgress.total}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-5 h-5" />
                            Écraser Descriptions ({completedCount} collection{completedCount > 1 ? 's' : ''})
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-3 text-xs text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                      💡 <strong>Info :</strong> Les collections seront publiées en mode <strong>{publishMode === 'draft' ? 'Brouillon' : publishMode === 'scheduled' ? 'Programmé' : 'Actif'}</strong>
                      {publishMode === 'scheduled' && scheduledDate && ` le ${new Date(scheduledDate).toLocaleDateString('fr-FR')}`}
                    </div>
                    
                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 rounded-lg p-3 border border-orange-200">
                      ⚠️ <strong>Attention :</strong> "Écraser Descriptions" remplacera les descriptions existantes sur Shopify (irréversible)
                    </div>
                  </>
                )}
              </div>
            )}

            {groups.map((group, groupIndex) => {
              const isExpanded = expandedGroups.has(group.id);
              
              return (
              <div key={group.id} id={`group-${group.id}`} className="bg-white rounded-lg shadow-sm border-2 border-indigo-200 overflow-hidden scroll-mt-6">
                {/* Group Header - Clickable */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200 p-4 hover:from-indigo-100 hover:to-purple-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                        {groupIndex + 1}
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-600">
                          {group.collections.length} collection(s) • {group.collections.filter(c => c.status === "completed").length} générée(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isProcessing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGroup(group.id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <>
                      {/* Link Structure Visualization */}
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-200">
                        <div className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <Link2 className="w-4 h-4" />
                          Schéma de liens (boucle infinie)
                        </div>
                    {group.collections.map((col, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700 min-w-[30px]">#{index + 1}</span>
                        <span className="font-semibold text-purple-700">{col.name}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        {index === 0 ? (
                          <>
                            <Home className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-600 font-medium">Page d'accueil</span>
                            <span className="text-gray-400">+</span>
                            <span className="text-purple-600">{group.collections[1]?.name || "N/A"}</span>
                          </>
                        ) : index === group.collections.length - 1 ? (
                          <>
                            <span className="text-purple-600">{group.collections[index - 1]?.name}</span>
                            <span className="text-gray-400">+</span>
                            <RefreshCw className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 font-medium">{group.collections[0]?.name} (boucle)</span>
                          </>
                        ) : (
                          <>
                            <span className="text-purple-600">{group.collections[index - 1]?.name}</span>
                            <span className="text-gray-400">+</span>
                            <span className="text-purple-600">{group.collections[index + 1]?.name}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                {/* Collections Cards */}
                <div className="p-4 space-y-3">
                  {group.collections.map((col, index) => (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-3 transition-all ${
                        col.status === "completed"
                          ? "border-green-300 bg-green-50"
                          : col.status === "processing"
                          ? "border-blue-300 bg-blue-50"
                          : col.status === "error"
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                              #{index + 1}
                            </span>
                            <h4 className="font-bold text-gray-900">{col.name}</h4>
                            {col.status === "completed" && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                ✓
                              </span>
                            )}
                            {col.status === "processing" && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                              </span>
                            )}
                            {col.status === "error" && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                ✗
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                              {cleanShopUrl(shopUrl)}/collections/{col.handle}
                            </code>
                          </div>
                          {col.linkCount !== undefined && (
                            <div className="text-xs text-gray-600 mt-1">
                              Liens: <span className={col.linkCount === 2 ? "text-green-600 font-semibold" : "text-orange-600 font-semibold"}>
                                {col.linkCount} {col.linkCount === 2 ? "✓" : "⚠️"}
                              </span>
                            </div>
                          )}
                        </div>
                        {!isProcessing && col.status === "pending" && (
                          <button
                            onClick={() => removeCollection(group.id, index)}
                            className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                            title="Supprimer cette collection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {col.content && (
                        <div className="mt-3 p-4 bg-white rounded border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase">
                            Aperçu HTML
                          </div>
                          <div 
                            className="max-h-96 overflow-y-auto text-sm text-gray-800 prose prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:first:mt-0 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mt-3 [&_h3]:mb-2 [&_p]:mb-3 [&_p]:leading-relaxed [&_a]:text-blue-600 [&_a]:underline [&_a]:font-medium [&_a]:hover:text-blue-800 [&_a]:cursor-pointer [&_strong]:font-semibold [&_strong]:text-gray-900"
                            dangerouslySetInnerHTML={{ __html: col.content }}
                            onClick={(e) => {
                              const target = e.target as HTMLElement;
                              if (target.tagName === 'A') {
                                e.preventDefault();
                                const href = target.getAttribute('href');
                                if (href) {
                                  window.open(href, '_blank', 'noopener,noreferrer');
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                  </>
                )}
              </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {groups.length === 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Créez vos groupes de maillage
              </h3>
              <p className="text-gray-600 mb-6">
                Organisez vos collections par thème ou catégorie. Chaque groupe aura son propre maillage interne en boucle, sans mélanger les liens entre groupes différents.
              </p>
              <div className="bg-white rounded-lg p-6 text-left space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">💡 Exemple d'utilisation :</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">Groupe 1:</span>
                      <span className="text-gray-700"><strong>Vêtements Steampunk</strong> → Robes, Chemises, Pantalons, Accessoires</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">Groupe 2:</span>
                      <span className="text-gray-700"><strong>Décorations Steampunk</strong> → Horloges, Lampes, Cadres, Miroirs</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">Groupe 3:</span>
                      <span className="text-gray-700"><strong>Meubles Steampunk</strong> → Tables, Chaises, Étagères, Bureaux</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    ✅ Les vêtements se lieront entre eux<br/>
                    ✅ Les décorations se lieront entre elles<br/>
                    ✅ Les meubles se lieront entre eux<br/>
                    ❌ Pas de liens entre vêtements et meubles (pas pertinent)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Fixed Progress Notification Bubble - Bottom Right */}
      {totalCollections > 0 && (isProcessing || completedCount > 0) && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`bg-gradient-to-r ${
            progressPercentage === 100 
              ? 'from-green-500 to-emerald-500' 
              : isProcessing 
                ? 'from-blue-500 to-indigo-500' 
                : 'from-gray-500 to-gray-600'
          } text-white rounded-xl shadow-2xl p-4 min-w-[220px] transform transition-all duration-300 hover:scale-105`}>
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
                {completedCount}/{totalCollections}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {isProcessing && currentProgress.collectionName && (
              <div className="mt-2 text-xs opacity-75 truncate">
                {currentProgress.collectionName}
              </div>
            )}

            {/* Pause/Resume Button when processing */}
            {isProcessing && progressPercentage < 100 && (
              <button
                onClick={togglePause}
                className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm ${
                  isPaused 
                    ? 'bg-white text-green-600 hover:bg-green-50' 
                    : 'bg-white text-orange-600 hover:bg-orange-50'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    Reprendre
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                )}
              </button>
            )}

            {/* Download Button when completed */}
            {progressPercentage === 100 && (
              <>
                <button
                  onClick={downloadShopifyFormat}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium text-sm shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Télécharger CSV
                </button>
                
                {/* Create Collections Button */}
                {selectedStore && (
                  <button
                    onClick={createCollectionsOnShopify}
                    disabled={isCreatingCollections}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingCollections ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {createProgress.current}/{createProgress.total}
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        Créer sur Shopify
                      </>
                    )}
                  </button>
                )}

                {/* Overwrite Descriptions Button */}
                {selectedStore && (
                  <button
                    onClick={updateShopifyDescriptions}
                    disabled={isUpdatingShopify || completedCount === 0}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingShopify ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {updateProgress.current}/{updateProgress.total}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Écraser descriptions
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
