"use client";

import { useState, useEffect } from "react";
import { Store, ChevronDown } from "lucide-react";
import type { ShopifyStore } from "@/types/shopify";

interface ShopifyStoreSelectorProps {
  onStoreSelect: (store: ShopifyStore | null) => void;
  selectedStoreId?: string | null;
}

export default function ShopifyStoreSelector({ onStoreSelect, selectedStoreId }: ShopifyStoreSelectorProps) {
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<ShopifyStore | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load stores from localStorage
    const savedStores = localStorage.getItem("shopifyStores");
    if (savedStores) {
      const parsedStores: ShopifyStore[] = JSON.parse(savedStores);
      const activeStores = parsedStores.filter(s => s.isActive);
      setStores(activeStores);

      // Auto-select if only one store
      if (activeStores.length === 1) {
        setSelectedStore(activeStores[0]);
        onStoreSelect(activeStores[0]);
      }

      // Select store by ID if provided
      if (selectedStoreId) {
        const store = activeStores.find(s => s.id === selectedStoreId);
        if (store) {
          setSelectedStore(store);
          onStoreSelect(store);
        }
      }
    }
  }, [selectedStoreId]);

  const handleSelectStore = (store: ShopifyStore) => {
    setSelectedStore(store);
    onStoreSelect(store);
    setIsOpen(false);
  };

  if (stores.length === 0) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-semibold text-yellow-900">Aucun store Shopify connecté</p>
            <p className="text-xs text-yellow-700 mt-1">
              Allez dans <a href="/shopify-stores" className="underline font-medium">Mes Stores Shopify</a> pour en ajouter un
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-green-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-green-600" />
          {selectedStore ? (
            <div className="text-left">
              <p className="font-semibold text-gray-900">{selectedStore.name}</p>
              <p className="text-xs text-gray-500 font-mono">{selectedStore.shopDomain}</p>
            </div>
          ) : (
            <span className="text-gray-500">Sélectionner un store...</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleSelectStore(store)}
              className={`w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                selectedStore?.id === store.id ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">{store.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{store.shopDomain}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedStore && (
        <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Connecté à {selectedStore.name}</span>
        </div>
      )}
    </div>
  );
}
