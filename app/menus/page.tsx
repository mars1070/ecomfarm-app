"use client";
import { useState, useEffect } from "react";
import { Menu, Trash2, Save, GripVertical, Loader2, RefreshCw, X, FolderOpen, ArrowRight, Check, Image as ImageIcon, Search, Plus, CheckCircle } from "lucide-react";
import type { ShopifyStore } from "@/types/shopify";

interface MenuItem { id?: string; title: string; type: string; url?: string; resourceId?: string; items: MenuItem[]; }
interface ShopifyMenu { id: string; title: string; handle: string; isDefault: boolean; items: MenuItem[]; }
interface ShopifyCollection { id: string; title: string; handle: string; image?: string | null; productsCount?: number; }

export default function MenusPage() {
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<ShopifyStore | null>(null);
  const [menus, setMenus] = useState<ShopifyMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<ShopifyMenu | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedItem, setDraggedItem] = useState<{ type: "collection" | "menuItem"; data: any; index?: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showNewMenuForm, setShowNewMenuForm] = useState(false);
  const [newMenuTitle, setNewMenuTitle] = useState("");
  const [newMenuHandle, setNewMenuHandle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { const s = localStorage.getItem("shopifyStores"); if (s) { const p = JSON.parse(s); setStores(p); if (p.length > 0) setSelectedStore(p[0]); } }, []);
  useEffect(() => { if (selectedStore) { loadMenus(); loadCollections(); } }, [selectedStore]);

  const loadMenus = async () => {
    if (!selectedStore) return; setIsLoading(true);
    try { const r = await fetch("/api/shopify/menus?store=" + encodeURIComponent(JSON.stringify(selectedStore))); const d = await r.json(); if (d.error) throw new Error(d.error); setMenus(d.menus || []); if (d.menus?.length > 0 && !selectedMenu) setSelectedMenu(d.menus[0]); } catch (e: any) { alert("Erreur: " + e.message); } finally { setIsLoading(false); }
  };

  const loadCollections = async () => {
    if (!selectedStore) return; setIsLoadingCollections(true);
    try { const r = await fetch("/api/shopify/sync-collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store: selectedStore }) }); const d = await r.json(); if (d.collections) setCollections(d.collections); } catch (e) { console.error(e); } finally { setIsLoadingCollections(false); }
  };

  const createMenu = async () => {
    if (!selectedStore || !newMenuTitle || !newMenuHandle) return; setIsCreating(true);
    try { const r = await fetch("/api/shopify/menus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store: selectedStore, title: newMenuTitle, handle: newMenuHandle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""), items: [] }) }); const d = await r.json(); if (d.error) throw new Error(d.error); setMenus([...menus, d.menu]); setSelectedMenu(d.menu); setShowNewMenuForm(false); setNewMenuTitle(""); setNewMenuHandle(""); } catch (e: any) { alert("Erreur: " + e.message); } finally { setIsCreating(false); }
  };

  const saveMenu = async () => {
    if (!selectedStore || !selectedMenu) return; setIsSaving(true);
    try { const prep = (items: MenuItem[]): any[] => items.map((i) => ({ id: i.id, title: i.title, type: i.type, url: i.url, resourceId: i.resourceId, items: i.items ? prep(i.items) : [] })); const r = await fetch("/api/shopify/menus", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store: selectedStore, menuId: selectedMenu.id, title: selectedMenu.title, handle: selectedMenu.handle, items: prep(selectedMenu.items) }) }); const d = await r.json(); if (d.error) throw new Error(d.error); setMenus(menus.map((m) => m.id === d.menu.id ? d.menu : m)); setSelectedMenu(d.menu); alert("Menu sauvegarde!"); } catch (e: any) { alert("Erreur: " + e.message); } finally { setIsSaving(false); }
  };

  const deleteMenu = async (id: string) => {
    if (!selectedStore || !confirm("Supprimer?")) return;
    try { const r = await fetch("/api/shopify/menus?store=" + encodeURIComponent(JSON.stringify(selectedStore)) + "&menuId=" + encodeURIComponent(id), { method: "DELETE" }); const d = await r.json(); if (d.error) throw new Error(d.error); const n = menus.filter((m) => m.id !== id); setMenus(n); if (selectedMenu?.id === id) setSelectedMenu(n[0] || null); } catch (e: any) { alert("Erreur: " + e.message); }
  };

  const filtered = collections.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const inMenu = new Set(selectedMenu?.items.filter((i) => i.type === "COLLECTION").map((i) => i.resourceId) || []);

  const onDragStart = (e: React.DragEvent, c: ShopifyCollection) => { setDraggedItem({ type: "collection", data: c }); e.dataTransfer.effectAllowed = "copy"; };
  const onItemDragStart = (e: React.DragEvent, item: MenuItem, idx: number) => { setDraggedItem({ type: "menuItem", data: item, index: idx }); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIndex(idx); };
  const onDragLeave = () => setDragOverIndex(null);

  const onDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault(); if (!draggedItem || !selectedMenu) return;
    const u = { ...selectedMenu };
    if (draggedItem.type === "collection") { const c = draggedItem.data as ShopifyCollection; u.items.splice(idx, 0, { title: c.title, type: "COLLECTION", url: "/collections/" + c.handle, resourceId: c.id, items: [] }); }
    else if (draggedItem.index !== undefined) { const [m] = u.items.splice(draggedItem.index, 1); u.items.splice(idx > draggedItem.index ? idx - 1 : idx, 0, m); }
    setSelectedMenu(u); setDraggedItem(null); setDragOverIndex(null);
  };

  const onDropMenu = (e: React.DragEvent) => {
    e.preventDefault(); if (!draggedItem || !selectedMenu || draggedItem.type !== "collection") return;
    const c = draggedItem.data as ShopifyCollection;
    setSelectedMenu({ ...selectedMenu, items: [...selectedMenu.items, { title: c.title, type: "COLLECTION", url: "/collections/" + c.handle, resourceId: c.id, items: [] }] }); setDraggedItem(null);
  };

  const remove = (idx: number) => { if (!selectedMenu) return; const u = [...selectedMenu.items]; u.splice(idx, 1); setSelectedMenu({ ...selectedMenu, items: u }); };
  const addAll = () => { if (!selectedMenu) return; const n = filtered.filter((c) => !inMenu.has(c.id)).map((c) => ({ title: c.title, type: "COLLECTION", url: "/collections/" + c.handle, resourceId: c.id, items: [] as MenuItem[] })); setSelectedMenu({ ...selectedMenu, items: [...selectedMenu.items, ...n] }); };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50 p-4 flex flex-col">
      <div className="mb-6"><h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><Menu className="w-8 h-8 text-blue-600" />Gestion des Menus Shopify</h1><p className="text-gray-600 mt-1">Glissez-deposez vos collections pour creer votre menu</p></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6"><div className="flex items-center gap-4"><label className="font-medium text-gray-700">Store :</label><select value={selectedStore?.id || ""} onChange={(e) => { const s = stores.find((x) => x.id === e.target.value); setSelectedStore(s || null); setSelectedMenu(null); setMenus([]); setCollections([]); }} className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg"><option value="">Selectionner...</option>{stores.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.shopDomain})</option>)}</select><button onClick={() => { loadMenus(); loadCollections(); }} disabled={!selectedStore || isLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"><RefreshCw className={"w-4 h-4 " + (isLoading ? "animate-spin" : "")} />Actualiser</button></div></div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6"><div className="flex items-center justify-between mb-4"><h2 className="font-bold text-gray-800 flex items-center gap-2"><Menu className="w-5 h-5 text-blue-600" />Mes Menus</h2><button onClick={() => setShowNewMenuForm(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Plus className="w-4 h-4" />Nouveau Menu</button></div>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : menus.length === 0 ? <div className="text-center py-8 text-gray-500"><Menu className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Aucun menu</p></div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{menus.map((m) => <div key={m.id} onClick={() => setSelectedMenu(m)} className={"relative p-4 rounded-xl border-2 cursor-pointer transition-all " + (selectedMenu?.id === m.id ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 bg-white hover:border-blue-300")}>{selectedMenu?.id === m.id && <div className="absolute top-2 right-2"><CheckCircle className="w-5 h-5 text-blue-600" /></div>}<h3 className="font-semibold text-gray-800 pr-6">{m.title}</h3><p className="text-sm text-gray-500 mt-1">{m.handle}</p><div className="flex items-center justify-between mt-3"><span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{m.items?.length || 0} elements</span>{m.isDefault && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Defaut</span>}</div>{!m.isDefault && <button onClick={(e) => { e.stopPropagation(); deleteMenu(m.id); }} className="absolute bottom-2 right-2 p-1.5 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>}</div>)}</div>}
        {showNewMenuForm && <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200"><h3 className="font-semibold text-gray-800 mb-3">Nouveau menu</h3><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Titre</label><input type="text" value={newMenuTitle} onChange={(e) => { setNewMenuTitle(e.target.value); setNewMenuHandle(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Handle</label><input type="text" value={newMenuHandle} onChange={(e) => setNewMenuHandle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm" /></div></div><div className="flex gap-2 mt-4"><button onClick={createMenu} disabled={isCreating || !newMenuTitle || !newMenuHandle} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Creer</button><button onClick={() => { setShowNewMenuForm(false); setNewMenuTitle(""); setNewMenuHandle(""); }} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Annuler</button></div></div>}
      </div>
      {selectedMenu && <div className="flex justify-end mb-4"><button onClick={saveMenu} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg">{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}Sauvegarder "{selectedMenu.title}"</button></div>}
      {selectedMenu && <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="col-span-5"><div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-520px)]"><div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50"><div className="flex items-center justify-between mb-3"><h2 className="font-bold text-gray-800 flex items-center gap-2"><FolderOpen className="w-5 h-5 text-purple-600" />Collections ({filtered.length})</h2>{filtered.length > 0 && <button onClick={addAll} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"><Plus className="w-4 h-4" />Tout ajouter</button>}</div><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" /></div></div><div className="overflow-y-auto h-[calc(100%-120px)] p-3">{isLoadingCollections ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div> : filtered.length === 0 ? <div className="text-center py-12 text-gray-500"><FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Aucune collection</p></div> : <div className="space-y-2">{filtered.map((c) => { const ok = inMenu.has(c.id); return <div key={c.id} draggable={!ok} onDragStart={(e) => onDragStart(e, c)} onDragEnd={() => setDraggedItem(null)} className={"flex items-center gap-3 p-3 rounded-xl border-2 transition-all " + (ok ? "bg-green-50 border-green-200 opacity-60" : "bg-white border-gray-200 hover:border-purple-400 cursor-grab")}><div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">{c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-400" /></div>}</div><div className="flex-1 min-w-0"><p className="font-medium text-gray-800 truncate text-sm">{c.title}</p><p className="text-xs text-gray-500">{c.productsCount || 0} produits</p></div>{ok ? <Check className="w-5 h-5 text-green-600" /> : <GripVertical className="w-5 h-5 text-gray-400" />}</div>; })}</div>}</div></div></div>
        <div className="col-span-2 flex items-center justify-center"><div className="flex flex-col items-center gap-2 text-gray-400"><ArrowRight className="w-8 h-8" /><span className="text-sm font-medium">Glisser</span></div></div>
        <div className="col-span-5"><div className={"bg-white rounded-xl shadow-sm border-2 overflow-hidden h-[calc(100vh-520px)] transition-colors " + (draggedItem?.type === "collection" ? "border-green-400 bg-green-50/30" : "border-gray-200")} onDragOver={(e) => e.preventDefault()} onDrop={onDropMenu}><div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50"><div className="flex items-center justify-between"><h2 className="font-bold text-gray-800 flex items-center gap-2"><Menu className="w-5 h-5 text-green-600" />{selectedMenu.title} ({selectedMenu.items?.length || 0})</h2>{selectedMenu.items.length > 0 && <button onClick={() => setSelectedMenu({ ...selectedMenu, items: [] })} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200"><Trash2 className="w-4 h-4" />Vider</button>}</div></div><div className="overflow-y-auto h-[calc(100%-72px)] p-3">{selectedMenu.items.length === 0 ? <div className={"border-2 border-dashed rounded-xl p-8 text-center " + (draggedItem?.type === "collection" ? "border-green-400 bg-green-50" : "border-gray-300")}><FolderOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p className="text-gray-500 font-medium text-sm">Glissez des collections ici</p></div> : <div className="space-y-2">{selectedMenu.items.map((item, i) => <div key={item.id || i} draggable onDragStart={(e) => onItemDragStart(e, item, i)} onDragEnd={() => setDraggedItem(null)} onDragOver={(e) => onDragOver(e, i)} onDragLeave={onDragLeave} onDrop={(e) => onDrop(e, i)} className={"flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-grab " + (dragOverIndex === i ? "border-blue-400 bg-blue-50" : "bg-white border-gray-200 hover:border-green-400")}><GripVertical className="w-5 h-5 text-gray-400" /><div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">{i + 1}</div><div className="flex-1 min-w-0"><p className="font-medium text-gray-800 truncate text-sm">{item.title}</p></div><button onClick={() => remove(i)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"><X className="w-4 h-4" /></button></div>)}<div onDragOver={(e) => onDragOver(e, selectedMenu.items.length)} onDragLeave={onDragLeave} onDrop={(e) => onDrop(e, selectedMenu.items.length)} className={"border-2 border-dashed rounded-xl p-3 text-center " + (dragOverIndex === selectedMenu.items.length ? "border-blue-400 bg-blue-50" : "border-gray-200")}><p className="text-gray-400 text-xs">+ Deposez ici</p></div></div>}</div></div></div>
      </div>}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex-shrink-0"><p className="text-blue-800 text-sm">Selectionnez un menu, glissez les collections, reorganisez et sauvegardez!</p></div>
    </div>
  );
}
