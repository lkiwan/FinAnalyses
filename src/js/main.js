// js/main.js - VERSION FINALE FUSIONNÉE

document.addEventListener("DOMContentLoaded", () => {
    // --- CONFIGURATION DE L'API ---
    // Détecte automatiquement si on est en local ou en production
    const IS_LOCAL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
    const API_BASE = IS_LOCAL ? "http://localhost:8000/api" : "https://finanalyses.onrender.com/api";

    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const searchInput = document.getElementById("company-search");
    const analyzeBtn = document.getElementById("analyze-btn");
    const searchResults = document.getElementById('search-results');
    const countrySelect = document.getElementById('country-select');
    const countryResults = document.getElementById('country-results');
    const seeMoreContainer = document.getElementById('see-more-container');

    // --- FONCTIONNALITÉ 1 : RECHERCHE PRÉDICTIVE (Tapez "Apple" -> "AAPL") ---

    /**
     * Affiche une liste de suggestions de recherche sous la barre de saisie.
     * @param {Array} results - La liste des entreprises trouvées par l'API.
     */
    function displaySearchResults(results) {
        searchResults.innerHTML = ''; // Vider les anciens résultats
        if (results.length === 0) {
            searchResults.classList.add('hidden');
            return;
        }

        results.forEach(company => {
            const item = document.createElement('div');
            item.className = 'p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0';
            item.innerHTML = `
                <span class="font-bold">${company.symbol}</span>
                <span class="text-gray-600 ml-2">${company.name}</span>
            `;
            item.addEventListener('click', () => {
                redirectToAnalysis(company.symbol);
            });
            searchResults.appendChild(item);
        });
        searchResults.classList.remove('hidden');
    }

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();

        if (query.length < 1) {
            searchResults.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${API_BASE}/search?query=${query}`);
                if (!response.ok) throw new Error('Erreur de recherche');
                const data = await response.json();
                displaySearchResults(data);
            } catch (error) {
                console.error("Erreur de recherche:", error);
                searchResults.classList.add('hidden');
            }
        }, 300);
    });

    // Cacher les suggestions si on clique ailleurs sur la page
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });

    // --- LOGIQUE DU BOUTON "ANALYSER" (Votre code original) ---
    const startAnalysis = () => {
        const ticker = searchInput.value.trim().toUpperCase();
        if (ticker) {
            redirectToAnalysis(ticker);
        } else {
            alert("Veuillez entrer un nom ou un symbole boursier.");
        }
    };
    analyzeBtn.addEventListener("click", startAnalysis);
    searchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            startAnalysis();
        }
    });


    // --- FONCTIONNALITÉ 2 : RECHERCHE PAR PAYS ---
    
    /**
     * Affiche une grille d'entreprises pour le pays sélectionné.
     * @param {Array} companies - La liste des entreprises reçues de l'API.
     */
    function displayCountryResults(companies) {
        countryResults.innerHTML = '';
        if (!companies || companies.length === 0) {
            countryResults.innerHTML = '<p class="text-center text-gray-500">Aucune entreprise trouvée pour ce pays.</p>';
            seeMoreContainer.classList.add('hidden');
            return;
        };

        const companiesToShow = companies.slice(0, 9);

        companiesToShow.forEach(company => {
            const item = document.createElement('div');
            item.className = 'bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer card-hover';
            item.innerHTML = `
                <h3 class="font-bold text-gray-900 truncate">${company.companyName}</h3>
                <p class="text-sm text-blue-600 font-semibold">${company.symbol}</p>
                <p class="text-xs text-gray-500 mt-2">${company.sector || 'N/A'}</p>
            `;
            item.addEventListener('click', () => redirectToAnalysis(company.symbol));
            countryResults.appendChild(item);
        });

        if (companies.length > 9) {
            seeMoreContainer.classList.remove('hidden');
        } else {
            seeMoreContainer.classList.add('hidden');
        }
    }

    // Gère le changement de sélection dans la liste des pays
    countrySelect.addEventListener('change', async () => {
        const countryCode = countrySelect.value;
        if (!countryCode) {
            countryResults.innerHTML = '';
            seeMoreContainer.classList.add('hidden');
            return;
        }

        countryResults.innerHTML = '<p class="text-center text-gray-500">Chargement des entreprises...</p>';
        try {
            const response = await fetch(`${API_BASE}/companies-by-country/${countryCode}`);
            if (!response.ok) throw new Error('Erreur de chargement');
            const data = await response.json();
            displayCountryResults(data);
        } catch (error) {
            console.error("Erreur pays:", error);
            countryResults.innerHTML = '<p class="text-center text-red-500">Impossible de charger la liste des entreprises.</p>';
        }
    });
});

/**
 * Fonction de redirection globale (votre code original).
 * @param {string} ticker Le symbole boursier à analyser.
 */
function redirectToAnalysis(ticker) {
    if (ticker) {
        window.location.href = `analysis.html?ticker=${ticker}`;
    }
}