// index.js
// Ce fichier est la version JavaScript compilée de index.tsx.
// C'est ce code qui est exécuté par le navigateur.

// --- FONCTIONS UTILITAIRES ---

/** Affiche une valeur de manière sécurisée, avec un fallback "N/A". */
const safe = (value, formatter = String) =>
  value !== undefined && value !== null && !isNaN(value) ? formatter(value) : "N/A";

/** Formate un nombre en milliards de dollars. */
const formatCurrencyBillion = (n) => `$${(n / 1e9).toFixed(1)}B`;

/** Formate un nombre en pourcentage. */
const formatPercentage = (n) => `${(n * 100).toFixed(1)}%`;

/** Formate un nombre en ratio (ex: 1.2x). */
const formatRatio = (n) => `${Number(n).toFixed(1)}x`;

// --- FONCTIONS DE CALCUL ET DE GÉNÉRATION ---

/** Calcule un score financier sur 10 basé sur plusieurs métriques. */
function calculateFinancialScore(data) {
  let score = 0;
  const maxScore = 14;

  // Rentabilité (4 points)
  if (data.roe > 0.2) score += 2; else if (data.roe > 0.1) score += 1;
  if (data.netMargin > 0.15) score += 2; else if (data.netMargin > 0.05) score += 1;

  // Valorisation (3 points)
  if (data.peRatio > 0 && data.peRatio < 15) score += 3;
  else if (data.peRatio < 25) score += 2;
  else if (data.peRatio < 40) score += 1;

  // Santé Financière (3 points)
  if (data.debtToEquity < 0.5) score += 3;
  else if (data.debtToEquity < 1) score += 2;
  else if (data.debtToEquity < 2) score += 1;

  // Taille (2 points)
  if (data.revenue > 100e9) score += 2; else if (data.revenue > 20e9) score += 1;
  
  // Dividende (2 points)
  if(data.dividendYield > 0.03) score += 2; else if(data.dividendYield > 0.01) score += 1;

  return Math.min(10, Math.round((score / maxScore) * 10 * 10) / 10);
}

/** Génère un commentaire textuel basé sur les données financières. */
function generateFinancialComment(data, score) {
    let comment = `Avec un score de ${score}/10, ${data.name} `;
    if (score >= 8) comment += "présente une excellente santé financière. ";
    else if (score >= 6) comment += "affiche une situation financière solide. ";
    else if (score >= 4) comment += "montre une performance financière moyenne avec des points à surveiller. ";
    else comment += "présente des défis financiers significatifs. ";

    // Ajout de détails
    if (data.roe > 0.15) comment += `La rentabilité sur capitaux propres est remarquable (${formatPercentage(data.roe)}). `;
    if (data.peRatio > 30) comment += `Cependant, sa valorisation semble élevée (PER de ${data.peRatio?.toFixed(1)}). `;
    if (data.debtToEquity < 1) comment += `L'endettement est bien maîtrisé. `;
    if (data.netMargin < 0.05) comment += `Les marges bénéficiaires semblent faibles (${formatPercentage(data.netMargin)}). `;
    
    return comment;
}

/** Génère les graphiques pour le prix de l'action et les dividendes. */
function createChart(canvasId, type, data, options) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    if (!ctx) return null;
    return new Chart(ctx, { type, data, options });
}

// --- FONCTION PRINCIPALE D'ANALYSE ---

async function analyzeCompany(ticker) {
  document.getElementById("analysis-page").classList.remove("hidden");
  document.getElementById("analysis-page").scrollIntoView({ behavior: "smooth" });
  document.getElementById("loading-state").classList.remove("hidden");
  document.getElementById("analysis-content").classList.add("hidden");

  try {
    const API_BASE = "https://finanalyse-api.onrender.com/api";
    const [finRes, histRes, advRes, divRes] = await Promise.all([
      fetch(`${API_BASE}/entreprise/${ticker}`),
      fetch(`${API_BASE}/historique/${ticker}`),
      fetch(`${API_BASE}/advanced-metrics/${ticker}`),
      fetch(`${API_BASE}/dividends/${ticker}`),
    ]);

    if (!finRes.ok) throw new Error((await finRes.json()).detail);

    const financialData = await finRes.json();
    const historicalData = await histRes.json();
    const advancedData = await advRes.json();
    const dividendData = await divRes.json();

    // -- Calcul du score et commentaire
    const score = calculateFinancialScore({...financialData, ...advancedData});
    const comment = generateFinancialComment(financialData, score);
    
    // -- Mise à jour de l'UI
    updateCompanyCard(financialData);
    updateScoreCard(score, comment);
    updateQuickStatsCard(financialData, advancedData);
    updateAdvancedMetrics(advancedData);
    
    // -- Mise à jour des graphiques
    if (window.stockChart) window.stockChart.destroy();
    if (window.dividendChart) window.dividendChart.destroy();
    
    window.stockChart = createChart('stock-chart', 'line', {
      labels: historicalData.dates,
      datasets: [{ label: "Prix ($)", data: historicalData.prices, borderColor: "#3b82f6", fill: true, backgroundColor: "rgba(59, 130, 246, 0.1)" }]
    }, { responsive: true, maintainAspectRatio: false });

    window.dividendChart = createChart('dividend-chart', 'bar', {
      labels: dividendData.dividendHistory.years,
      datasets: [{ label: "Dividende Annuel ($)", data: dividendData.dividendHistory.amounts, backgroundColor: "#10b981" }]
    }, { responsive: true, maintainAspectRatio: false });

  } catch (e) {
    alert("Erreur : " + e.message);
  } finally {
    document.getElementById("loading-state").classList.add("hidden");
    document.getElementById("analysis-content").classList.remove("hidden");
  }
}
window.analyzeCompany = analyzeCompany;

// --- FONCTIONS DE MISE À JOUR DE L'UI ---

function updateCompanyCard(data) {
    const card = document.getElementById('company-card');
    card.innerHTML = `
        <h3 class="text-xl font-bold text-gray-800">${data.name}</h3>
        <p class="text-gray-600 mb-4">${data.symbol}</p>
        <div class="space-y-2 text-sm">
            <p><i class="fas fa-industry w-5 text-gray-400 mr-2"></i>${data.sector}</p>
            <p><i class="fas fa-globe w-5 text-gray-400 mr-2"></i>${data.country}</p>
            <p><i class="fas fa-dollar-sign w-5 text-gray-400 mr-2"></i><span class="font-semibold">${safe(data.price, p => `$${p.toFixed(2)}`)}</span></p>
        </div>`;
}

function updateScoreCard(score, comment) {
    const card = document.getElementById('score-card');
    const hue = (score / 10) * 120; // 0 -> red, 10 -> green
    card.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 mb-2 text-center">Score Financier</h3>
        <div class="text-center my-4">
            <span class="text-5xl font-bold" style="color: hsl(${hue}, 80%, 45%)">${score.toFixed(1)}</span>
            <span class="text-2xl text-gray-500">/10</span>
        </div>
        <p class="text-xs text-gray-600 text-center">${comment.split('. ')[1] || ''}</p>`;
    document.getElementById('analysis-comment').textContent = comment;
}

function createStat(label, value) {
    return `<div class="bg-gray-50 p-2 rounded-lg"><p class="text-xs text-gray-500">${label}</p><p class="text-md font-semibold">${value}</p></div>`;
}

function updateQuickStatsCard(finData, advData) {
    const card = document.getElementById('quick-stats-card');
    card.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Indicateurs Clés</h3>
        <div class="grid grid-cols-2 gap-2">
            ${createStat("Chiffre d'affaires", safe(finData.revenue, formatCurrencyBillion))}
            ${createStat("Bénéfice net", safe(finData.netIncome, formatCurrencyBillion))}
            ${createStat("PER", safe(finData.peRatio, r => r.toFixed(1)))}
            ${createStat("ROE", safe(finData.roe, formatPercentage))}
            ${createStat("Marge nette", safe(finData.netMargin, formatPercentage))}
            ${createStat("Dividende (Yield)", safe(advData.dividendYield, formatPercentage))}
        </div>`;
}

function updateAdvancedMetrics(advData) {
    const grid = document.getElementById('advanced-metrics-grid');
    grid.innerHTML = `
        ${createStat("Ratio de liquidité", safe(advData.currentRatio, r => r.toFixed(2)))}
        ${createStat("Liquidité rapide", safe(advData.quickRatio, r => r.toFixed(2)))}
        ${createStat("Dette/Cap. Propres", safe(advData.debtToEquity, r => r.toFixed(2)))}
        ${createStat("Free Cash Flow", safe(advData.freeCashFlow, formatCurrencyBillion))}
        ${createStat("Couv. des intérêts", safe(advData.interestCoverage, formatRatio))}
    `;
}

// --- GESTION DES ÉVÉNEMENTS ---

document.addEventListener("DOMContentLoaded", () => {
    // Navigation
    const homeBtn = document.getElementById("home-link");
    const backBtn = document.getElementById("back-btn");
    const homePage = document.getElementById("home-page");
    const analysisPage = document.getElementById("analysis-page");

    const goToHome = () => {
        analysisPage.classList.add("hidden");
        homePage.classList.remove("hidden");
    };

    homeBtn.addEventListener("click", goToHome);
    backBtn.addEventListener("click", goToHome);

    // Lancer l'analyse
    document.getElementById("analyze-btn").addEventListener("click", () => {
        const ticker = document.getElementById("company-search").value;
        if (ticker) analyzeCompany(ticker);
    });

    // Screener
    document.getElementById("run-screener").addEventListener("click", async () => {
        const sector = document.getElementById("sector-select").value;
        const peMax = document.getElementById("pe-max").value;
        const dividendMin = document.getElementById("dividend-min").value;

        const params = new URLSearchParams();
        if (sector) params.append("sector", sector);
        if (peMax) params.append("pe_max", peMax);
        if (dividendMin) params.append("dividend_min", dividendMin);
        
        const response = await fetch(`http://localhost:8000/api/screener?${params.toString()}`);
        const data = await response.json();
        
        const resultsDiv = document.getElementById("screener-results");
        const tableBody = data.results.map(stock => `
            <tr>
                <td class="px-4 py-2"><a href="#" onclick="window.analyzeCompany('${stock.symbol}')" class="text-blue-600 hover:underline">${stock.symbol}</a></td>
                <td class="px-4 py-2">${stock.name}</td>
                <td class="px-4 py-2">${safe(stock.pe, r => r.toFixed(1))}</td>
                <td class="px-4 py-2">${safe(stock.dividendYield, formatPercentage)}</td>
            </tr>`).join('');
            
        resultsDiv.innerHTML = `<table class="min-w-full text-sm text-left"><thead><tr class="bg-gray-50"><th class="px-4 py-2">Sym.</th><th class="px-4 py-2">Nom</th><th class="px-4 py-2">PER</th><th class="px-4 py-2">Dividende</th></tr></thead><tbody>${tableBody}</tbody></table>`;
        resultsDiv.classList.remove("hidden");
    });
    
    // Comparaison
    document.getElementById("add-to-comparison").addEventListener("click", async () => {
      // Logique de comparaison à implémenter si nécessaire
      alert("Fonctionnalité de comparaison en cours de développement !");
    });
});