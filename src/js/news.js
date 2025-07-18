// js/news.js - VERSION FINALE SIMPLIFIÉE
const API_BASE = "https://finanalyses.onrender.com/api"; // URL de production

// Dans src/js/news.js

function createNewsCard(article) {
    return `
        <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200 flex gap-4">
            <img src="${article.image_url}" alt="" class="w-24 h-24 object-cover rounded">
            <div class="flex-1">
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="block">
                    <h3 class="font-semibold text-gray-800 hover:text-blue-600">${article.title}</h3>
                    <p class="text-sm text-gray-600 mt-2">${article.description}</p> 
                    <p class="text-xs text-gray-400 mt-3">Source: ${article.source}</p>
                </a>
            </div>
        </div>
    `;
}

async function fetchAndDisplayNews() {
    const container = document.getElementById('news-container');
    if (!container) return;

    // On vide le conteneur et on affiche un message de chargement
    container.innerHTML = '<p>Chargement des dernières actualités...</p>';

    try {
        // Un seul appel à l'API, vers la bonne route /api/news
        const response = await fetch(`${API_BASE}/news`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        console.log("Données reçues de l'API:", data);
        container.innerHTML = ''; // Vider le message de chargement

        if (data.articles && data.articles.length > 0) {
            data.articles.forEach(article => {
                container.innerHTML += createNewsCard(article);
            });
        } else {
            container.innerHTML = '<p class="text-gray-500">Aucune actualité trouvée pour le moment.</p>';
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des actualités:", error);
        container.innerHTML = `<div class="text-red-600">Impossible de charger les actualités. Raison: ${error.message}</div>`;
    }
}

document.addEventListener("DOMContentLoaded", fetchAndDisplayNews);