// Dans src/js/news.js
const IS_LOCAL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
const API_BASE = IS_LOCAL ? "http://localhost:8000/api" : "https://finanalyses.onrender.com/api";

// --- VARIABLES GLOBALES ---
let currentCompanyData = null; // Stocke les données de l'entreprise principale pour la comparaison
function createNewsCard(article) {
    // Cette fonction est maintenant plus robuste.
    // Elle vérifie que les valeurs existent avant de les utiliser.
    const articleUrl = article.url || '#';
    const articleTitle = article.title || 'Titre non disponible';
    const articleSnippet = article.snippet || article.description || 'Contenu non disponible';
    const articleSource = article.source || 'Source inconnue';
    const imageUrl = article.image_url;

    // On retourne un template HTML propre, avec l'image si elle existe.
    return `
        <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
            <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" class="block">
                ${imageUrl ? `<img src="${imageUrl}" alt="" class="w-full h-32 object-cover rounded-md mb-4">` : ''}
                <h3 class="font-semibold text-gray-800 hover:text-blue-600">${articleTitle}</h3>
                <p class="text-sm text-gray-600 mt-2">${articleSnippet}</p>
                <p class="text-xs text-gray-400 mt-3">Source: ${articleSource}</p>
            </a>
            <!-- Dans la barre de navigation -->
<a href="chat.html" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium">Chat AI</a>
        </div>
    `;
}