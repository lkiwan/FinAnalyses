// js/analysis.js - VERSION FINALE, COMPLÈTE ET CORRIGÉE

// --- CONFIGURATION ---
const IS_LOCAL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
const API_BASE = IS_LOCAL ? "http://localhost:8000/api" : "https://finanalyses.onrender.com/api";

// --- VARIABLES GLOBALES ---
let currentCompanyData = null;
let stockChartInstance = null;
let dividendChartInstance = null;

// --- FONCTIONS UTILITAIRES ---
const safe = (value, formatter = String) => (value !== undefined && value !== null && !isNaN(value)) ? formatter(value) : "N/A";
const formatCurrencyBillion = (n) => `$${(n / 1e9).toFixed(1)}B`;
const formatPercentage = (n) => `${(n * 100).toFixed(1)}%`;
const formatRatio = (n) => `${Number(n).toFixed(1)}x`;

// --- FONCTIONS DE CALCUL ---
function calculateFinancialScore(data) {
    let score = 0;
    const maxScore = 14;
    if (data.roe > 0.2) score += 2; else if (data.roe > 0.1) score += 1;
    if (data.netMargin > 0.15) score += 2; else if (data.netMargin > 0.05) score += 1;
    if (data.peRatio > 0 && data.peRatio < 15) score += 3; else if (data.peRatio < 25) score += 2; else if (data.peRatio < 40) score += 1;
    if (data.debtToEquity < 0.5) score += 3; else if (data.debtToEquity < 1) score += 2; else if (data.debtToEquity < 2) score += 1;
    if (data.revenue > 100e9) score += 2; else if (data.revenue > 20e9) score += 1;
    if (data.dividendYield > 0.03) score += 2; else if (data.dividendYield > 0.01) score += 1;
    return Math.min(10, Math.round((score / maxScore) * 100) / 10);
}

// --- FONCTIONS DE COMPARAISON ---
function createComparisonRow(metric, valueA, valueB, lowerIsBetter = false) {
    const numA = parseFloat(valueA), numB = parseFloat(valueB);
    let classA = "", classB = "";
    if (!isNaN(numA) && !isNaN(numB)) {
        const winner = "text-green-600 font-bold", loser = "text-red-600";
        if ((!lowerIsBetter && numA > numB) || (lowerIsBetter && numA < numB)) { classA = winner; classB = loser; }
        else if ((!lowerIsBetter && numB > numA) || (lowerIsBetter && numB < numA)) { classB = winner; classA = loser; }
    }
    return `<tr><td class="px-2 py-2 font-medium text-gray-600">${metric}</td><td class="px-2 py-2 text-center ${classA}">${valueA}</td><td class="px-2 py-2 text-center ${classB}">${valueB}</td></tr>`;
}

function generateComparisonSummary(dataA, dataB) {
    const strengthsA = [], strengthsB = [];
    if (dataA.peRatio && dataB.peRatio) (dataA.peRatio < dataB.peRatio) ? strengthsA.push("valorisation plus attractive (PER bas)") : strengthsB.push("valorisation plus attractive (PER bas)");
    if (dataA.roe && dataB.roe) (dataA.roe > dataB.roe) ? strengthsA.push("meilleure rentabilité (ROE)") : strengthsB.push("meilleure rentabilité (ROE)");
    let summary = `Comparaison entre <strong>${dataA.name}</strong> et <strong>${dataB.name}</strong> :`;
    if (strengthsA.length > 0) summary += `<br><br><strong>${dataA.name}</strong> se distingue par : ${strengthsA.join(", ")}.`;
    if (strengthsB.length > 0) summary += `<br><br><strong>${dataB.name}</strong> montre sa force avec : ${strengthsB.join(", ")}.`;
    return summary;
}

// --- FONCTIONS UI ---
function createChart(canvasId, type, data, options) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    if (!ctx) return;
    if (window[canvasId + '_instance']) window[canvasId + '_instance'].destroy();
    window[canvasId + '_instance'] = new Chart(ctx, { type, data, options });
}

function createStat(label, value) {
    return `<div class="bg-gray-50 p-2 rounded-lg"><p class="text-xs text-gray-500">${label}</p><p class="text-md font-semibold">${value}</p></div>`;
}

function updateUICards(finData, advData, score) {
    document.getElementById('company-card').innerHTML = `<h3 class="text-xl font-bold text-gray-800">${finData.name}</h3><p class="text-gray-600 mb-4">${finData.symbol}</p><div class="space-y-2 text-sm"><p><i class="fas fa-industry w-5 text-gray-400 mr-2"></i>${finData.sector}</p><p><i class="fas fa-globe w-5 text-gray-400 mr-2"></i>${finData.country}</p><p><i class="fas fa-dollar-sign w-5 text-gray-400 mr-2"></i><span class="font-semibold">${safe(finData.price, p => `$${p.toFixed(2)}`)}</span></p></div>`;
    const hue = (score / 10) * 120;
    document.getElementById('score-card').innerHTML = `<h3 class="text-lg font-semibold text-gray-800 mb-2 text-center">Score Financier</h3><div class="text-center my-4"><span class="text-5xl font-bold" style="color: hsl(${hue}, 80%, 45%)">${score.toFixed(1)}</span><span class="text-2xl text-gray-500">/10</span></div>`;
    document.getElementById('analysis-comment').textContent = finData.analysisComment || "Le commentaire de l'IA n'est pas disponible.";
    document.getElementById('quick-stats-card').innerHTML = `<h3 class="text-lg font-semibold text-gray-800 mb-4">Indicateurs Clés</h3><div class="grid grid-cols-2 gap-2">${createStat("Chiffre d'affaires", safe(finData.revenue, formatCurrencyBillion))}${createStat("Bénéfice net", safe(finData.netIncome, formatCurrencyBillion))}${createStat("PER", safe(finData.peRatio, r => r.toFixed(1)))}${createStat("ROE", safe(finData.roe, formatPercentage))}${createStat("Marge nette", safe(finData.netMargin, formatPercentage))}${createStat("Dividende (Yield)", safe(advData.dividendYield, formatPercentage))}</div>`;
    document.getElementById('advanced-metrics-grid').innerHTML = `${createStat("Ratio liquidité", safe(advData.currentRatio, r => r.toFixed(2)))} ${createStat("Dette/Cap. Propres", safe(advData.debtToEquity, r => r.toFixed(2)))}`;
}

// --- FONCTION D'ANALYSE ---
async function analyzeCompany(ticker) {
    const loading = document.getElementById('loading-state'), content = document.getElementById('analysis-content'), error = document.getElementById('error-state');
    loading.classList.remove('hidden'); content.classList.add('hidden'); error.classList.add('hidden');

    try {
        const [finRes, histRes, advRes, divRes] = await Promise.all([
            fetch(`${API_BASE}/entreprise/${ticker}`), fetch(`${API_BASE}/historique/${ticker}`),
            fetch(`${API_BASE}/advanced-metrics/${ticker}`), fetch(`${API_BASE}/dividends/${ticker}`),
        ]);
        if (!finRes.ok) throw new Error((await finRes.json()).detail || "Données non trouvées.");

        const finData = await finRes.json(), histData = await histRes.json(), advData = await advRes.json(), divData = await divRes.json();
        currentCompanyData = { ...finData, ...advData };
        const score = calculateFinancialScore(currentCompanyData);
        updateUICards(finData, advData, score);
        createChart('stock-chart', 'line', { labels: histData.dates, datasets: [{ label: "Prix ($)", data: histData.prices, borderColor: "#3b82f6", fill: true }] }, { responsive: true, maintainAspectRatio: false });
        createChart('dividend-chart', 'bar', { labels: divData.dividendHistory.years, datasets: [{ label: "Dividende Annuel ($)", data: divData.dividendHistory.amounts, backgroundColor: "#10b981" }] }, { responsive: true, maintainAspectRatio: false });
        content.classList.remove('hidden');
    } catch (e) {
        error.classList.remove('hidden');
        document.getElementById('error-message').textContent = `Erreur : ${e.message}`;
    } finally {
        loading.classList.add('hidden');
    }
}

// --- POINT D'ENTRÉE ---
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ticker = urlParams.get('ticker');
    if (ticker) analyzeCompany(ticker.toUpperCase());

    // ========================================================
    // === CODE POUR LE BOUTON DE COMPARAISON ===
    // ========================================================
    document.getElementById("add-to-comparison").addEventListener("click", async () => {
        const compareTicker = document.getElementById("compare-ticker").value.trim().toUpperCase();
        if (!compareTicker || !currentCompanyData) return alert("Veuillez entrer un symbole à comparer.");
        const container = document.getElementById("comparison-container");
        container.classList.remove("hidden");
        document.getElementById("comparison-summary").innerHTML = "Chargement...";
        try {
            const [compFinRes, compAdvRes] = await Promise.all([fetch(`${API_BASE}/entreprise/${compareTicker}`), fetch(`${API_BASE}/advanced-metrics/${compareTicker}`)]);
            if (!compFinRes.ok) throw new Error((await compFinRes.json()).detail);
            const compFinData = await compFinRes.json(), compAdvData = await compAdvRes.json();
            const comparisonData = { ...compFinData, ...compAdvData };
            let tableHTML = `<table class="min-w-full text-sm text-left"><thead class="bg-gray-50"><tr><th class="px-2 py-2">Métrique</th><th class="px-2 py-2 text-center font-semibold">${currentCompanyData.symbol}</th><th class="px-2 py-2 text-center font-semibold">${comparisonData.symbol}</th></tr></thead><tbody>`;
            tableHTML += createComparisonRow("PER", safe(currentCompanyData.peRatio, r => r.toFixed(1)), safe(comparisonData.peRatio, r => r.toFixed(1)), true);
            tableHTML += createComparisonRow("ROE", safe(currentCompanyData.roe, formatPercentage), safe(comparisonData.roe, formatPercentage));
            tableHTML += `</tbody></table>`;
            document.getElementById("comparison-table-container").innerHTML = tableHTML;
            document.getElementById("comparison-summary").innerHTML = generateComparisonSummary(currentCompanyData, comparisonData);
        } catch (e) {
            alert("Erreur comparaison : " + e.message);
            container.classList.add("hidden");
        }
    });

    // ========================================================
    // === CODE POUR LE BOUTON DU SCREENER D'ACTIONS ===
    // ========================================================
    document.getElementById("run-screener").addEventListener("click", async () => {
        const resultsDiv = document.getElementById("screener-results");
        resultsDiv.innerHTML = `<p class="text-sm text-gray-500">Recherche en cours...</p>`;
        resultsDiv.classList.remove("hidden");
        const params = new URLSearchParams({
            sector: document.getElementById("sector-select").value,
            pe_max: document.getElementById("pe-max").value,
            dividend_min: document.getElementById("dividend-min").value,
        });
        try {
            const response = await fetch(`${API_BASE}/screener?${params.toString()}`);
            if (!response.ok) throw new Error("Réponse du serveur non valide.");
            const data = await response.json();
            const tableBody = data.results.map(stock => `<tr><td class="px-4 py-2"><a href="#" onclick="event.preventDefault(); analyzeCompany('${stock.symbol}')" class="text-blue-600 hover:underline">${stock.symbol}</a></td><td class="px-4 py-2">${stock.name}</td><td class="px-4 py-2">${safe(stock.pe, r => r.toFixed(1))}</td><td class="px-4 py-2">${safe(stock.dividendYield, formatPercentage)}</td></tr>`).join('');
            resultsDiv.innerHTML = `<table class="min-w-full text-sm text-left"><thead class="bg-gray-50"><tr><th class="px-4 py-2">Sym.</th><th class="px-4 py-2">Nom</th><th class="px-4 py-2">PER</th><th class="px-4 py-2">Dividende</th></tr></thead><tbody>${tableBody}</tbody></table>`;
        } catch (error) {
            resultsDiv.innerHTML = `<p class="text-sm text-red-500">Erreur lors de la recherche.</p>`;
        }
    });
});
