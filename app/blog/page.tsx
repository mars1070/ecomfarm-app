"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Loader2, Download, Search, Globe, TrendingUp, CheckCircle, AlertCircle, Pause, Play, ChevronDown, ChevronUp, Copy, Clock, Trash2, Layers, Plus, Edit2, Check, X, Upload } from "lucide-react";
import { calculateCrossGroupLinks, generateLinkingVisualization, type ArticleGroup as LinkingArticleGroup } from './linkingStrategy';
import ShopifyStoreSelector from '@/components/ShopifyStoreSelector';
import PublishModeSelector from '@/components/PublishModeSelector';
import type { ShopifyStore, PublishMode, ShopifyBlog } from '@/types/shopify';

interface Article {
  keyword: string;
  country: string;
  serpAnalysis: string;
  content: string;
  slug?: string;
  fullUrl?: string;
  linkCount?: number;
  status: "pending" | "analyzing" | "writing" | "completed" | "error";
  costs?: {
    serpCost: number;
    writingCost: number;
    totalCost: number;
  };
  perplexityModel?: string;
  blogHandle: string;  // Required for linking
  groupId: string;     // Required for grouping
}

interface ArticleGroup {
  id: string;
  name: string;
  blogHandle: string;
  articles: Article[];
}

export default function ArticlesBlog() {
  const [keywords, setKeywords] = useState("");
  const [country, setCountry] = useState("fr");
  const [language, setLanguage] = useState("fr");
  const [perplexityModel, setPerplexityModel] = useState("sonar");
  const [siteUrl, setSiteUrl] = useState("");
  const [blogHandle, setBlogHandle] = useState("");
  const [groups, setGroups] = useState<ArticleGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentStep, setCurrentStep] = useState("");
  const [totalCosts, setTotalCosts] = useState({ serp: 0, writing: 0, total: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [liveTimer, setLiveTimer] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [expandedArticles, setExpandedArticles] = useState<{[key: number]: {serp: boolean, content: boolean}}>({});
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState("");
  const pauseRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Shopify states
  const [selectedStore, setSelectedStore] = useState<ShopifyStore | null>(null);
  const [publishMode, setPublishMode] = useState<PublishMode>('draft');
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [shopifyBlogs, setShopifyBlogs] = useState<ShopifyBlog[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Auto-scheduling
  const [useAutoSchedule, setUseAutoSchedule] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 5]); // Lundi, Vendredi par défaut

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  // Toggle accordion
  const toggleAccordion = (index: number, type: 'serp' | 'content') => {
    setExpandedArticles(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [type]: !prev[index]?.[type]
      }
    }));
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`✅ ${label} copié dans le presse-papier !`);
    } catch (err) {
      alert(`❌ Erreur lors de la copie`);
    }
  };

  // Export to CSV for planification
  const exportToCSV = () => {
    const completedArticles = groups.flatMap(group =>
      group.articles.filter(article => article.status === 'completed')
    );

    if (completedArticles.length === 0) {
      alert('❌ Aucun article terminé à exporter');
      return;
    }

    // CSV Header
    const header = ['Title', 'Body HTML', 'Author', 'Tags', 'Summary HTML', 'Blog Handle'];
    
    // CSV Rows
    const rows = completedArticles.map(article => {
      const group = groups.find(g => g.articles.includes(article));
      return [
        article.keyword,
        article.content.replace(/"/g, '""'), // Escape quotes
        'EcomFarm AI',
        'ai,seo,generated',
        '', // Summary HTML (vide pour l'instant)
        group?.blogHandle || blogHandle
      ];
    });

    // Create CSV content
    const csvContent = [
      header.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `articles-blog-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    alert(`✅ ${completedArticles.length} article(s) exporté(s) en CSV !`);
  };

  // Export to JSON for planification
  const exportToJSON = () => {
    const completedArticles = groups.flatMap(group =>
      group.articles.filter(article => article.status === 'completed')
    );

    if (completedArticles.length === 0) {
      alert('❌ Aucun article terminé à exporter');
      return;
    }

    const jsonData = completedArticles.map(article => {
      const group = groups.find(g => g.articles.includes(article));
      return {
        title: article.keyword,
        body_html: article.content,
        author: 'EcomFarm AI',
        tags: 'ai,seo,generated',
        summary_html: '',
        blog_handle: group?.blogHandle || blogHandle
      };
    });

    // Download JSON
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `articles-blog-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert(`✅ ${completedArticles.length} article(s) exporté(s) en JSON !`);
  };

  // Load site URL and blog handle from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem("siteUrl");
    const savedBlogHandle = localStorage.getItem("blogHandle");
    if (savedUrl) {
      setSiteUrl(savedUrl);
    }
    if (savedBlogHandle) {
      setBlogHandle(savedBlogHandle);
    }
  }, []);

  // Save site URL to localStorage when it changes
  useEffect(() => {
    if (siteUrl) {
      localStorage.setItem("siteUrl", siteUrl);
    }
  }, [siteUrl]);

  // Save blog handle to localStorage when it changes
  useEffect(() => {
    if (blogHandle) {
      localStorage.setItem("blogHandle", blogHandle);
    }
  }, [blogHandle]);

  const togglePause = () => {
    const newPauseState = !pauseRef.current;
    setIsPaused(newPauseState);
    pauseRef.current = newPauseState;
    
    // Add log message
    if (newPauseState) {
      setLogs(prev => [...prev, '⏸️ Génération mise en pause...']);
    } else {
      setLogs(prev => [...prev, '▶️ Génération reprise !']);
    }
  };

  const addArticleGroup = () => {
    if (!keywords.trim() || !blogHandle.trim()) return;
    
    const lines = keywords
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length === 0) return;

    // Validate blog handle format
    if (!/^[a-z0-9-]+$/.test(blogHandle)) {
      setErrorMessage("⚠️ Le nom du blog doit contenir uniquement des lettres minuscules, chiffres et tirets");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    const groupId = Date.now().toString();
    const newArticles: Article[] = lines.map(keyword => ({
      keyword,
      country,
      serpAnalysis: "",
      content: "",
      status: "pending",
      perplexityModel,
      costs: { serpCost: 0, writingCost: 0, totalCost: 0 },
      blogHandle,
      groupId,
    }));

    const newGroup: ArticleGroup = {
      id: groupId,
      name: `${blogHandle} (${lines.length} articles)`,
      blogHandle,
      articles: newArticles,
    };

    setGroups([...groups, newGroup]);
    setKeywords("");
    // Don't clear blogHandle to allow adding more groups with same blog
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const startEditingSlug = (groupId: string, currentSlug: string) => {
    setEditingGroupId(groupId);
    setEditingSlug(currentSlug);
  };

  const saveSlug = (groupId: string) => {
    if (!editingSlug.trim() || !/^[a-z0-9-]+$/.test(editingSlug)) {
      setErrorMessage("⚠️ Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          blogHandle: editingSlug,
          name: `${editingSlug} (${g.articles.length} articles)`,
          articles: g.articles.map(a => ({ ...a, blogHandle: editingSlug }))
        };
      }
      return g;
    }));

    setEditingGroupId(null);
    setEditingSlug("");
  };

  const cancelEditingSlug = () => {
    setEditingGroupId(null);
    setEditingSlug("");
  };

  // Get all articles from all groups in order
  const allArticles = groups.flatMap(g => g.articles);

  const generateAllArticles = async () => {
    const claudeApiKey = localStorage.getItem("anthropic_api_key");
    const perplexityApiKey = localStorage.getItem("perplexity_api_key");
    
    if (!claudeApiKey) {
      setErrorMessage("⚠️ Veuillez configurer votre clé API Claude dans les Paramètres");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    if (!perplexityApiKey) {
      setErrorMessage("⚠️ Veuillez configurer votre clé API Perplexity pour la recherche SERP");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    if (!siteUrl || !siteUrl.trim()) {
      setErrorMessage("⚠️ Veuillez entrer l'URL de votre site pour le maillage interne");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    // Validate URL format
    try {
      new URL(siteUrl);
    } catch {
      setErrorMessage("⚠️ L'URL du site n'est pas valide (ex: https://votre-site.com)");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    if (groups.length === 0) {
      setErrorMessage("⚠️ Veuillez ajouter au moins un groupe d'articles");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    
    // Calculate cross-group linking strategy
    const linkingPlan = calculateCrossGroupLinks(groups);
    
    const linkInfo = groups.length > 1 
      ? ` avec maillage cross-group (3 liens/article)` 
      : ` (2 liens/article)`;
    setLogs([`🚀 Démarrage de la génération de ${allArticles.length} article(s) dans ${groups.length} groupe(s)${linkInfo}...`, '']);

    for (let i = 0; i < allArticles.length; i++) {
      const article = allArticles[i];
      const articlePlan = linkingPlan[i];
      
      // Check for pause before processing each article
      while (pauseRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Retry logic: 3 attempts max
      let attempt = 0;
      const maxAttempts = 3;
      let success = false;
      
      while (attempt < maxAttempts && !success) {
        attempt++;
        
        try {
          // Show retry notification if not first attempt
          if (attempt > 1) {
            const retryMsg = `🔄 Tentative ${attempt}/${maxAttempts} pour "${article.keyword}"...`;
            setLogs(prev => [...prev, retryMsg]);
            setErrorMessage(`🔄 Nouvelle tentative (${attempt}/${maxAttempts}) pour "${article.keyword}"`);
            setTimeout(() => setErrorMessage(""), 3000);
          }
          
          // Check pause before SERP
          while (pauseRef.current) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Step 1: SERP Analysis
          const stepMsg = `📊 [${i + 1}/${allArticles.length}] Analyse SERP pour "${article.keyword}" (Blog: ${article.blogHandle})...${attempt > 1 ? ` (Tentative ${attempt})` : ''}`;
          setCurrentStep(stepMsg);
          setLogs(prev => [...prev, stepMsg]);
        
        // Update article status in groups
        setGroups(prev => prev.map(g => ({
          ...g,
          articles: g.articles.map(a => 
            a.groupId === article.groupId && a.keyword === article.keyword
              ? { ...a, status: "analyzing" as const }
              : a
          )
        })));

        const serpStartTime = Date.now();

        const serpResponse = await fetch("/api/analyze-serp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: article.keyword,
            country: article.country,
            perplexityApiKey,
            claudeApiKey,
            language,
            perplexityModel: article.perplexityModel || perplexityModel,
          }),
        });

        if (!serpResponse.ok) {
          const errorData = await serpResponse.json();
          console.error("SERP API Error:", errorData);
          throw new Error(errorData.error || "Erreur lors de l'analyse SERP");
        }

        const { analysis, costs: serpCosts } = await serpResponse.json();
        const serpEndTime = Date.now();
        const serpDuration = ((serpEndTime - serpStartTime) / 1000).toFixed(1);
        
        // Check for SERP mismatch (e.g., "Offset Grillz" returning BBQ results instead of jewelry)
        if (analysis && analysis.startsWith("SERP_MISMATCH:")) {
          const mismatchReason = analysis.replace("SERP_MISMATCH:", "").trim();
          const errorLog = `❌ SERP incohérent pour "${article.keyword}": ${mismatchReason}`;
          setLogs(prev => [...prev, errorLog, '⚠️ Article ignoré - SERP ne correspond pas à l\'intention de recherche attendue', '']);
          
          // Mark article as error
          setGroups(prev => prev.map(g => ({
            ...g,
            articles: g.articles.map(a => 
              a.groupId === article.groupId && a.keyword === article.keyword
                ? { ...a, status: "error" as const, error: `SERP incohérent: ${mismatchReason}` }
                : a
            )
          })));
          
          continue; // Skip to next article
        }
        
        const serpLog = `✅ Analyse SERP terminée en ${serpDuration}s - Coût: $${serpCosts?.total?.toFixed(4) || '0.0000'}`;
        setLogs(prev => [...prev, serpLog]);

        // Update article with SERP analysis
        setGroups(prev => prev.map(g => ({
          ...g,
          articles: g.articles.map(a => 
            a.groupId === article.groupId && a.keyword === article.keyword
              ? { ...a, serpAnalysis: analysis }
              : a
          )
        })));

        // Step 2: Article Writing
        const writeMsg = `✍️ [${i + 1}/${allArticles.length}] Rédaction de l'article "${article.keyword}" (Blog: ${article.blogHandle})...`;
        setCurrentStep(writeMsg);
        setLogs(prev => [...prev, writeMsg]);
        
        // Update article status to writing
        setGroups(prev => prev.map(g => ({
          ...g,
          articles: g.articles.map(a => 
            a.groupId === article.groupId && a.keyword === article.keyword
              ? { ...a, status: "writing" as const }
              : a
          )
        })));

        const writeStartTime = Date.now();
        
        // Start live timer
        setLiveTimer(0);
        const interval = setInterval(() => {
          setLiveTimer(prev => prev + 1);
        }, 1000);
        setTimerInterval(interval);
        
        setLogs(prev => [...prev, `⏱️  Timer démarré pour la rédaction...`]);

        // Check pause before writing
        while (pauseRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Use linking plan for correct internal linking
        const articlePlan = linkingPlan[i];
        
        // Determine position based on linking plan
        const isHomepageLink = articlePlan.links.previous?.type === 'homepage';
        const position = isHomepageLink ? "first" : "middle";

        const writeResponse = await fetch("/api/write-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: article.keyword,
            serpAnalysis: analysis,
            claudeApiKey,
            language,
            siteUrl,
            blogHandle: article.blogHandle,
            allArticles: allArticles.map(a => ({ keyword: a.keyword, blogHandle: a.blogHandle })),
            position,
            previousArticle: articlePlan.links.previous?.type === 'homepage' 
              ? { type: 'homepage' } 
              : articlePlan.links.previous 
                ? { keyword: articlePlan.links.previous.keyword, blogHandle: articlePlan.links.previous.blogHandle }
                : null,
            nextArticle: articlePlan.links.next 
              ? { keyword: articlePlan.links.next.keyword, blogHandle: articlePlan.links.next.blogHandle }
              : null,
            crossGroupArticle: articlePlan.links.crossGroup ? {
              keyword: articlePlan.links.crossGroup.keyword,
              blogHandle: articlePlan.links.crossGroup.blogHandle,
            } : null,
          }),
        });

        if (!writeResponse.ok) {
          const errorData = await writeResponse.json();
          console.error("Writing API Error:", errorData);
          throw new Error(errorData.error || "Erreur lors de la rédaction");
        }

        const { content, slug, fullUrl, linkCount, costs: writingCosts, wordCount, h2Count } = await writeResponse.json();
        const writeEndTime = Date.now();
        const writeDuration = ((writeEndTime - writeStartTime) / 1000).toFixed(1);
        
        // Stop timer
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
        
        // Detailed logs
        const writeLog = `✅ Rédaction terminée en ${writeDuration}s`;
        const detailsLog = `   📝 ${wordCount || content.split(' ').length} mots | 📑 ${h2Count || 0} sections H2 | 🔗 ${linkCount || 0} liens internes`;
        const costLog = `   💰 Coût rédaction: $${writingCosts?.total?.toFixed(4) || '0.0000'} (Input: ${writingCosts?.input || 0} tokens, Output: ${writingCosts?.output || 0} tokens)`;
        setLogs(prev => [...prev, writeLog, detailsLog, costLog]);

        const articleCosts = {
          serpCost: serpCosts?.total || 0,
          writingCost: writingCosts?.total || 0,
          totalCost: (serpCosts?.total || 0) + (writingCosts?.total || 0),
        };

        const totalLog = `💰 Article "${article.keyword}" terminé - Coût total: $${articleCosts.totalCost.toFixed(4)}`;
        const summaryLog = `   ⚡ Temps total: ${((writeEndTime - serpStartTime) / 1000).toFixed(1)}s (SERP: ${serpDuration}s + Rédaction: ${writeDuration}s)`;
        setLogs(prev => [...prev, totalLog, summaryLog, '']);

        // Update article with completed content
        setGroups(prev => prev.map(g => ({
          ...g,
          articles: g.articles.map(a => 
            a.groupId === article.groupId && a.keyword === article.keyword
              ? { 
                  ...a, 
                  content,
                  slug,
                  fullUrl,
                  linkCount,
                  status: "completed" as const,
                  costs: articleCosts,
                }
              : a
          )
        })));

        // Update total costs
        setTotalCosts(prev => ({
          serp: prev.serp + articleCosts.serpCost,
          writing: prev.writing + articleCosts.writingCost,
          total: prev.total + articleCosts.totalCost,
        }));

        // Mark as success to exit retry loop
        success = true;

      } catch (error: any) {
        console.error(`Error generating article (attempt ${attempt}/${maxAttempts}):`, error);
        
        // If this is not the last attempt, retry
        if (attempt < maxAttempts) {
          const retryWaitMsg = `⚠️ Erreur détectée. Nouvelle tentative dans 3 secondes...`;
          setLogs(prev => [...prev, retryWaitMsg]);
          setErrorMessage(`⚠️ Erreur pour "${article.keyword}". Retry ${attempt + 1}/${maxAttempts} dans 3s...`);
          
          // Wait 3 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Update article status back to pending for retry
          setGroups(prev => prev.map(g => ({
            ...g,
            articles: g.articles.map(a => 
              a.groupId === article.groupId && a.keyword === article.keyword
                ? { ...a, status: "pending" as const }
                : a
            )
          })));
        } else {
          // All attempts failed - mark as error
          setGroups(prev => prev.map(g => ({
            ...g,
            articles: g.articles.map(a => 
              a.groupId === article.groupId && a.keyword === article.keyword
                ? { ...a, status: "error" as const }
                : a
            )
          })));
          
          const errorLog = `❌ ÉCHEC après ${maxAttempts} tentatives pour "${article.keyword}": ${error.message}`;
          setLogs(prev => [...prev, errorLog, '']);
          setErrorMessage(`❌ Échec définitif pour "${article.keyword}" après ${maxAttempts} tentatives`);
          setTimeout(() => setErrorMessage(""), 5000);
        }
      }
      } // End of retry while loop
    }

    const completedCount = allArticles.filter(a => a.status === "completed").length;
    const finalLog = `✅ Génération terminée ! ${completedCount}/${allArticles.length} article(s) réussi(s)`;
    setLogs(prev => [...prev, '', finalLog]);
    setIsProcessing(false);
    setCurrentStep("");
  };

  const downloadArticles = () => {
    let output = "# ARTICLES DE BLOG SEO\n";
    output += `# Date: ${new Date().toLocaleDateString()}\n`;
    output += `# Nombre d'articles: ${allArticles.length}\n\n`;
    output += "=".repeat(80) + "\n\n";

    allArticles.forEach((article: Article, index: number) => {
      output += `\nARTICLE ${index + 1}: ${article.keyword}\n`;
      output += `Pays: ${article.country}\n`;
      output += `Statut: ${article.status}\n\n`;
      
      if (article.serpAnalysis) {
        output += "--- ANALYSE SERP ---\n\n";
        output += article.serpAnalysis;
        output += "\n\n" + "=".repeat(80) + "\n\n";
      }
      
      if (article.content) {
        output += "--- CONTENU ARTICLE (HTML) ---\n\n";
        output += article.content;
        output += "\n\n" + "=".repeat(80) + "\n\n";
      }
    });

    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `articles-blog-${Date.now()}.txt`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch Shopify blogs when store is selected
  useEffect(() => {
    if (selectedStore) {
      fetchShopifyBlogs();
    } else {
      setShopifyBlogs([]);
      setSelectedBlogId("");
    }
  }, [selectedStore]);

  const fetchShopifyBlogs = async () => {
    if (!selectedStore) return;

    try {
      const response = await fetch("/api/shopify/get-blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: selectedStore }),
      });

      const result = await response.json();
      if (result.success && result.data.blogs) {
        setShopifyBlogs(result.data.blogs);
        if (result.data.blogs.length > 0) {
          setSelectedBlogId(result.data.blogs[0].id.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching Shopify blogs:", error);
    }
  };

  const publishToShopify = async (article: Article) => {
    if (!selectedStore || !selectedBlogId) {
      alert("⚠️ Veuillez sélectionner un store Shopify et un blog");
      return;
    }

    if (!article.content) {
      alert("⚠️ L'article n'a pas de contenu à publier");
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch("/api/shopify/publish-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: selectedStore,
          blogId: selectedBlogId,
          article: {
            title: article.keyword,
            body_html: article.content,
            author: "EcomFarm",
            tags: article.country,
            summary_html: extractExcerpt(article.content),
            metafields: [
              {
                namespace: "global",
                key: "description_tag",
                value: extractMetaDescription(article.content),
                type: "single_line_text_field"
              }
            ]
          },
          publishMode,
          scheduledDate: publishMode === 'scheduled' ? scheduledDate : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Article "${article.keyword}" publié sur Shopify !`);
        setLogs(prev => [...prev, `✅ Article "${article.keyword}" publié sur Shopify (${publishMode})`]);
      } else {
        alert(`❌ Erreur: ${result.message}`);
        setLogs(prev => [...prev, `❌ Erreur publication Shopify: ${result.message}`]);
      }
    } catch (error: any) {
      alert(`❌ Erreur de publication: ${error.message}`);
      setLogs(prev => [...prev, `❌ Erreur publication: ${error.message}`]);
    } finally {
      setIsPublishing(false);
    }
  };

  // Toggle day selection
  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  // Extract first <p> paragraph from article
  const extractFirstParagraph = (htmlContent: string): string => {
    // Match first <p>...</p> tag
    const pMatch = htmlContent.match(/<p[^>]*>(.*?)<\/p>/s);
    
    if (pMatch && pMatch[1]) {
      // Remove inner HTML tags (like <a>, <strong>, etc.) but keep text
      const text = pMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      return text;
    }
    
    // Fallback: remove all HTML and get first 200 chars
    const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.substring(0, 200) + '...';
  };

  // Extract excerpt from first paragraph (full paragraph)
  const extractExcerpt = (htmlContent: string): string => {
    return extractFirstParagraph(htmlContent);
  };

  // Extract meta description from first paragraph (Google will cut if needed)
  const extractMetaDescription = (htmlContent: string): string => {
    return extractFirstParagraph(htmlContent);
  };

  // Generate auto-schedule dates
  const generateAutoScheduleDates = (count: number): string[] => {
    if (!startDate || !useAutoSchedule || selectedDays.length === 0) return [];
    
    const dates: string[] = [];
    const start = new Date(startDate);
    
    let currentDate = new Date(start);
    let articleIndex = 0;
    
    while (articleIndex < count) {
      const dayOfWeek = currentDate.getDay();
      
      if (selectedDays.includes(dayOfWeek)) {
        // Random hour between 12-15
        const hour = 12 + Math.floor(Math.random() * 3);
        // Random minutes
        const minutes = Math.floor(Math.random() * 60);
        
        currentDate.setHours(hour, minutes, 0, 0);
        dates.push(currentDate.toISOString());
        articleIndex++;
      }
      
      // Next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const publishAllToShopify = async () => {
    if (!selectedStore || !selectedBlogId) {
      alert("⚠️ Veuillez sélectionner un store Shopify et un blog");
      return;
    }

    const completedArticles = allArticles.filter(a => a.status === "completed" && a.content);
    
    if (completedArticles.length === 0) {
      alert("⚠️ Aucun article complété à publier");
      return;
    }
    
    // Generate auto-schedule dates if enabled
    const autoScheduleDates = useAutoSchedule && publishMode === 'scheduled' 
      ? generateAutoScheduleDates(completedArticles.length)
      : [];

    if (!confirm(`Publier ${completedArticles.length} article(s) sur Shopify ?`)) {
      return;
    }

    setIsPublishing(true);
    setLogs(prev => [...prev, `🚀 Publication de ${completedArticles.length} article(s) sur Shopify...`]);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < completedArticles.length; i++) {
      const article = completedArticles[i];
      const articleDate = autoScheduleDates[i] || scheduledDate;
      
      try {
        const response = await fetch("/api/shopify/publish-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store: selectedStore,
            blogId: selectedBlogId,
            article: {
              title: article.keyword,
              body_html: article.content,
              author: "EcomFarm",
              tags: article.country,
              summary_html: extractExcerpt(article.content),
              metafields: [
                {
                  namespace: "global",
                  key: "description_tag",
                  value: extractMetaDescription(article.content),
                  type: "single_line_text_field"
                }
              ]
            },
            publishMode,
            scheduledDate: publishMode === 'scheduled' ? articleDate : undefined,
          }),
        });

        const result = await response.json();

        if (result.success) {
          successCount++;
          if (autoScheduleDates[i]) {
            const date = new Date(autoScheduleDates[i]);
            setLogs(prev => [...prev, `✅ "${article.keyword}" programmé le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`]);
          } else {
            setLogs(prev => [...prev, `✅ "${article.keyword}" publié`]);
          }
        } else {
          errorCount++;
          setLogs(prev => [...prev, `❌ "${article.keyword}" erreur: ${result.message}`]);
        }

        // Petit délai entre chaque publication
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        errorCount++;
        setLogs(prev => [...prev, `❌ "${article.keyword}" erreur: ${error.message}`]);
      }
    }

    setIsPublishing(false);
    setLogs(prev => [...prev, `✅ Publication terminée: ${successCount} réussi(s), ${errorCount} erreur(s)`]);
    alert(`Publication terminée !\n✅ ${successCount} réussi(s)\n❌ ${errorCount} erreur(s)`);
  };

  const completedCount = allArticles.filter(a => a.status === "completed").length;
  const progressPercentage = allArticles.length > 0 
    ? Math.round((completedCount / allArticles.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Articles de Blog SEO</h1>
              <p className="text-gray-600">
                Recherche SERP + Rédaction optimisée
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

        {/* Current Step */}
        {isProcessing && currentStep && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-3" />
              <p className="text-sm font-medium text-blue-900">{currentStep}</p>
            </div>
          </div>
        )}

        {/* Statistics */}
        {allArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Articles</div>
              <div className="text-2xl font-bold text-gray-900">{allArticles.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Complétés</div>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Progression</div>
              <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-sm border-2 border-purple-300 p-4">
              <div className="text-sm text-purple-700 font-semibold mb-1">💰 Coût Total</div>
              <div className="text-2xl font-bold text-purple-600">${totalCosts.total.toFixed(4)}</div>
              <div className="text-xs text-purple-600 mt-1">
                SERP: ${totalCosts.serp.toFixed(4)} | Rédaction: ${totalCosts.writing.toFixed(4)}
              </div>
            </div>
          </div>
        )}

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Configuration
          </h2>

          {/* Perplexity Model Selection */}
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
            <label className="block text-sm font-semibold text-indigo-900 mb-3">
              🔍 Modèle Perplexity (Recherche SERP)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setPerplexityModel("sonar")}
                disabled={isProcessing}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  perplexityModel === "sonar"
                    ? "border-indigo-500 bg-indigo-100 shadow-md"
                    : "border-gray-300 bg-white hover:border-indigo-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-indigo-900">Sonar (Standard)</span>
                  {perplexityModel === "sonar" && (
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div className="text-xs text-indigo-700 space-y-1">
                  <div>📊 Modèle: llama-3.1-sonar-large-128k-online</div>
                  <div className="font-semibold text-green-700">💰 $1 / 1M tokens input</div>
                  <div className="font-semibold text-green-700">💰 $1 / 1M tokens output</div>
                  <div className="text-indigo-600 mt-2">~$0.003-0.005 par recherche</div>
                </div>
              </button>

              <button
                onClick={() => setPerplexityModel("sonar-pro")}
                disabled={isProcessing}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  perplexityModel === "sonar-pro"
                    ? "border-purple-500 bg-purple-100 shadow-md"
                    : "border-gray-300 bg-white hover:border-purple-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-purple-900">Sonar Pro ⭐</span>
                  {perplexityModel === "sonar-pro" && (
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div className="text-xs text-purple-700 space-y-1">
                  <div>📊 Modèle: sonar-pro</div>
                  <div className="font-semibold text-orange-700">💰 $3 / 1M tokens input</div>
                  <div className="font-semibold text-orange-700">💰 $15 / 1M tokens output</div>
                  <div className="text-purple-600 mt-2">~$0.010-0.020 par recherche</div>
                  <div className="text-purple-800 font-semibold mt-1">✨ Meilleure qualité</div>
                </div>
              </button>
            </div>
            <div className="mt-3 text-xs text-indigo-700 bg-white rounded p-2 border border-indigo-200">
              💡 <strong>Test recommandé:</strong> Générez 1 article avec chaque modèle pour comparer qualité vs coût
            </div>
          </div>

          {/* 3 Fields in One Line: Country (SERP) + Language (Writing) + Site URL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌍 Pays cible
              </label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  // Auto-set language based on country (Perplexity codes + Writing language)
                  const countryToLang: {[key: string]: string} = {
                    // Anglophone
                    'us': 'en', 'gb': 'en', 'ca': 'en', 'au': 'en', 'nz': 'en', 'in': 'en', 'sg': 'en',
                    // Europe Occidentale
                    'fr': 'fr', 'de': 'de', 'at': 'de', 'ch': 'de', 'es': 'es', 'it': 'it', 'pt': 'pt', 'nl': 'nl', 'be': 'nl',
                    // Amérique Latine
                    'mx': 'es', 'ar': 'es', 'co': 'es', 'cl': 'es', 'br': 'pt',
                    // Europe du Nord (langues locales)
                    'se': 'sv', 'no': 'no', 'dk': 'da', 'fi': 'fi',
                    // Europe de l'Est
                    'pl': 'pl', 'ru': 'ru', 'gr': 'el', 'cz': 'cs', 'hu': 'hu', 'ro': 'ro', 'bg': 'bg',
                    'sk': 'sk', 'si': 'sl', 'hr': 'hr', 'rs': 'sr', 'ua': 'uk',
                    // Asie
                    'jp': 'ja', 'cn': 'zh', 'kr': 'ko',
                    // Moyen-Orient
                    'ae': 'ar', 'sa': 'ar', 'tr': 'tr'
                  };
                  if (countryToLang[e.target.value]) {
                    setLanguage(countryToLang[e.target.value]);
                  }
                }}
                disabled={isProcessing}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              >
                <optgroup label="🌎 Amériques">
                  <option value="us">🇺🇸 États-Unis</option>
                  <option value="ca">🇨🇦 Canada</option>
                  <option value="mx">🇲🇽 Mexique</option>
                  <option value="br">🇧🇷 Brésil</option>
                  <option value="ar">🇦🇷 Argentine</option>
                  <option value="co">🇨🇴 Colombie</option>
                  <option value="cl">🇨🇱 Chili</option>
                </optgroup>
                <optgroup label="🌍 Europe">
                  <option value="fr">🇫🇷 France</option>
                  <option value="gb">🇬🇧 Royaume-Uni</option>
                  <option value="de">🇩🇪 Allemagne</option>
                  <option value="es">🇪🇸 Espagne</option>
                  <option value="it">🇮🇹 Italie</option>
                  <option value="nl">🇳🇱 Pays-Bas</option>
                  <option value="be">🇧🇪 Belgique</option>
                  <option value="ch">🇨🇭 Suisse</option>
                  <option value="at">🇦🇹 Autriche</option>
                  <option value="pt">🇵🇹 Portugal</option>
                  <option value="pl">🇵🇱 Pologne</option>
                  <option value="se">🇸🇪 Suède</option>
                  <option value="no">🇳🇴 Norvège</option>
                  <option value="dk">🇩🇰 Danemark</option>
                  <option value="fi">🇫🇮 Finlande</option>
                  <option value="gr">🇬🇷 Grèce</option>
                  <option value="cz">🇨🇿 République Tchèque</option>
                  <option value="hu">🇭🇺 Hongrie</option>
                  <option value="ro">🇷🇴 Roumanie</option>
                  <option value="bg">🇧🇬 Bulgarie</option>
                  <option value="sk">🇸🇰 Slovaquie</option>
                  <option value="si">🇸🇮 Slovénie</option>
                  <option value="hr">🇭🇷 Croatie</option>
                  <option value="rs">🇷🇸 Serbie</option>
                  <option value="ua">🇺🇦 Ukraine</option>
                  <option value="ru">🇷🇺 Russie</option>
                  <option value="tr">🇹🇷 Turquie</option>
                </optgroup>
                <optgroup label="🌏 Asie-Pacifique">
                  <option value="jp">🇯🇵 Japon</option>
                  <option value="kr">🇰🇷 Corée du Sud</option>
                  <option value="cn">🇨🇳 Chine</option>
                  <option value="in">🇮🇳 Inde</option>
                  <option value="sg">🇸🇬 Singapour</option>
                  <option value="au">🇦🇺 Australie</option>
                  <option value="nz">🇳🇿 Nouvelle-Zélande</option>
                </optgroup>
                <optgroup label="🌍 Moyen-Orient">
                  <option value="ae">🇦🇪 Émirats Arabes Unis</option>
                  <option value="sa">🇸🇦 Arabie Saoudite</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌐 Langue de rédaction
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isProcessing}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              >
                <optgroup label="🌍 Langues Européennes">
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                  <option value="es">Espagnol</option>
                  <option value="de">Allemand</option>
                  <option value="it">Italien</option>
                  <option value="pt">Portugais</option>
                  <option value="nl">Néerlandais</option>
                  <option value="pl">Polonais</option>
                  <option value="ru">Russe</option>
                  <option value="sv">Suédois</option>
                  <option value="no">Norvégien</option>
                  <option value="da">Danois</option>
                  <option value="fi">Finnois</option>
                  <option value="el">Grec</option>
                  <option value="cs">Tchèque</option>
                  <option value="hu">Hongrois</option>
                  <option value="ro">Roumain</option>
                  <option value="bg">Bulgare</option>
                  <option value="sk">Slovaque</option>
                  <option value="sl">Slovène</option>
                  <option value="hr">Croate</option>
                  <option value="sr">Serbe</option>
                  <option value="uk">Ukrainien</option>
                  <option value="tr">Turc</option>
                </optgroup>
                <optgroup label="🌏 Langues Asiatiques">
                  <option value="ja">Japonais</option>
                  <option value="ko">Coréen</option>
                  <option value="zh">Chinois</option>
                  <option value="hi">Hindi</option>
                  <option value="th">Thaï</option>
                  <option value="vi">Vietnamien</option>
                  <option value="id">Indonésien</option>
                </optgroup>
                <optgroup label="🌍 Autres Langues">
                  <option value="ar">Arabe</option>
                  <option value="he">Hébreu</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌐 URL de votre site
              </label>
              <input
                type="url"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://votre-site.com"
                disabled={isProcessing}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Add Group Section - Split Layout 50/50 */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Mots-clés / Sujets
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Keywords Input (50%) */}
              <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎯 Liste des mots-clés <span className="text-gray-500 font-normal">(un par ligne)</span>
              </label>
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder={"Entrez vos mots-clés :\n\nComment choisir des grillz\nEntretien des grillz en or\nGrillz personnalisés vs standard"}
                  disabled={isProcessing}
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-blue-50/50"
                />
                <p className="text-sm text-gray-600 mt-2">
                  💡 {keywords.split('\n').filter(l => l.trim()).length} mot(s)-clé(s)
                </p>
              </div>

              {/* Right: Blog Handle + Add Button (50%) */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📝 Catégorie du Blog Shopify
                  </label>
                  <input
                    type="text"
                    value={blogHandle}
                    onChange={(e) => setBlogHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="grillz-guide"
                    disabled={isProcessing}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Le "handle" est le slug utilisé dans l'URL après /blogs/
                  </p>
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-900 mb-1">
                      Aperçu de l'URL finale :
                    </p>
                    <p className="text-xs text-purple-700 font-mono break-all">
                      {siteUrl || "https://votre-site.com"}/blogs/<span className="font-bold text-purple-900">{blogHandle || "nom-du-blog"}</span>/votre-mot-cle
                    </p>
                  </div>
                </div>

                <button
                  onClick={addArticleGroup}
                  disabled={isProcessing || !keywords.trim() || !blogHandle.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter Groupe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Display */}
        {groups.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-md border-2 border-purple-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-purple-500" />
                📚 Groupes d'Articles ({groups.length})
              </h2>
              <button
                onClick={() => setShowSchemaModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
              >
                📊 Voir le Schéma de Maillage
              </button>
            </div>

            {/* Shopify Publication Section */}
            {allArticles.length > 0 && (
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

                  {/* Blog Selector */}
                  {selectedStore && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📝 Blog Shopify
                      </label>
                      {shopifyBlogs.length > 0 ? (
                        <select
                          value={selectedBlogId}
                          onChange={(e) => setSelectedBlogId(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-green-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          {shopifyBlogs.map((blog) => (
                            <option key={blog.id} value={blog.id}>
                              {blog.title} ({blog.handle})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="px-4 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-sm text-yellow-700">
                          ⚠️ Aucun blog trouvé. Créez-en un dans Shopify.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Publish Mode Selector */}
                {selectedStore && selectedBlogId && (
                  <>
                    <PublishModeSelector 
                      onModeChange={(mode, date) => {
                        setPublishMode(mode);
                        if (date) setScheduledDate(date);
                      }}
                      defaultMode={publishMode}
                    />

                    {/* Auto-Schedule Options */}
                    {publishMode === 'scheduled' && (
                      <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer mb-3">
                          <input
                            type="checkbox"
                            checked={useAutoSchedule}
                            onChange={(e) => setUseAutoSchedule(e.target.checked)}
                            className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                          />
                          <div>
                            <span className="text-sm font-semibold text-purple-900">
                              ⚡ Planification Automatique
                            </span>
                            <p className="text-xs text-purple-700">
                              Répartir automatiquement les articles sur plusieurs semaines
                            </p>
                          </div>
                        </label>

                        {useAutoSchedule && (
                          <div className="space-y-3 mt-3 pl-8">
                            <div>
                              <label className="block text-xs font-medium text-purple-900 mb-1">
                                📅 Date de début
                              </label>
                              <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-purple-900 mb-2">
                                📅 Jours de publication
                              </label>
                              <div className="grid grid-cols-7 gap-2">
                                {[
                                  { day: 0, label: 'Dim' },
                                  { day: 1, label: 'Lun' },
                                  { day: 2, label: 'Mar' },
                                  { day: 3, label: 'Mer' },
                                  { day: 4, label: 'Jeu' },
                                  { day: 5, label: 'Ven' },
                                  { day: 6, label: 'Sam' },
                                ].map(({ day, label }) => (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(day)}
                                    className={`px-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                                      selectedDays.includes(day)
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'bg-white text-purple-600 border-2 border-purple-300 hover:bg-purple-100'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-purple-700 mt-2">
                                {selectedDays.length} jour(s) sélectionné(s) • {selectedDays.length > 0 ? `${selectedDays.length} article(s)/semaine` : 'Sélectionnez au moins 1 jour'}
                              </p>
                            </div>

                            <div className="bg-purple-100 rounded-lg p-3 text-xs text-purple-800">
                              <p className="font-semibold mb-1">🕐 Heures de publication :</p>
                              <p>Entre 12h et 15h (heure et minutes aléatoires)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Publish All Button */}
                    <div className="mt-6 flex gap-3">
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
                            <Upload className="w-5 h-5" />
                            Publier {completedCount} article{completedCount > 1 ? 's' : ''} sur Shopify
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-3 text-xs text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                      💡 <strong>Info :</strong> Les articles seront publiés en mode <strong>{publishMode === 'draft' ? 'Brouillon' : publishMode === 'scheduled' ? 'Programmé' : 'Actif'}</strong>
                      {publishMode === 'scheduled' && scheduledDate && ` le ${new Date(scheduledDate).toLocaleDateString('fr-FR')}`}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="space-y-4 mb-4">
              {groups.map((group, groupIndex) => (
                <div key={group.id} className="border-2 border-indigo-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-5 flex items-center justify-between transition-all">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                        <span className="text-2xl font-bold text-white">{groupIndex + 1}</span>
                      </div>
                      <div className="flex-1">
                        {editingGroupId === group.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingSlug}
                              onChange={(e) => setEditingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                              className="px-3 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base font-semibold"
                              placeholder="nom-du-blog"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveSlug(group.id);
                                if (e.key === 'Escape') cancelEditingSlug();
                              }}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                              📁 {group.blogHandle}
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                {group.articles.length} article{group.articles.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1 font-mono flex items-center gap-2">
                              <span className="text-indigo-600">🔗</span>
                              /blogs/<span className="font-semibold text-indigo-700">{group.blogHandle}</span>/...
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingGroupId === group.id ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveSlug(group.id);
                            }}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            title="Sauvegarder"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditingSlug();
                            }}
                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            title="Annuler"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingSlug(group.id, group.blogHandle);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Modifier le slug"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`🗑️ Supprimer le groupe "${group.blogHandle}" et ses ${group.articles.length} articles ?`)) {
                                removeGroup(group.id);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Supprimer le groupe"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                        title="Ouvrir/Fermer"
                      >
                        {expandedGroups.has(group.id) ? (
                          <ChevronUp className="w-6 h-6 text-indigo-600" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-indigo-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedGroups.has(group.id) && (
                    <div className="p-5 bg-gradient-to-br from-gray-50 to-indigo-50 border-t-2 border-indigo-200">
                      <div className="space-y-3">
                        {group.articles.map((article, articleIndex) => (
                          <div key={articleIndex} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-colors shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-white">{articleIndex + 1}</span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-base">{article.keyword}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                    🌍 {article.country.toUpperCase()}
                                  </span>
                                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                                    article.perplexityModel === 'sonar-pro' 
                                      ? 'bg-orange-100 text-orange-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {article.perplexityModel === 'sonar-pro' ? '⭐ Sonar Pro' : '✓ Sonar'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              {article.status === 'pending' && (
                                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg flex items-center gap-1.5">
                                  ⏳ En attente
                                </span>
                              )}
                              {article.status === 'analyzing' && (
                                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg flex items-center gap-1.5 animate-pulse">
                                  📊 Analyse...
                                </span>
                              )}
                              {article.status === 'writing' && (
                                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg flex items-center gap-1.5 animate-pulse">
                                  ✍️ Rédaction...
                                </span>
                              )}
                              {article.status === 'completed' && (
                                <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-lg flex items-center gap-1.5">
                                  ✅ Terminé
                                </span>
                              )}
                              {article.status === 'error' && (
                                <span className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg flex items-center gap-1.5">
                                  ❌ Erreur
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-5 border-2 border-indigo-200 shadow-sm">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">{groups.length}</div>
                  <div className="text-sm font-semibold text-gray-700">📁 Groupes</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-md">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-indigo-600 mb-1">{allArticles.length}</div>
                  <div className="text-sm font-semibold text-gray-700">📝 Articles Total</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-md">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {groups.length > 1 ? '3' : '2'}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">🔗 Liens/Article</div>
                </div>
              </div>
            </div>

            {/* Export Buttons for Planification */}
            {allArticles.some(a => a.status === 'completed') && (
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  📤 Exporter pour Planification
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exporter CSV
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exporter JSON
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  💡 Importez le fichier dans la page <strong>Planification</strong> pour publier sur Shopify
                </p>
              </div>
            )}
          </div>
        )}

        {/* Generate Button - Centered Green with Play */}
        {groups.length > 0 && !isProcessing && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={generateAllArticles}
              className="px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg flex items-center gap-3 transform hover:scale-105"
            >
              <Play className="w-6 h-6 fill-current" />
              Générer Tous les Articles ({allArticles.length})
            </button>
          </div>
        )}

        {/* Real-time Logs */}
        {logs.length > 0 && (
          <div className="mb-6 bg-gray-900 rounded-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  📊 Logs en Temps Réel
                </h2>
                {timerInterval && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-lg text-white text-sm font-mono">
                    <Clock className="w-4 h-4 animate-pulse" />
                    {Math.floor(liveTimer / 60)}:{(liveTimer % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
              <button
                onClick={() => setLogs([])}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
              >
                Effacer
              </button>
            </div>
            <div className="bg-black rounded p-4 max-h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.includes('📊') ? 'text-blue-400' :
                    log.includes('✍️') ? 'text-purple-400' :
                    log.includes('✅') ? 'text-green-400' :
                    log.includes('💰') ? 'text-yellow-400' :
                    log.includes('❌') ? 'text-red-400' :
                    log.includes('⏱️') ? 'text-cyan-400' :
                    log.includes('   ') ? 'text-gray-500' :
                    'text-gray-400'
                  } ${log === '' ? 'h-2' : ''}`}
                >
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Articles List */}
        {allArticles.length > 0 && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-500" />
                Articles ({allArticles.length})
              </h2>
              <div className="flex gap-3">
                {completedCount > 0 && (
                  <button
                    onClick={downloadArticles}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
            {allArticles.map((article, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 transition-all ${
                  article.status === "completed"
                    ? "border-green-300 bg-green-50"
                    : article.status === "analyzing"
                    ? "border-blue-300 bg-blue-50"
                    : article.status === "writing"
                    ? "border-indigo-300 bg-indigo-50"
                    : article.status === "error"
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{article.keyword}</h3>
                      {article.status === "completed" && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {article.status === "analyzing" && (
                        <div className="flex items-center gap-1 text-blue-600 text-sm">
                          <Search className="w-4 h-4 animate-pulse" />
                          <span>Analyse SERP...</span>
                        </div>
                      )}
                      {article.status === "writing" && (
                        <div className="flex items-center gap-1 text-indigo-600 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Rédaction...</span>
                        </div>
                      )}
                      {article.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div>
                        <Globe className="w-4 h-4 inline mr-1" />
                        Pays: {article.country.toUpperCase()}
                      </div>
                      {article.perplexityModel && (
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          article.perplexityModel === "sonar-pro" 
                            ? "bg-purple-100 text-purple-700" 
                            : "bg-indigo-100 text-indigo-700"
                        }`}>
                          {article.perplexityModel === "sonar-pro" ? "Sonar Pro ⭐" : "Sonar"}
                        </div>
                      )}
                      {article.costs && article.costs.totalCost > 0 && (
                        <div className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                          💰 ${article.costs.totalCost.toFixed(4)}
                        </div>
                      )}
                      {article.linkCount !== undefined && (
                        <div className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                          🔗 {article.linkCount} liens
                        </div>
                      )}
                      {article.content && (
                        <div className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                          📝 {article.content.split(/\s+/).filter(w => w.length > 0).length} mots
                        </div>
                      )}
                    </div>
                    {article.fullUrl && (
                      <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded truncate">
                        📍 {article.fullUrl}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Breakdown */}
                {article.costs && article.costs.totalCost > 0 && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <div className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      💰 Détails des Coûts
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">SERP Analysis</div>
                        <div className="text-lg font-bold text-indigo-600">${article.costs.serpCost.toFixed(4)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Rédaction</div>
                        <div className="text-lg font-bold text-blue-600">${article.costs.writingCost.toFixed(4)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Total</div>
                        <div className="text-xl font-bold text-purple-600">${article.costs.totalCost.toFixed(4)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shopify Publish Button */}
                {article.status === "completed" && article.content && selectedStore && selectedBlogId && (
                  <div className="mb-4">
                    <button
                      onClick={() => publishToShopify(article)}
                      disabled={isPublishing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      Publier cet article sur Shopify
                    </button>
                  </div>
                )}

                {/* SERP Analysis Accordion */}
                {article.serpAnalysis && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleAccordion(index, 'serp')}
                      className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
                        <Search className="w-4 h-4" />
                        📊 Analyse SERP
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(article.serpAnalysis, 'Analyse SERP');
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded flex items-center gap-1 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          Copier
                        </button>
                        {expandedArticles[index]?.serp ? (
                          <ChevronUp className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                    {expandedArticles[index]?.serp && (
                      <div className="mt-2 p-4 bg-white rounded-lg border-2 border-blue-200">
                        <div className="max-h-64 overflow-y-auto text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {article.serpAnalysis}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Accordion */}
                {article.content && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleAccordion(index, 'content')}
                      className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold text-green-900">
                        <FileText className="w-4 h-4" />
                        📝 Contenu HTML Généré
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(article.content, 'Contenu HTML');
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded flex items-center gap-1 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          Copier HTML
                        </button>
                        {expandedArticles[index]?.content ? (
                          <ChevronUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </button>
                    {expandedArticles[index]?.content && (
                      <div className="mt-2 p-6 bg-white rounded-lg border-2 border-green-200 shadow-sm">
                        <div className="text-sm font-bold text-green-900 mb-4 flex items-center gap-2">
                          📝 Aperçu Article Complet
                        </div>
                    <div 
                      className="max-h-[600px] overflow-y-auto pr-3"
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.8'
                      }}
                    >
                      <style jsx>{`
                        div :global(h1) {
                          font-size: 2em;
                          font-weight: 800;
                          color: #1f2937;
                          margin-bottom: 1.5rem;
                          line-height: 1.2;
                        }
                        div :global(h2) {
                          font-size: 1.5em;
                          font-weight: 700;
                          color: #374151;
                          margin-top: 2rem;
                          margin-bottom: 1rem;
                          line-height: 1.3;
                        }
                        div :global(h3) {
                          font-size: 1.25em;
                          font-weight: 600;
                          color: #4b5563;
                          margin-top: 1.5rem;
                          margin-bottom: 0.75rem;
                          line-height: 1.4;
                        }
                        div :global(p) {
                          margin-bottom: 1rem;
                          color: #374151;
                        }
                        div :global(ul), div :global(ol) {
                          margin: 1rem 0;
                          padding-left: 1.5rem;
                        }
                        div :global(li) {
                          margin-bottom: 0.5rem;
                          color: #374151;
                        }
                        div :global(strong) {
                          font-weight: 600;
                          color: #1f2937;
                        }
                        div :global(a) {
                          color: #2563eb;
                          text-decoration: underline;
                          font-weight: 500;
                        }
                        div :global(a:hover) {
                          color: #1d4ed8;
                        }
                        div :global(table) {
                          width: 100%;
                          border-collapse: collapse;
                          margin: 1.5rem 0;
                        }
                        div :global(th), div :global(td) {
                          padding: 0.75rem;
                          border: 1px solid #e5e7eb;
                          text-align: left;
                        }
                        div :global(th) {
                          background-color: #f3f4f6;
                          font-weight: 600;
                        }
                      `}</style>
                      <div dangerouslySetInnerHTML={{ __html: article.content }} />
                    </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {allArticles.length === 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Créez vos articles de blog SEO
              </h3>
              <p className="text-gray-600 mb-6">
                L'IA va d'abord analyser les SERP (Top 10-15) pour comprendre l'intention utilisateur, puis rédiger un article 100% optimisé SEO.
              </p>
              <div className="bg-white rounded-lg p-6 text-left space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">🔍 Processus en 2 étapes :</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">1.</span>
                      <span className="text-gray-700"><strong>Analyse SERP</strong> → Recherche Google + Scraping Top 10-15 + Extraction intentions/mots-clés/sujets</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">2.</span>
                      <span className="text-gray-700"><strong>Rédaction SEO</strong> → Article complet optimisé selon l'analyse + Respect des règles SEO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Progress Notification Bubble - Bottom Right */}
      {allArticles.length > 0 && (isProcessing || completedCount > 0) && (
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
              {isProcessing && !isPaused && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>
            
            <div className="flex items-baseline gap-2 mb-2.5">
              <span className="text-3xl font-bold">{progressPercentage}%</span>
              <span className="text-sm opacity-75">
                {completedCount}/{allArticles.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {isProcessing && currentStep && (
              <div className="mt-2 text-xs opacity-75 truncate">
                {currentStep}
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
              <button
                onClick={downloadArticles}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium text-sm shadow-sm"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            )}
          </div>
        </div>
      )}

      {/* Schema Modal - Beautiful Centered Popup */}
      {showSchemaModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSchemaModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-indigo-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                📊 Schéma de Maillage Interne
              </h2>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-gray-900">
              <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {generateLinkingVisualization(groups)}
              </pre>
            </div>

            {/* Footer */}
            <div className="bg-gray-800 p-4 flex items-center justify-between border-t border-gray-700">
              <div className="text-sm text-gray-400">
                💡 Ce schéma montre comment vos articles seront liés entre eux
              </div>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
