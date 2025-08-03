// js/analysis.js - VERSION FINALE ET ROBUSTE

// --- CONFIGURATION ---
const IS_LOCAL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
const API_BASE = IS_LOCAL ? "http://localhost:8000/api" : "https://finanalyses.onrender.com/api"; // Mettez votre URL Render ici

// --- VARIABLES GLOBALES ---
let currentCompanyData = null;
let stockChartInstance = null;
let dividendChartInstance = null;

// --- FONCTIONS UTILITAIRES ---
const safe = (value, formatter = String) => (value !== undefined && value !== null && !isNaN(value)) ? formatter(value) : "N/A";
const formatCurrencyBillion = (n) => `$${(n / 1e9).toFixed(1)}B`;
const formatPercentage = (n) => `${(n * 100).toFixed(1)}%`;

// --- CALCULS ---
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

function generateFinancialComment(data, score) {
    let comment = `Avec un score de ${score.toFixed(1)}/10, ${data.name} `;
    if (score >= 8) comment += "présente une excellente santé financière. ";
    else if (score >= 6) comment += "affiche une situation financière solide. ";
    else if (score >= 4) comment += "montre une performance financière moyenne avec des points à surveiller. ";
    else comment += "présente des défis financiers significatifs. ";
    return comment;
}


// --- MISE À JOUR DE L'UI ---
function createStat(label, value) {
    return `<div class="bg-gray-50 p-2 rounded-lg"><p class="text-xs text-gray-500">${label}</p><p class="text-md font-semibold">${value}</p></div>`;
}

function updateUICards(financialData, advancedData, score, comment) {
    document.getElementById('company-card').innerHTML = `<h3 class="text-xl font-bold text-gray-800">${financialData.name}</h3><p class="text-gray-600 mb-4">${financialData.symbol}</p><div class="space-y-2 text-sm"><p><i class="fas fa-industry w-5 text-gray-400 mr-2"></i>${financialData.sector}</p><p><i class="fas fa-globe w-5 text-gray-400 mr-2"></i>${financialData.country}</p><p><i class="fas fa-dollar-sign w-5 text-gray-400 mr-2"></i><span class="font-semibold">${safe(financialData.price, p => `$${p.toFixed(2)}`)}</span></p></div>`;
    const hue = (score / 10) * 120;
    document.getElementById('score-card').innerHTML = `<h3 class="text-lg font-semibold text-gray-800 mb-2 text-center">Score Financier</h3><div class="text-center my-4"><span class="text-5xl font-bold" style="color: hsl(${hue}, 80%, 45%)">${score.toFixed(1)}</span><span class="text-2xl text-gray-500">/10</span></div>`;
    document.getElementById('analysis-comment').textContent = comment;
    document.getElementById('quick-stats-card').innerHTML = `<h3 class="text-lg font-semibold text-gray-800 mb-4">Indicateurs Clés</h3><div class="grid grid-cols-2 gap-2">${createStat("Chiffre d'affaires", safe(financialData.revenue, formatCurrencyBillion))}${createStat("PER", safe(financialData.peRatio, r => r.toFixed(1)))}${createStat("ROE", safe(financialData.roe, formatPercentage))}${createStat("Marge nette", safe(financialData.netMargin, formatPercentage))}</div>`;
    document.getElementById('advanced-metrics-grid').innerHTML = `${createStat("Dette/Cap. Propres", safe(advancedData.debtToEquity, r => r.toFixed(2)))} ${createStat("Dividende (Yield)", safe(advancedData.dividendYield, formatPercentage))}`;
}

function createChart(canvasId, type, data, options) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    if (!ctx) return;

    if (canvasId === 'stock-chart' && stockChartInstance) stockChartInstance.destroy();
    if (canvasId === 'dividend-chart' && dividendChartInstance) dividendChartInstance.destroy();

    const chartInstance = new Chart(ctx, { type, data, options });

    if (canvasId === 'stock-chart') stockChartInstance = chartInstance;
    if (canvasId === 'dividend-chart') dividendChartInstance = chartInstance;
}

// --- FONCTION D'ANALYSE PRINCIPALE ---
async function analyzeCompany(ticker) {
    const loadingState = document.getElementById('loading-state');
    const analysisContent = document.getElementById('analysis-content');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');

    // 1. Gérer l'état de l'interface
    loadingState.classList.remove('hidden');
    analysisContent.classList.add('hidden');
    errorState.classList.add('hidden');

    try {
        // 2. Récupérer toutes les données en parallèle
        const [finRes, histRes, advRes, divRes] = await Promise.all([
            fetch(`${API_BASE}/entreprise/${ticker}`),
            fetch(`${API_BASE}/historique/${ticker}`),
            fetch(`${API_BASE}/advanced-metrics/${ticker}`),
            fetch(`${API_BASE}/dividends/${ticker}`),
        ]);

        if (!finRes.ok) throw new Error((await finRes.json()).detail || "Données financières non trouvées.");

        const financialData = await finRes.json();
        const historicalData = await histRes.json();
        const advancedData = await advRes.json();
        const dividendData = await divRes.json();
        
        currentCompanyData = { ...financialData, ...advancedData };

        // 3. Calculs et génération de contenu
        const score = calculateFinancialScore(currentCompanyData);
        const comment = generateFinancialComment(financialData, score);

        // 4. Mise à jour de l'UI
        document.title = `${financialData.name} (${financialData.symbol}) - FinAnalyse`;
        document.getElementById('analysis-title').textContent = `Analyse de ${financialData.name}`;
        updateUICards(financialData, advancedData, score, comment);

        // 5. Mise à jour des graphiques (avec gestion des données vides)
        createChart('stock-chart', 'line', {
            labels: historicalData.dates,
            datasets: [{ label: "Prix ($)", data: historicalData.prices, borderColor: "#3b82f6", fill: true }]
        }, { responsive: true, maintainAspectRatio: false });
        
        const dividendChartContainer = document.getElementById('dividend-chart').parentElement;
        if (dividendData.dividendHistory && dividendData.dividendHistory.amounts.length > 0) {
            dividendChartContainer.innerHTML = '<canvas id="dividend-chart"></canvas>'; // Recrée le canvas
            createChart('dividend-chart', 'bar', {
                labels: dividendData.dividendHistory.years,
                datasets: [{ label: "Dividende Annuel ($)", data: dividendData.dividendHistory.amounts, backgroundColor: "#10b981" }]
            }, { responsive: true, maintainAspectRatio: false });
        } else {
             dividendChartContainer.innerHTML = '<p class="text-center text-gray-500 h-full flex items-center justify-center">Aucune donnée de dividende disponible.</p>';
        }

        analysisContent.classList.remove('hidden');

    } catch (e) {
        errorState.classList.remove('hidden');
        errorMessage.textContent = `Erreur : ${e.message}. Vérifiez le symbole et réessayez.`;
        document.title = 'Erreur - FinAnalyse';
    } finally {
        // 6. Toujours masquer l'état de chargement à la fin
        loadingState.classList.add('hidden');
    }
}

// --- POINT D'ENTRÉE ---
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ticker = urlParams.get('ticker');

    if (ticker) {
        analyzeCompany(ticker.toUpperCase());
    } else {
        document.getElementById('loading-state').classList.add('hidden');
        const errorState = document.getElementById('error-state');
        errorState.classList.remove('hidden');
        document.getElementById('error-message').innerHTML = `Aucun symbole boursier fourni. <a href="index.html" class="font-bold underline">Retour à l'accueil</a>.`;
    }
});