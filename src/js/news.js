// js/news.js - VERSION AMÉLIORÉE

const API_BASE = "https://finanalyse-api.onrender.com/api";

/**
 * Crée le HTML pour une seule carte d'article d'actualité.
 */
function createNewsCard(article) {
    return `
        <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
            <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="block">
                <h3 class="font-semibold text-gray-800 hover:text-blue-600">${article.title}</h3>
                <p class="text-sm text-gray-600 mt-2">${article.snippet}</p>
            </a>
        </div>
    `;
}

/**
 * Récupère les actualités et les affiche.
 */
async function fetchAndDisplayNews(source, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const loader = container.querySelector('.loader');

    try {
        const response = await fetch(`${API_BASE}/news?source=${source}`);
        
        // Si la réponse n'est pas "ok" (ex: 404, 500), on lève une erreur
        if (!response.ok) {
            throw new Error(`Erreur du serveur (HTTP ${response.status})`);
        }
        
        const data = await response.json();
        
        // Vider le loader
        if(loader) loader.remove();

        // Afficher les articles
        if (data.articles && data.articles.length > 0) {
            data.articles.forEach(article => {
                container.innerHTML += createNewsCard(article);
            });
        } else {
            container.innerHTML += '<p class="text-sm text-gray-500">Aucune actualité trouvée pour cette source.</p>';
        }

    } catch (error) {
        console.error(`Erreur lors de la récupération des actualités pour ${source}:`, error);
        if (loader) {
            loader.textContent = "Impossible de charger. Vérifiez que le serveur API est lancé et qu'il n'y a pas d'erreur CORS (voir console F12).";
            loader.classList.add("text-red-600");
        }
    }
}

// Attend que le DOM soit chargé pour exécuter le script.
document.addEventListener("DOMContentLoaded", () => {
    const sources = [
        { name: "moneywise", id: "news-moneywise" },
        { name: "gobankingrates", id: "news-gobankingrates" },
        { name: "morningstar", id: "news-morningstar" },
        { name: "barchart", id: "news-barchart" },
    ];

    sources.forEach(source => {
        fetchAndDisplayNews(source.name, source.id);
    });
});