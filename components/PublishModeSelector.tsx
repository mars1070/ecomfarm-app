"use client";

import { useState } from "react";
import { FileText, Eye, Calendar } from "lucide-react";
import type { PublishMode } from "@/types/shopify";

interface PublishModeSelectorProps {
  onModeChange: (mode: PublishMode, scheduledDate?: string) => void;
  defaultMode?: PublishMode;
}

export default function PublishModeSelector({ onModeChange, defaultMode = 'draft' }: PublishModeSelectorProps) {
  const [mode, setMode] = useState<PublishMode>(defaultMode);
  const [scheduledDate, setScheduledDate] = useState<string>("");

  const handleModeChange = (newMode: PublishMode) => {
    setMode(newMode);
    if (newMode === 'scheduled' && scheduledDate) {
      onModeChange(newMode, scheduledDate);
    } else {
      onModeChange(newMode);
    }
  };

  const handleDateChange = (date: string) => {
    setScheduledDate(date);
    if (mode === 'scheduled') {
      onModeChange('scheduled', date);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        📤 Mode de Publication
      </label>

      <div className="grid grid-cols-3 gap-3">
        {/* Draft */}
        <button
          onClick={() => handleModeChange('draft')}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            mode === 'draft'
              ? 'border-orange-500 bg-orange-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-orange-300'
          }`}
        >
          <FileText className={`w-6 h-6 ${mode === 'draft' ? 'text-orange-600' : 'text-gray-400'}`} />
          <div className="text-center">
            <p className={`text-sm font-semibold ${mode === 'draft' ? 'text-orange-900' : 'text-gray-700'}`}>
              Brouillon
            </p>
            <p className="text-xs text-gray-500 mt-1">Non publié</p>
          </div>
        </button>

        {/* Active */}
        <button
          onClick={() => handleModeChange('active')}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            mode === 'active'
              ? 'border-green-500 bg-green-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-green-300'
          }`}
        >
          <Eye className={`w-6 h-6 ${mode === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
          <div className="text-center">
            <p className={`text-sm font-semibold ${mode === 'active' ? 'text-green-900' : 'text-gray-700'}`}>
              Actif
            </p>
            <p className="text-xs text-gray-500 mt-1">Publié maintenant</p>
          </div>
        </button>

        {/* Scheduled */}
        <button
          onClick={() => handleModeChange('scheduled')}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            mode === 'scheduled'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
        >
          <Calendar className={`w-6 h-6 ${mode === 'scheduled' ? 'text-blue-600' : 'text-gray-400'}`} />
          <div className="text-center">
            <p className={`text-sm font-semibold ${mode === 'scheduled' ? 'text-blue-900' : 'text-gray-700'}`}>
              Programmé
            </p>
            <p className="text-xs text-gray-500 mt-1">Date future</p>
          </div>
        </button>
      </div>

      {/* Scheduled Date Picker */}
      {mode === 'scheduled' && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 animate-in slide-in-from-top-2">
          <label className="block text-sm font-medium text-blue-900 mb-2">
            📅 Date et Heure de Publication
          </label>
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={new Date().toISOString().slice(0, 16)}
          />
          {scheduledDate && (
            <p className="text-xs text-blue-700 mt-2">
              ⏰ Sera publié le {new Date(scheduledDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          {mode === 'draft' && '📝 Le contenu sera sauvegardé en brouillon et ne sera pas visible publiquement'}
          {mode === 'active' && '✅ Le contenu sera publié immédiatement et visible par tous'}
          {mode === 'scheduled' && '⏰ Le contenu sera automatiquement publié à la date et heure choisies'}
        </p>
      </div>
    </div>
  );
}
