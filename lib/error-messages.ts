/**
 * Traduit les erreurs API techniques en messages clairs et compréhensibles
 */

export function getClaudeErrorMessage(error: any): string {
  const errorMessage = error?.message || error?.toString() || "";
  const errorCode = error?.status || error?.code;

  // Erreurs d'authentification
  if (errorCode === 401 || errorMessage.includes("authentication") || errorMessage.includes("api_key")) {
    return "❌ Clé API Claude invalide ou expirée. Vérifiez votre clé dans les Paramètres.";
  }

  // Erreurs de quota
  if (errorCode === 429 || errorMessage.includes("rate_limit") || errorMessage.includes("quota")) {
    return "⏸️ Limite d'utilisation atteinte. Attendez quelques minutes ou vérifiez votre quota Claude.";
  }

  // Erreurs de crédit
  if (errorMessage.includes("credit") || errorMessage.includes("billing") || errorMessage.includes("payment")) {
    return "💳 Crédits insuffisants sur votre compte Claude. Rechargez votre compte sur console.anthropic.com";
  }

  // Erreurs de contenu
  if (errorCode === 400 || errorMessage.includes("invalid_request")) {
    return "⚠️ Requête invalide. Le contenu envoyé n'est pas au bon format.";
  }

  // Erreurs de connexion
  if (errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("timeout")) {
    return "🌐 Problème de connexion. Vérifiez votre connexion internet.";
  }

  // Erreur générique
  return `⚠️ Erreur Claude : ${errorMessage.substring(0, 100)}`;
}

export function getGeminiErrorMessage(error: any): string {
  const errorMessage = error?.message || error?.toString() || "";
  const errorCode = error?.status || error?.code;

  // Erreurs d'authentification
  if (errorCode === 401 || errorCode === 403 || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("authentication")) {
    return "❌ Clé API Gemini invalide. Vérifiez votre clé dans les Paramètres (doit commencer par 'AIza').";
  }

  // Erreurs de quota
  if (errorCode === 429 || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
    return "⏸️ Quota Gemini dépassé. Attendez quelques minutes ou augmentez votre quota sur Google AI Studio.";
  }

  // Erreurs d'image
  if (errorMessage.includes("image") || errorMessage.includes("INVALID_ARGUMENT")) {
    return "🖼️ Image invalide ou inaccessible. Vérifiez que l'URL de l'image fonctionne.";
  }

  // Erreurs de taille
  if (errorMessage.includes("too large") || errorMessage.includes("size")) {
    return "📏 Image trop grande. Gemini accepte les images jusqu'à 20MB.";
  }

  // Erreurs de format
  if (errorMessage.includes("format") || errorMessage.includes("mime")) {
    return "📄 Format d'image non supporté. Utilisez JPG, PNG, WEBP, HEIC ou HEIF.";
  }

  // Erreurs de connexion
  if (errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("timeout")) {
    return "🌐 Problème de connexion. Vérifiez votre connexion internet.";
  }

  // Erreur de région
  if (errorMessage.includes("region") || errorMessage.includes("location")) {
    return "🌍 Service Gemini non disponible dans votre région.";
  }

  // Erreur générique
  return `⚠️ Erreur Gemini : ${errorMessage.substring(0, 100)}`;
}

export function getImageFetchErrorMessage(url: string, error: any): string {
  const errorMessage = error?.message || error?.toString() || "";

  if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
    return "🔍 Image introuvable. L'URL de l'image n'existe plus sur le CDN Shopify.";
  }

  if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
    return "🔒 Accès refusé à l'image. Vérifiez les permissions de votre CDN Shopify.";
  }

  if (errorMessage.includes("timeout")) {
    return "⏱️ Délai d'attente dépassé. Le CDN Shopify met trop de temps à répondre.";
  }

  if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("network")) {
    return "🌐 Impossible de se connecter au CDN Shopify. Vérifiez votre connexion.";
  }

  return `🖼️ Impossible de charger l'image depuis ${new URL(url).hostname}`;
}

export function getGeneralErrorMessage(context: string, error: any): string {
  const errorMessage = error?.message || error?.toString() || "";

  // Erreurs de parsing JSON
  if (errorMessage.includes("JSON") || errorMessage.includes("parse")) {
    return "📋 Erreur de format de données. Le fichier CSV contient des données invalides.";
  }

  // Erreurs de mémoire
  if (errorMessage.includes("memory") || errorMessage.includes("heap")) {
    return "💾 Mémoire insuffisante. Essayez de traiter moins de produits à la fois.";
  }

  // Erreur générique avec contexte
  return `⚠️ Erreur lors de ${context} : ${errorMessage.substring(0, 80)}`;
}
