"use client";

import { useState, useEffect } from "react";
import { Key, Save, Check, AlertCircle, Loader2 } from "lucide-react";

export default function Parametres() {
  const [apiKey, setApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [perplexityApiKey, setPerplexityApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    claude?: string;
    gemini?: string;
    perplexity?: string;
  }>({});
  const [activeTab, setActiveTab] = useState("api");

  useEffect(() => {
    const storedKey = localStorage.getItem("anthropic_api_key");
    const storedGeminiKey = localStorage.getItem("google_gemini_api_key");
    const storedPerplexityKey = localStorage.getItem("perplexity_api_key");
    if (storedKey) {
      setApiKey(storedKey);
    }
    if (storedGeminiKey) {
      setGeminiApiKey(storedGeminiKey);
    }
    if (storedPerplexityKey) {
      setPerplexityApiKey(storedPerplexityKey);
    }
  }, []);

  const handleSave = async () => {
    setIsValidating(true);
    setValidationErrors({});

    try {
      // Test API keys
      const response = await fetch("/api/test-api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claudeKey: apiKey,
          geminiKey: geminiApiKey,
          perplexityKey: perplexityApiKey
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la validation des clés");
      }

      const results = await response.json();

      // Check validation results
      const errors: { claude?: string; gemini?: string; perplexity?: string } = {};
      
      if (apiKey && !results.claude.valid) {
        errors.claude = results.claude.error || "Clé API Claude invalide";
      }
      
      if (geminiApiKey && !results.gemini.valid) {
        errors.gemini = results.gemini.error || "Clé API Gemini invalide";
      }
      
      if (perplexityApiKey && !results.perplexity.valid) {
        errors.perplexity = results.perplexity.error || "Clé API Perplexity invalide";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setIsValidating(false);
        return;
      }

      // Save if all valid
      localStorage.setItem("anthropic_api_key", apiKey);
      localStorage.setItem("google_gemini_api_key", geminiApiKey);
      localStorage.setItem("perplexity_api_key", perplexityApiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      setValidationErrors({
        claude: "Erreur de validation",
        gemini: "Erreur de validation"
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="mt-2 text-gray-600">
            Configurez votre application EcomFarm
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("api")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "api"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Key className="w-4 h-4 inline-block mr-2" />
                API Configuration
              </button>
              <button
                onClick={() => setActiveTab("billing")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "billing"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Facturation
              </button>
            </nav>
          </div>

          {/* API Tab Content */}
          {activeTab === "api" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Clé API Anthropic (Claude)
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Obtenez votre clé API sur{" "}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="apiKey"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Clé API
                    </label>
                    <input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setValidationErrors(prev => ({ ...prev, claude: undefined }));
                      }}
                      placeholder="sk-ant-..."
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        validationErrors.claude ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.claude && (
                      <div className="mt-2 flex items-start text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span>{validationErrors.claude}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6 pt-6 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Clé API Google Gemini (Vision)
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Pour générer des titres à partir des images produits. Obtenez votre clé sur{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="geminiApiKey"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Clé API Gemini
                    </label>
                    <input
                      id="geminiApiKey"
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => {
                        setGeminiApiKey(e.target.value);
                        setValidationErrors(prev => ({ ...prev, gemini: undefined }));
                      }}
                      placeholder="AIza..."
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        validationErrors.gemini ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.gemini && (
                      <div className="mt-2 flex items-start text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span>{validationErrors.gemini}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6 pt-6 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Clé API Perplexity (Recherche SERP)
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Pour analyser les résultats de recherche Google (Articles de Blog). Obtenez votre clé sur{" "}
                  <a
                    href="https://www.perplexity.ai/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    perplexity.ai/settings/api
                  </a>
                </p>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="perplexityApiKey"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Clé API Perplexity
                    </label>
                    <input
                      id="perplexityApiKey"
                      type="password"
                      value={perplexityApiKey}
                      onChange={(e) => {
                        setPerplexityApiKey(e.target.value);
                        setValidationErrors(prev => ({ ...prev, perplexity: undefined }));
                      }}
                      placeholder="pplx-..."
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        validationErrors.perplexity ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.perplexity && (
                      <div className="mt-2 flex items-start text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span>{validationErrors.perplexity}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isValidating}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validation en cours...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Sauvegardé !
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Modèles utilisés
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li><strong>Claude 3.5 Haiku</strong> - Génération de titres et descriptions SEO (Collections)</li>
                  <li><strong>Claude 3.5 Sonnet</strong> - Rédaction d'articles de blog SEO</li>
                  <li><strong>Gemini 2.5 Flash</strong> - Analyse d'images pour génération de titres ($0.15/$0.60 par 1M tokens)</li>
                  <li><strong>Perplexity Sonar</strong> - Recherche et analyse SERP en temps réel (Articles de Blog)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Billing Tab Content */}
          {activeTab === "billing" && (
            <div className="p-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Facturation
                </h3>
                <p className="text-gray-600">
                  Cette fonctionnalité sera disponible prochainement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
