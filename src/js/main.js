/**
 * Fonction de redirection globale, doit être accessible par les attributs onclick.
 * @param {string} ticker Le symbole boursier à analyser.
 */
function redirectToAnalysis(ticker) {
    if (ticker) {
        window.location.href = `analysis.html?ticker=${ticker}`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // --- CONFIGURATION DE L'API ---
    const IS_LOCAL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
    const API_BASE = IS_LOCAL ? "http://localhost:8000/api" : "https://finanalyses.onrender.com/api";

    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const searchInput = document.getElementById("company-search");
    const analyzeBtn = document.getElementById("analyze-btn");
    const searchResults = document.getElementById('search-results');
    const countrySelect = document.getElementById('country-select');
    const countryResults = document.getElementById('country-results');
    const seeMoreContainer = document.getElementById('see-more-container');
    const gainersTable = document.getElementById('gainers-table-body');
    const losersTable = document.getElementById('losers-table-body');

    // --- FONCTIONNALITÉ 1 : RECHERCHE PRÉDICTIVE ---
    // S'exécute seulement si la barre de recherche existe sur la page
    if (searchInput) {
        function displaySearchResults(results) {
            if (!searchResults) return;
            searchResults.innerHTML = '';
            if (results.length === 0) {
                searchResults.classList.add('hidden');
                return;
            }
            results.forEach(company => {
                const item = document.createElement('div');
                item.className = 'p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0';
                item.innerHTML = `<span class="font-bold">${company.symbol}</span><span class="text-gray-600 ml-2">${company.name}</span>`;
                item.addEventListener('click', () => redirectToAnalysis(company.symbol));
                searchResults.appendChild(item);
            });
            searchResults.classList.remove('hidden');
        }

        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = searchInput.value.trim();
            if (query.length < 1) {
                if(searchResults) searchResults.classList.add('hidden');
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
                    if(searchResults) searchResults.classList.add('hidden');
                }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });

        const startAnalysis = () => {
            const ticker = searchInput.value.trim().toUpperCase();
            if (ticker) {
                redirectToAnalysis(ticker);
            } else {
                alert("Veuillez entrer un nom ou un symbole boursier.");
            }
        };

        if (analyzeBtn) {
            analyzeBtn.addEventListener("click", startAnalysis);
        }
        searchInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") startAnalysis();
        });
    }

    // --- FONCTIONNALITÉ 2 : RECHERCHE PAR PAYS ---
    // S'exécute seulement si le sélecteur de pays existe
    if (countrySelect) {
        function displayCountryResults(companies) {
            if (!countryResults) return;
            countryResults.innerHTML = '';
            if (!companies || companies.length === 0) {
                countryResults.innerHTML = '<p class="text-center text-gray-500 col-span-full">Aucune entreprise trouvée.</p>';
                if(seeMoreContainer) seeMoreContainer.classList.add('hidden');
                return;
            }
            const companiesToShow = companies.slice(0, 9);
            companiesToShow.forEach(company => {
                const item = document.createElement('div');
                item.className = 'bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer card-hover';
                item.innerHTML = `<h3 class="font-bold text-gray-900 truncate">${company.companyName}</h3><p class="text-sm text-blue-600 font-semibold">${company.symbol}</p><p class="text-xs text-gray-500 mt-2">${company.sector || 'N/A'}</p>`;
                item.addEventListener('click', () => redirectToAnalysis(company.symbol));
                countryResults.appendChild(item);
            });
            if (companies.length > 9 && seeMoreContainer) {
                seeMoreContainer.classList.remove('hidden');
            } else if (seeMoreContainer) {
                seeMoreContainer.classList.add('hidden');
            }
        }

        countrySelect.addEventListener('change', async () => {
            const countryCode = countrySelect.value;
            if (!countryCode) {
                if (countryResults) countryResults.innerHTML = '';
                if (seeMoreContainer) seeMoreContainer.classList.add('hidden');
                return;
            }
            if (countryResults) countryResults.innerHTML = '<p class="text-center text-gray-500 col-span-full">Chargement...</p>';
            try {
                const response = await fetch(`${API_BASE}/companies-by-country/${countryCode}`);
                if (!response.ok) throw new Error('Erreur de chargement');
                const data = await response.json();
                displayCountryResults(data);
            } catch (error) {
                console.error("Erreur pays:", error);
                if (countryResults) countryResults.innerHTML = '<p class="text-center text-red-500 col-span-full">Impossible de charger les entreprises.</p>';
            }
        });
    }

    // --- FONCTIONNALITÉ 3 : TOP GAINERS & LOSERS ---
    // S'exécute seulement si les conteneurs existent
    if (gainersTable && losersTable) {
        function createMoverRow(stock) {
            const changeClass = stock.changesPercentage > 0 ? 'text-green-400' : 'text-red-400';
            return `
                <div class="flex items-center justify-between p-2 rounded hover:bg-gray-700 cursor-pointer" onclick="redirectToAnalysis('${stock.symbol}')">
                    <div>
                        <p class="font-bold text-lg">${stock.symbol}</p>
                        <p class="text-sm text-gray-300 truncate">${stock.name}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-lg">${stock.price.toFixed(2)}</p>
                        <p class="${changeClass} font-medium">${stock.changesPercentage.toFixed(2)}%</p>
                    </div>
                </div>
            `;
        }

        function renderMoverTable(data, elementId) {
            const tableBody = document.getElementById(elementId);
            if (!tableBody) return;
            if (!data || data.length === 0) {
                 tableBody.innerHTML = '<p class="text-gray-400">Données non disponibles.</p>';
                 return;
            }
            tableBody.innerHTML = ''; // Vider le message de chargement
            const top5 = data.slice(0, 5);
            top5.forEach(stock => {
                tableBody.innerHTML += createMoverRow(stock);
            });
        }

        async function loadMarketMovers() {
            try {
                const [gainersResponse, losersResponse] = await Promise.all([
                    fetch(`${API_BASE}/gainers`),
                    fetch(`${API_BASE}/losers`)
                ]);
                if (!gainersResponse.ok || !losersResponse.ok) {
                    throw new Error('Une des requêtes pour les movers a échoué.');
                }
                const gainersData = await gainersResponse.json();
                const losersData = await losersResponse.json();
                renderMoverTable(gainersData, 'gainers-table-body');
                renderMoverTable(losersData, 'losers-table-body');
            } catch (error) {
                console.error("Erreur chargement Gainers/Losers:", error);
                if (gainersTable) gainersTable.innerHTML = '<p class="text-red-400">Erreur de chargement.</p>';
                if (losersTable) losersTable.innerHTML = '<p class="text-red-400">Erreur de chargement.</p>';
            }
        }
        
        loadMarketMovers();
    }
});