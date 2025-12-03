"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Upload, Play, Pause, Loader2, CheckCircle, XCircle, Clock, FileText, ShoppingBag, FolderOpen, FileImage } from "lucide-react";
import Papa from "papaparse";
import ShopifyStoreSelector from '@/components/ShopifyStoreSelector';
import { useToast } from '@/components/ToastContainer';
import type { ShopifyStore, ShopifyBlog } from "@/types/shopify";

type ContentType = 'product' | 'collection' | 'article' | 'page';

interface ScheduledProduct {
  id: string;
  type: ContentType;
  title: string;
  handle: string;
  data: any;
  scheduledDate: Date;
  status: 'pending' | 'publishing' | 'published' | 'error';
  error?: string;
}

export default function PlanificationV2Page() {
  const toast = useToast();
  
  // États
  const [contentType, setContentType] = useState<ContentType>('product');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [rawCsvData, setRawCsvData] = useState<any[]>([]);
  const [scheduledProducts, setScheduledProducts] = useState<ScheduledProduct[]>([]);
  const [selectedStore, setSelectedStore] = useState<ShopifyStore | null>(null);
  
  // Configuration
  const [immediateCount, setImmediateCount] = useState(30);
  const [productsPerDay, setProductsPerDay] = useState(10);
  const [startDate, setStartDate] = useState<string>("");
  
  // Publication
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  
  // Blogs Shopify (pour les articles)
  const [shopifyBlogs, setShopifyBlogs] = useState<ShopifyBlog[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string>("");
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  
  // Planification automatique (produits existants)
  const [existingProducts, setExistingProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [autoProductsPerDay, setAutoProductsPerDay] = useState(10);
  const [autoStartDate, setAutoStartDate] = useState<string>("");
  const [autoScheduledProducts, setAutoScheduledProducts] = useState<ScheduledProduct[]>([]);
  const [isAutoPublishing, setIsAutoPublishing] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const contentTypeConfig = {
    product: {
      icon: ShoppingBag,
      label: 'Produits',
      color: 'blue',
      requiredColumns: ['Title', 'Body (HTML)'],
      endpoint: '/api/shopify/publish-product',
    },
    collection: {
      icon: FolderOpen,
      label: 'Collections',
      color: 'purple',
      requiredColumns: ['Title', 'Body HTML'],
      endpoint: '/api/shopify/publish-collection',
    },
    article: {
      icon: FileText,
      label: 'Articles de Blog',
      color: 'green',
      requiredColumns: ['Title', 'Body HTML'],
      endpoint: '/api/shopify/publish-article',
    },
    page: {
      icon: FileImage,
      label: 'Pages',
      color: 'orange',
      requiredColumns: ['Title', 'Body HTML'],
      endpoint: '/api/shopify/publish-page',
    },
  };

  const config = contentTypeConfig[contentType];

  // Synchroniser les produits existants depuis Shopify
  const syncExistingProducts = async () => {
    if (!selectedStore) {
      toast.error("Veuillez sélectionner un store Shopify");
      return;
    }

    setIsLoadingProducts(true);
    try {
      const response = await fetch("/api/shopify/sync-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: selectedStore }),
      });

      const result = await response.json();

      if (result.success) {
        setExistingProducts(result.products || []);
        toast.success(`✅ ${result.products?.length || 0} produits synchronisés`);
      } else {
        toast.error(`❌ Erreur: ${result.message}`);
      }
    } catch (error: any) {
      toast.error(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Générer le planning automatique pour les produits existants
  const generateAutoSchedule = () => {
    if (existingProducts.length === 0) {
      toast.error("Aucun produit à planifier");
      return;
    }

    const scheduled: ScheduledProduct[] = [];
    const startDateObj = autoStartDate ? new Date(autoStartDate) : new Date(Date.now() + 86400000);

    let currentDate = new Date(startDateObj);
    let productsAddedToday = 0;

    existingProducts.forEach((product, index) => {
      // Répartir les produits sur plusieurs jours
      if (productsAddedToday >= autoProductsPerDay) {
        currentDate = new Date(currentDate.getTime() + 86400000); // +1 jour
        productsAddedToday = 0;
      }

      // Ajouter un délai aléatoire dans la journée (2-3h de fenêtre)
      const randomMinutes = Math.floor(Math.random() * 180); // 0-180 minutes
      const scheduledDate = new Date(currentDate.getTime() + randomMinutes * 60000);

      scheduled.push({
        id: `auto-${product.id}`,
        type: 'product',
        title: product.title,
        handle: product.handle || '',
        data: product,
        scheduledDate: scheduledDate,
        status: 'pending',
      });

      productsAddedToday++;
    });

    setAutoScheduledProducts(scheduled);
    toast.success(`✅ Planning généré pour ${scheduled.length} produits`);
  };

  // Lancer la planification automatique
  const launchAutoSchedule = async () => {
    if (!selectedStore || autoScheduledProducts.length === 0) {
      toast.error("Aucun produit à planifier");
      return;
    }

    const confirm = window.confirm(
      `🤖 Planification Automatique\n\n` +
      `${autoScheduledProducts.length} produits seront:\n` +
      `✅ Mis en mode ACTIF (pas brouillon)\n` +
      `📅 Planifiés sur les canaux de vente\n\n` +
      `Voulez-vous continuer ?`
    );

    if (!confirm) return;

    setIsAutoPublishing(true);
    let success = 0;
    let errors = 0;

    for (let i = 0; i < autoScheduledProducts.length; i++) {
      const product = autoScheduledProducts[i];

      try {
        // Mettre à jour le statut
        setAutoScheduledProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, status: 'publishing' } : p
        ));

        console.log(`📤 [${i + 1}/${autoScheduledProducts.length}] ${product.title}`);
        console.log(`   📅 Planifié pour: ${product.scheduledDate.toLocaleString('fr-FR')}`);

        // Appel API pour planifier la visibilité
        const response = await fetch('/api/shopify/schedule-product-visibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store: selectedStore,
            productId: product.data.id,
            publishDate: product.scheduledDate.toISOString(),
          }),
        });

        const result = await response.json();

        if (result.success) {
          setAutoScheduledProducts(prev => prev.map(p => 
            p.id === product.id ? { ...p, status: 'published' } : p
          ));
          success++;
          console.log(`✅ Succès: ${product.title}`);
        } else {
          setAutoScheduledProducts(prev => prev.map(p => 
            p.id === product.id ? { ...p, status: 'error', error: result.message } : p
          ));
          errors++;
          console.error(`❌ Erreur: ${product.title} - ${result.message}`);
        }
      } catch (error: any) {
        setAutoScheduledProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, status: 'error', error: error.message } : p
        ));
        errors++;
        console.error(`❌ Exception: ${product.title} - ${error.message}`);
      }

      setAutoProgress(Math.round(((i + 1) / autoScheduledProducts.length) * 100));
      
      // Délai entre publications (500ms pour respecter rate limit)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsAutoPublishing(false);
    
    console.log(`📊 Planification terminée: ${success} réussis, ${errors} erreurs`);
    
    if (errors === 0) {
      toast.success(`✅ ${success} produits planifiés avec succès !`);
    } else {
      toast.error(`⚠️ ${success} réussis, ${errors} erreurs`);
    }
  };

  // Charger le store au démarrage
  useEffect(() => {
    const stores = JSON.parse(localStorage.getItem('shopifyStores') || '[]');
    if (stores.length > 0) {
      setSelectedStore(stores[0]);
    }
  }, []);

  // Charger les blogs Shopify quand le type "article" est sélectionné
  useEffect(() => {
    if (contentType === 'article' && selectedStore) {
      fetchShopifyBlogs();
    }
  }, [contentType, selectedStore]);

  // Fonction pour récupérer les blogs Shopify
  const fetchShopifyBlogs = async () => {
    if (!selectedStore) return;
    
    setIsLoadingBlogs(true);
    try {
      const response = await fetch('/api/shopify/get-blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: selectedStore }),
      });

      const result = await response.json();
      
      if (result.success && result.data?.blogs) {
        setShopifyBlogs(result.data.blogs);
        // Sélectionner le premier blog par défaut
        if (result.data.blogs.length > 0) {
          setSelectedBlogId(result.data.blogs[0].id.toString());
        }
      } else {
        toast.error("Erreur", "Impossible de charger les blogs Shopify");
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Erreur", "Erreur lors du chargement des blogs");
    } finally {
      setIsLoadingBlogs(false);
    }
  };

  // Import CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allRows = results.data as any[];
        setRawCsvData(allRows);

        // Filtrer les produits uniques (lignes avec Title)
        const uniqueProducts = allRows.filter(row => row.Title && row.Title.trim());
        
        // Grouper par Handle pour ne garder qu'un produit par Handle
        const productsByHandle = new Map();
        uniqueProducts.forEach(row => {
          const handle = row.Handle || row.Title.toLowerCase().replace(/\s+/g, '-');
          if (!productsByHandle.has(handle)) {
            productsByHandle.set(handle, row);
          }
        });

        const products = Array.from(productsByHandle.values());
        setCsvData(products);

        console.log(`📦 Import CSV :`);
        console.log(`   ✅ ${products.length} produits uniques détectés`);
        console.log(`   📸 ${allRows.length - products.length} lignes supplémentaires (images/variantes)`);
        console.log(`   📊 Total lignes CSV : ${allRows.length}`);
      },
    });
  };

  // Générer le planning
  const generateSchedule = () => {
    if (csvData.length === 0) {
      toast.warning("CSV requis", "Veuillez d'abord importer un fichier CSV");
      return;
    }

    const scheduled: ScheduledProduct[] = [];
    const now = new Date();

    // Produits immédiats (2 secondes d'écart)
    for (let i = 0; i < Math.min(immediateCount, csvData.length); i++) {
      const product = csvData[i];
      const publishDate = new Date(now);
      publishDate.setSeconds(publishDate.getSeconds() + i * 2); // 2 secondes d'écart

      scheduled.push({
        id: `product-${Date.now()}-${i}`,
        type: contentType,
        title: product.Title,
        handle: product.Handle || product.Title.toLowerCase().replace(/\s+/g, '-'),
        data: product,
        scheduledDate: publishDate,
        status: 'pending',
      });
    }

    // Produits planifiés (fenêtre de 2-3h par jour)
    const remainingProducts = csvData.slice(immediateCount);
    const start = startDate ? new Date(startDate) : new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let productIndex = 0;
    let currentDay = 0;

    while (productIndex < remainingProducts.length) {
      // Nombre de produits pour ce jour (peut être moins que productsPerDay au dernier jour)
      const productsToday = Math.min(productsPerDay, remainingProducts.length - productIndex);
      
      // Jour de publication
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + currentDay);
      
      // Heure de début aléatoire (entre 8h et 18h)
      const startHour = 8 + Math.floor(Math.random() * 10); // 8h-18h
      const startMinute = Math.floor(Math.random() * 60); // 0-59 min
      
      // Durée de la fenêtre (2-3h en minutes)
      const windowDuration = 120 + Math.floor(Math.random() * 60); // 120-180 min (2-3h)
      
      // Répartir les produits dans cette fenêtre
      for (let i = 0; i < productsToday; i++) {
        const product = remainingProducts[productIndex];
        
        // Position dans la fenêtre (répartition égale + random)
        const basePosition = (i / Math.max(productsToday - 1, 1)) * windowDuration;
        const randomOffset = (Math.random() - 0.5) * 10; // ±5 min de variation
        const totalMinutes = Math.floor(basePosition + randomOffset);
        const randomSeconds = Math.floor(Math.random() * 60); // 0-59 secondes
        
        const publishDate = new Date(dayDate);
        publishDate.setHours(startHour, startMinute + totalMinutes, randomSeconds, 0);
        
        scheduled.push({
          id: `product-${Date.now()}-${immediateCount + productIndex}`,
          type: contentType,
          title: product.Title,
          handle: product.Handle || product.Title.toLowerCase().replace(/\s+/g, '-'),
          data: product,
          scheduledDate: publishDate,
          status: 'pending',
        });
        
        productIndex++;
      }
      
      currentDay++;
    }

    setScheduledProducts(scheduled);
    console.log(`✅ Planning généré : ${scheduled.length} produits`);
    console.log(`   🚀 ${immediateCount} immédiats`);
    console.log(`   📅 ${scheduled.length - immediateCount} planifiés`);
    
    toast.success("Planning généré !", `${scheduled.length} produits : ${immediateCount} immédiat(s), ${scheduled.length - immediateCount} planifié(s)`);
    
    // Scroll vers les stats
    setTimeout(() => {
      statsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Préparer les données du produit
  const prepareProductData = (product: ScheduledProduct) => {
    const data = product.data;
    
    // Générer ou utiliser le handle
    let handle = data.Handle;
    if (!handle || !handle.trim()) {
      handle = data.Title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Collecter toutes les images du produit (dédupliquées)
    const allImages: { src: string }[] = [];
    const seenImages = new Set<string>();
    
    rawCsvData.forEach(row => {
      if (row.Handle === data.Handle && row['Image Src'] && row['Image Src'].trim()) {
        const imageSrc = row['Image Src'].trim();
        if (!seenImages.has(imageSrc)) {
          seenImages.add(imageSrc);
          allImages.push({ src: imageSrc });
        }
      }
    });

    // Collecter toutes les variantes
    const variants: any[] = [];
    rawCsvData.forEach(row => {
      if (row.Handle === data.Handle) {
        // Vérifier si c'est une ligne de variante (a un prix ou des options)
        const hasPrice = row['Variant Price'] && row['Variant Price'].trim();
        const hasOptions = row['Option1 Value'] || row['Option2 Value'] || row['Option3 Value'];
        
        if (hasPrice || hasOptions) {
          const variant: any = {
            price: row['Variant Price'] || '0',
            compare_at_price: row['Variant Compare At Price'] || null,
            sku: row['Variant SKU'] || '',
            barcode: row['Variant Barcode'] || null,
            inventory_quantity: parseInt(row['Variant Inventory Qty'] || '0'),
            inventory_management: row['Variant Inventory Tracker'] === 'shopify' ? 'shopify' : null,
            inventory_policy: row['Variant Inventory Policy'] === 'continue' ? 'continue' : 'deny',
            fulfillment_service: row['Variant Fulfillment Service'] || 'manual',
            weight: parseFloat(row['Variant Grams'] || '0') / 1000, // Convertir grammes en kg
            weight_unit: 'kg',
            option1: row['Option1 Value'] || null,
            option2: row['Option2 Value'] || null,
            option3: row['Option3 Value'] || null,
          };

          variants.push(variant);
        }
      }
    });

    // Si aucune variante trouvée, créer une variante par défaut avec les données de la ligne principale
    if (variants.length === 0) {
      variants.push({
        price: data['Variant Price'] || '0',
        compare_at_price: data['Variant Compare At Price'] || null,
        sku: data['Variant SKU'] || '',
        barcode: data['Variant Barcode'] || null,
        inventory_quantity: parseInt(data['Variant Inventory Qty'] || '0'),
        inventory_management: data['Variant Inventory Tracker'] === 'shopify' ? 'shopify' : null,
        inventory_policy: data['Variant Inventory Policy'] === 'continue' ? 'continue' : 'deny',
        fulfillment_service: data['Variant Fulfillment Service'] || 'manual',
        weight: parseFloat(data['Variant Grams'] || '0') / 1000,
        weight_unit: 'kg',
      });
    }

    return {
      title: data.Title,
      body_html: data['Body (HTML)'] || '',
      vendor: data.Vendor || '',
      product_type: data.Type || '',
      tags: data.Tags || '',
      handle: handle,
      images: allImages.length > 0 ? allImages : undefined,
      variants: variants.length > 0 ? variants : [{ price: '0' }],
    };
  };

  // Préparer les données d'un article
  const prepareArticleData = (product: ScheduledProduct) => {
    const data = product.data;
    
    return {
      title: data.Title,
      body_html: data['Body HTML'] || data['Body (HTML)'] || '',
      author: data.Author || 'EcomFarm',
      tags: data.Tags || '',
      summary_html: data['Summary HTML'] || '',
      image: data['Image Src'] ? {
        src: data['Image Src'],
        alt: data['Image Alt'] || data.Title,
      } : undefined,
    };
  };

  // Publier tous les produits
  const publishAll = async () => {
    if (!selectedStore) {
      toast.warning("Store requis", "Veuillez sélectionner un store Shopify");
      return;
    }

    if (scheduledProducts.length === 0) {
      toast.warning("Aucun produit", "Veuillez d'abord générer un planning");
      return;
    }

    // Vérifier le blog pour les articles
    if (contentType === 'article' && !selectedBlogId) {
      toast.warning("Blog requis", "Veuillez sélectionner un blog Shopify");
      return;
    }

    if (!confirm(`Publier ${scheduledProducts.length} ${config.label.toLowerCase()} sur Shopify ?`)) {
      return;
    }

    setIsPublishing(true);
    setIsPaused(false);
    setProgress(0);
    setSuccessCount(0);
    setErrorCount(0);

    let success = 0;
    let errors = 0;

    console.log(`🚀 Début de la publication de ${scheduledProducts.length} produits`);

    for (let i = 0; i < scheduledProducts.length; i++) {
      // Vérifier si en pause
      while (isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const product = scheduledProducts[i];
      
      // Ignorer si déjà publié
      if (product.status === 'published') continue;

      try {
        // Mettre à jour le statut
        setScheduledProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, status: 'publishing' } : p
        ));

        // Déterminer le mode de publication
        const now = new Date();
        const isImmediate = product.scheduledDate <= now;
        const mode = isImmediate ? 'active' : 'scheduled';

        // Préparer les données selon le type
        let contentData;
        if (product.type === 'product') {
          contentData = prepareProductData(product);
          console.log(`📤 [${i + 1}/${scheduledProducts.length}] ${product.title} (${mode})`);
          console.log(`   📦 Variantes: ${contentData.variants.length}`);
          console.log(`   📸 Images: ${contentData.images?.length || 0}`);
          console.log(`   🏷️ SKU premier variante: ${contentData.variants[0]?.sku || 'N/A'}`);
        } else if (product.type === 'article') {
          contentData = prepareArticleData(product);
          console.log(`📤 [${i + 1}/${scheduledProducts.length}] ${product.title} (${mode})`);
          console.log(`   📝 Article de blog`);
          console.log(`   📚 Blog ID: ${selectedBlogId}`);
        } else {
          // Pour collections et pages (à implémenter si nécessaire)
          contentData = {
            title: product.data.Title,
            body_html: product.data['Body HTML'] || product.data['Body (HTML)'] || '',
          };
          console.log(`📤 [${i + 1}/${scheduledProducts.length}] ${product.title} (${mode})`);
        }

        // Appel API
        const endpoint = contentTypeConfig[product.type].endpoint;
        const dataKey = product.type; // 'product', 'collection', 'article', 'page'
        
        // Préparer le body de la requête
        const requestBody: any = {
          store: selectedStore,
          [dataKey]: contentData,
          publishMode: mode,
          scheduledDate: isImmediate ? undefined : product.scheduledDate.toISOString(),
        };

        // Ajouter le blogId pour les articles
        if (product.type === 'article') {
          requestBody.blogId = selectedBlogId;
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (result.success) {
          setScheduledProducts(prev => prev.map(p => 
            p.id === product.id ? { ...p, status: 'published' } : p
          ));
          success++;
          setSuccessCount(success);
          console.log(`✅ Succès: ${product.title}`);
        } else {
          setScheduledProducts(prev => prev.map(p => 
            p.id === product.id ? { ...p, status: 'error', error: result.message } : p
          ));
          errors++;
          setErrorCount(errors);
          console.error(`❌ Erreur: ${product.title} - ${result.message}`);
        }
      } catch (error: any) {
        setScheduledProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, status: 'error', error: error.message } : p
        ));
        errors++;
        setErrorCount(errors);
        console.error(`❌ Exception: ${product.title} - ${error.message}`);
      }

      setProgress(Math.round(((i + 1) / scheduledProducts.length) * 100));
      
      // Délai entre publications
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsPublishing(false);
    setIsPaused(false);
    
    console.log(`📊 Publication terminée: ${success} réussis, ${errors} erreurs`);
    
    if (errors === 0) {
      toast.success("Publication terminée !", `${success} produit(s) publié(s) avec succès`);
    } else if (success === 0) {
      toast.error("Échec de la publication", `${errors} erreur(s) rencontrée(s)`);
    } else {
      toast.warning("Publication terminée", `${success} réussi(s), ${errors} erreur(s)`);
    }
  };

  // Calculer le vrai nombre d'immédiats (ceux dont la date est <= maintenant)
  const actualImmediate = scheduledProducts.filter(p => p.scheduledDate <= new Date()).length;
  
  const stats = {
    total: scheduledProducts.length,
    immediate: actualImmediate,
    scheduled: scheduledProducts.length - actualImmediate,
    published: scheduledProducts.filter(p => p.status === 'published').length,
    pending: scheduledProducts.filter(p => p.status === 'pending').length,
    error: scheduledProducts.filter(p => p.status === 'error').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Planification Automatique</h1>
              <p className="text-gray-600">
                Planifiez la publication de vos produits, collections, articles et pages
              </p>
            </div>
          </div>
        </div>

        {/* Content Type Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Type de contenu</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(contentTypeConfig) as ContentType[]).map((type) => {
              const typeConfig = contentTypeConfig[type];
              const TypeIcon = typeConfig.icon;
              const isSelected = contentType === type;
              
              return (
                <button
                  key={type}
                  onClick={() => {
                    setContentType(type);
                    setCsvData([]);
                    setRawCsvData([]);
                    setScheduledProducts([]);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <TypeIcon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-600'}`}>
                    {typeConfig.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Planification Automatique - Produits Existants */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-emerald-300">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            Planification Automatique - Produits Existants
          </h2>
          <p className="text-sm text-gray-700 mb-6">
            Synchronisez vos produits Shopify et planifiez leur visibilité sur les canaux de vente. 
            Les produits seront <strong>actifs</strong> mais invisibles jusqu'à la date planifiée.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Bouton Sync */}
            <button
              onClick={syncExistingProducts}
              disabled={!selectedStore || isLoadingProducts}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingProducts ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Synchroniser Produits
                </>
              )}
            </button>

            {/* Produits par jour */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Produits par jour
              </label>
              <input
                type="number"
                min="1"
                value={autoProductsPerDay}
                onChange={(e) => setAutoProductsPerDay(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              />
            </div>

            {/* Date début */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📆 Date de début
              </label>
              <input
                type="date"
                value={autoStartDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                onChange={(e) => setAutoStartDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              />
            </div>
          </div>

          {existingProducts.length > 0 && (
            <div className="mb-4 p-4 bg-white rounded-lg border-2 border-emerald-200">
              <p className="text-sm font-semibold text-emerald-900">
                ✅ {existingProducts.length} produits synchronisés
              </p>
              <button
                onClick={generateAutoSchedule}
                className="mt-3 w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg font-semibold flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Générer le Planning
              </button>
            </div>
          )}

          {autoScheduledProducts.length > 0 && (
            <div className="p-4 bg-white rounded-lg border-2 border-emerald-200">
              <p className="text-sm font-semibold text-emerald-900 mb-3">
                📊 {autoScheduledProducts.length} produits planifiés sur {Math.ceil(autoScheduledProducts.length / autoProductsPerDay)} jours
              </p>
              <div className="text-xs text-gray-600 mb-3">
                <p>📅 Du {autoScheduledProducts[0]?.scheduledDate.toLocaleDateString('fr-FR')} au {autoScheduledProducts[autoScheduledProducts.length - 1]?.scheduledDate.toLocaleDateString('fr-FR')}</p>
              </div>
              <button
                onClick={launchAutoSchedule}
                disabled={isAutoPublishing}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAutoPublishing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Planification en cours... {autoProgress}%
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Lancer la Planification
                  </>
                )}
              </button>
              
              {/* Barre de progression */}
              {isAutoPublishing && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${autoProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Store Selector + Import CSV sur la même ligne */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className={`grid grid-cols-1 ${contentType === 'article' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
            {/* Store Selector */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🏪 Store Shopify</h2>
              <ShopifyStoreSelector 
                onStoreSelect={setSelectedStore}
                selectedStoreId={selectedStore?.id}
              />
            </div>

            {/* Blog Selector (uniquement pour les articles) */}
            {contentType === 'article' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 Blog Shopify</h2>
                {isLoadingBlogs ? (
                  <div className="flex items-center justify-center py-3 px-4 bg-gray-50 border-2 border-gray-300 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Chargement...</span>
                  </div>
                ) : shopifyBlogs.length === 0 ? (
                  <div className="py-3 px-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800 font-semibold">
                      ⚠️ Aucun blog trouvé
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Créez un blog dans Shopify d'abord
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedBlogId}
                    onChange={(e) => setSelectedBlogId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all bg-white"
                  >
                    {shopifyBlogs.map((blog) => (
                      <option key={blog.id} value={blog.id}>
                        {blog.title} ({blog.handle})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Import CSV */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📂 Importer CSV</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Choisir un fichier CSV
              </button>
              {csvData.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                  <p className="text-sm text-green-900 font-semibold text-center">
                    ✅ {csvData.length} {config.label.toLowerCase()} importé(s)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration */}
        {csvData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Configuration de la planification</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Immédiats */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  🚀 En ligne immédiatement
                </label>
                <input
                  type="number"
                  min="0"
                  value={immediateCount}
                  onChange={(e) => setImmediateCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="Nombre de produits"
                />
                <p className="text-xs text-gray-500 mt-1">Publiés en 2s d'intervalle</p>
              </div>

              {/* Par jour */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  📅 Produits par jour
                </label>
                <input
                  type="number"
                  min="1"
                  value={productsPerDay}
                  onChange={(e) => setProductsPerDay(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="Nombre de produits"
                />
                <p className="text-xs text-gray-500 mt-1">Fenêtre de 2-3h</p>
              </div>

              {/* Date début */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  📆 Date de début
                </label>
                    <input
                      type="date"
                      value={startDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                  </div>
                </div>

            <button
              onClick={generateSchedule}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              <Calendar className="w-5 h-5" />
              Générer le planning
            </button>
          </div>
        )}

        {/* Statistiques */}
        {scheduledProducts.length > 0 && (
          <div ref={statsRef} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-indigo-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Résumé du planning
            </h2>
                
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-5 bg-white border-2 border-blue-300 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</div>
                <div className="text-sm font-semibold text-blue-800">📦 Total</div>
              </div>
              <div className="p-5 bg-white border-2 border-green-300 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-green-600 mb-1">{stats.immediate}</div>
                <div className="text-sm font-semibold text-green-800">🚀 Immédiats</div>
              </div>
              <div className="p-5 bg-white border-2 border-purple-300 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-purple-600 mb-1">{stats.scheduled}</div>
                <div className="text-sm font-semibold text-purple-800">📅 Planifiés</div>
              </div>
              <div className="p-5 bg-white border-2 border-emerald-300 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{stats.published}/{stats.total}</div>
                <div className="text-sm font-semibold text-emerald-800">✅ Publiés</div>
              </div>
              <div className="p-5 bg-white border-2 border-red-300 rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-red-600 mb-1">{stats.error}</div>
                <div className="text-sm font-semibold text-red-800">❌ Erreurs</div>
              </div>
            </div>

            {/* Bouton Publier */}
            <div className="mt-6 flex gap-4 items-center">
              <button
                onClick={publishAll}
                disabled={isPublishing}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Publication en cours... {progress}%</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Publier sur Shopify</span>
                  </>
                )}
              </button>

              {isPublishing && (
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-6 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg flex items-center gap-2"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Reprendre</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              )}
            </div>

                {/* Barre de progression */}
                {isPublishing && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-green-600 font-bold">✅ {successCount} réussis</span>
                      <span className="text-red-600 font-bold">❌ {errorCount} erreurs</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Liste des produits */}
            {scheduledProducts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Produits planifiés</h2>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scheduledProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={`p-4 rounded-xl border-2 ${
                        product.status === 'published' ? 'bg-green-50 border-green-200' :
                        product.status === 'error' ? 'bg-red-50 border-red-200' :
                        product.status === 'publishing' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {index + 1}. {product.title}
                            </span>
                            {product.status === 'published' && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {product.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                            {product.status === 'publishing' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                            {product.status === 'pending' && <Clock className="w-4 h-4 text-gray-400" />}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            📅 {product.scheduledDate.toLocaleString('fr-FR')}
                            {product.scheduledDate <= new Date() && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                                Immédiat
                              </span>
                            )}
                          </div>
                          {product.error && (
                            <div className="text-sm text-red-600 mt-1">
                              ❌ {product.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
