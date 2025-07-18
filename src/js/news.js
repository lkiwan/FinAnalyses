// js/news.js - VERSION FINALE SIMPLIFIÉE
const API_BASE = "https://finanalyses.onrender.com/api"; // URL de production

function createNewsCard(article) {
    // ... (la fonction createNewsCard reste la même)
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