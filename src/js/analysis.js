// js/analysis.js - VERSION FINALE ET COMPLÈTE EN JAVASCRIPT PUR

// --- CONSTANTES ET VARIABLES GLOBALES ---
const API_BASE = "http://localhost:8000/api";
let currentCompanyData = null; // Stocke les données de l'entreprise principale pour la comparaison

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
  return Math.min(10, Math.round((score / maxScore) * 10 * 10) / 10);
}

function generateFinancialComment(data, score) {
    let comment = `Avec un score de ${score}/10, ${data.name} `;
    if (score >= 8) comment += "présente une excellente santé financière. ";
    else if (score >= 6) comment += "affiche une situation financière solide. ";
    else if (score >= 4) comment += "montre une performance financière moyenne. ";
    else comment += "présente des défis financiers significatifs. ";
    if (data.roe > 0.15) comment += `La rentabilité sur capitaux propres est remarquable (${formatPercentage(data.roe)}). `;
    if (data.peRatio > 30) comment += `Sa valorisation semble élevée (PER de ${data.peRatio?.toFixed(1)}). `;
    if (data.debtToEquity < 1) comment += `L'endettement est bien maîtrisé. `;
    return comment;
}

// --- FONCTIONS DE COMPARAISON ---
function createComparisonRow(metric, valueA, valueB, lowerIsBetter = false) {
  const numA = parseFloat(valueA);
  const numB = parseFloat(valueB);
  let classA = "", classB = "";
  if (!isNaN(numA) && !isNaN(numB)) {
    const winnerClass = "text-green-600 font-bold", loserClass = "text-red-600";
    if ((!lowerIsBetter && numA > numB) || (lowerIsBetter && numA < numB)) {
      classA = winnerClass; classB = loserClass;
    } else if ((!lowerIsBetter && numB > numA) || (lowerIsBetter && numB < numA)) {
      classB = winnerClass; classA = loserClass;
    }
  }
  return `<tr><td class="px-2 py-2 font-medium text-gray-600">${metric}</td><td class="px-2 py-2 text-center ${classA}">${valueA}</td><td class="px-2 py-2 text-center ${classB}">${valueB}</td></tr>`;
}

function generateComparisonSummary(dataA, dataB) {
  const strengthsA = [], strengthsB = [];
  if (dataA.peRatio && dataB.peRatio) (dataA.peRatio < dataB.peRatio) ? strengthsA.push("une valorisation plus attractive (PER bas)") : strengthsB.push("une valorisation plus attractive (PER bas)");
  if (dataA.roe && dataB.roe) (dataA.roe > dataB.roe) ? strengthsA.push("une meilleure rentabilité (ROE)") : strengthsB.push("une meilleure rentabilité (ROE)");
  if (dataA.netMargin && dataB.netMargin) (dataA.netMargin > dataB.netMargin) ? strengthsA.push("des marges plus élevées") : strengthsB.push("des marges plus élevées");
  if (dataA.debtToEquity && dataB.debtToEquity) (dataA.debtToEquity < dataB.debtToEquity) ? strengthsA.push("un endettement mieux maîtrisé") : strengthsB.push("un endettement mieux maîtrisé");
  let summary = `En comparant <strong>${dataA.name}</strong> et <strong>${dataB.name}</strong>, plusieurs points ressortent.`;
  if (strengthsA.length > 0) summary += ` <br><br><strong>${dataA.name}</strong> se distingue par ${strengthsA.join(", ")}.`;
  if (strengthsB.length > 0) summary += ` <br><br>À l'inverse, <strong>${dataB.name}</strong> montre sa force avec ${strengthsB.join(", ")}.`;
  let conclusion = (strengthsA.length > strengthsB.length) ? `<strong>${dataA.name}</strong> semble présenter un profil globalement plus robuste.` : (strengthsB.length > strengthsA.length) ? `<strong>${dataB.name}</strong> semble présenter un profil globalement plus attractif.` : "Les deux entreprises présentent des profils compétitifs.";
  summary += `<br><br><strong>Conclusion :</strong> ${conclusion}`;
  summary += `<br><br><em class="text-xs text-gray-500">Ce commentaire est généré automatiquement et ne constitue pas un conseil en investissement.</em>`;
  return summary;
}


// --- FONCTIONS DE MISE À JOUR DE L'INTERFACE ---
function createChart(canvasId, type, data, options) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    if (!ctx) return null;
    if (window[canvasId + '_instance']) window[canvasId + '_instance'].destroy();
    window[canvasId + '_instance'] = new Chart(ctx, { type, data, options });
}

function createStat(label, value) {
    return `<div class="bg-gray-50 p-2 rounded-lg"><p class="text-xs text-gray-500">${label}</p><p class="text-md font-semibold">${value}</p></div>`;
}

function updateUICards(financialData, advancedData, score, comment) {
    // Carte d'identité
    document.getElementById('company-card').innerHTML = `<h3 class="text-xl font-bold text-gray-800">${financialData.name}</h3><p class="text-gray-600 mb-4">${financialData.symbol}</p><div class="space-y-2 text-sm"><p><i class="fas fa-industry w-5 text-gray-400 mr-2"></i>${financialData.sector}</p><p><i class="fas fa-globe w-5 text-gray-400 mr-2"></i>${financialData.country}</p><p><i class="fas fa-dollar-sign w-5 text-gray-400 mr-2"></i><span class="font-semibold">${safe(financialData.price, p => `$${p.toFixed(2)}`)}</span></p></div>`;

    // Carte de score
    const hue = (score / 10) * 120;
    document.getElementById('score-card').innerHTML = `<h3 class="text-lg font-semibold text-gray-800 mb-2 text-center">Score Financier</h3><div class="text-center my-4"><span class="text-5xl font-bold" style="color: hsl(${hue}, 80%, 45%)">${score.toFixed(1)}</span><span class="text-2xl text-gray-500">/10</span></div><p class="text-xs text-gray-600 text-center">${comment.split('. ')[1] || ''}</p>`;
    document.getElementById('analysis-comment').textContent = comment;

    // Carte des indicateurs clés
    document.getElementById('quick-stats-card').innerHTML = `<h3 class="text-lg font-semibold text-gray-800 mb-4">Indicateurs Clés</h3><div class="grid grid-cols-2 gap-2">${createStat("Chiffre d'affaires", safe(financialData.revenue, formatCurrencyBillion))}${createStat("Bénéfice net", safe(financialData.netIncome, formatCurrencyBillion))}${createStat("PER", safe(financialData.peRatio, r => r.toFixed(1)))}${createStat("ROE", safe(financialData.roe, formatPercentage))}${createStat("Marge nette", safe(financialData.netMargin, formatPercentage))}${createStat("Dividende (Yield)", safe(advancedData.dividendYield, formatPercentage))}</div>`;

    // Grille des métriques avancées
    document.getElementById('advanced-metrics-grid').innerHTML = `
        ${createStat("Ratio de liquidité", safe(advancedData.currentRatio, r => r.toFixed(2)))}
        ${createStat("Liquidité rapide", safe(advancedData.quickRatio, r => r.toFixed(2)))}
        ${createStat("Dette/Cap. Propres", safe(advancedData.debtToEquity, r => r.toFixed(2)))}
        ${createStat("Couv. des intérêts", safe(advancedData.interestCoverage, formatRatio))}
        ${createStat("Free Cash Flow", safe(advancedData.freeCashFlow, formatCurrencyBillion))} 
    `; // ^^^ ASSUREZ-VOUS QUE CETTE LIGNE EST BIEN LÀ ^^^
}


// --- FONCTION PRINCIPALE D'ANALYSE ---
async function analyzeCompany(ticker) {
  const loadingState = document.getElementById('loading-state'), analysisContent = document.getElementById('analysis-content'), errorState = document.getElementById('error-state'), errorMessage = document.getElementById('error-message');
  loadingState.classList.remove('hidden');
  analysisContent.classList.add('hidden');
  errorState.classList.add('hidden');

  try {
    const [finRes, histRes, advRes, divRes] = await Promise.all([
      fetch(`${API_BASE}/entreprise/${ticker}`), fetch(`${API_BASE}/historique/${ticker}`),
      fetch(`${API_BASE}/advanced-metrics/${ticker}`), fetch(`${API_BASE}/dividends/${ticker}`),
    ]);
    if (!finRes.ok) throw new Error((await finRes.json()).detail || "Données financières non trouvées.");
    
    const financialData = await finRes.json(), historicalData = await histRes.json(),
          advancedData = await advRes.json(), dividendData = await divRes.json();
    currentCompanyData = { ...financialData, ...advancedData };
    
    const score = calculateFinancialScore(currentCompanyData);
    const comment = generateFinancialComment(financialData, score);
    
    document.title = `${financialData.name} (${financialData.symbol}) - FinAnalyse`;
    document.getElementById('analysis-title').textContent = `Analyse de ${financialData.name}`;

    updateUICards(financialData, advancedData, score, comment);
    createChart('stock-chart', 'line', { labels: historicalData.dates, datasets: [{ label: "Prix ($)", data: historicalData.prices, borderColor: "#3b82f6", fill: true, backgroundColor: "rgba(59, 130, 246, 0.1)" }] }, { responsive: true, maintainAspectRatio: false });
    createChart('dividend-chart', 'bar', { labels: dividendData.dividendHistory.years, datasets: [{ label: "Dividende Annuel ($)", data: dividendData.dividendHistory.amounts, backgroundColor: "#10b981" }] }, { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } });

    analysisContent.classList.remove('hidden');
  } catch (e) {
    errorState.classList.remove('hidden');
    errorMessage.textContent = `Erreur : ${e.message}. Vérifiez le symbole et réessayez.`;
    document.title = 'Erreur - FinAnalyse';
  } finally {
    loadingState.classList.add('hidden');
  }
}

// --- POINT D'ENTRÉE DU SCRIPT ---
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
        document.title = 'Aucune entreprise - FinAnalyse';
    }
    
    // Événement pour le Screener d'actions
    document.getElementById("run-screener").addEventListener("click", async () => {
        const resultsDiv = document.getElementById("screener-results");
        resultsDiv.innerHTML = `<p class="text-sm text-gray-500">Recherche en cours...</p>`;
        resultsDiv.classList.remove("hidden");
        const params = new URLSearchParams({
            sector: document.getElementById("sector-select").value,
            pe_max: document.getElementById("pe-max").value,
            dividend_min: document.getElementById("dividend-min").value,
        });
        const response = await fetch(`${API_BASE}/screener?${params.toString()}`);
        const data = await response.json();
        const tableBody = data.results.map(stock => `<tr><td class="px-4 py-2"><a href="#" onclick="analyzeCompany('${stock.symbol}')" class="text-blue-600 hover:underline">${stock.symbol}</a></td><td class="px-4 py-2">${stock.name}</td><td class="px-4 py-2">${safe(stock.pe, r => r.toFixed(1))}</td><td class="px-4 py-2">${safe(stock.dividendYield, formatPercentage)}</td></tr>`).join('');
        resultsDiv.innerHTML = `<table class="min-w-full text-sm text-left"><thead><tr class="bg-gray-50"><th class="px-4 py-2">Sym.</th><th class="px-4 py-2">Nom</th><th class="px-4 py-2">PER</th><th class="px-4 py-2">Dividende</th></tr></thead><tbody>${tableBody}</tbody></table>`;
    });
    
    // Événement pour la Comparaison
    document.getElementById("add-to-comparison").addEventListener("click", async () => {
      const compareTicker = document.getElementById("compare-ticker").value.trim().toUpperCase();
      if (!compareTicker || !currentCompanyData) {
        alert("Veuillez d'abord analyser une entreprise et entrer un symbole à comparer.");
        return;
      }
      const containerDiv = document.getElementById("comparison-container"), summaryDiv = document.getElementById("comparison-summary");
      summaryDiv.innerHTML = "Chargement des données de comparaison...";
      containerDiv.classList.remove("hidden");
      try {
        const [compFinRes, compAdvRes] = await Promise.all([fetch(`${API_BASE}/entreprise/${compareTicker}`), fetch(`${API_BASE}/advanced-metrics/${compareTicker}`)]);
        if (!compFinRes.ok) throw new Error((await compFinRes.json()).detail);
        const compFinancialData = await compFinRes.json(), compAdvancedData = await compAdvRes.json();
        const comparisonCompanyData = { ...compFinancialData, ...compAdvancedData };
        
        let tableHTML = `<table class="min-w-full text-sm text-left"><thead class="bg-gray-50"><tr><th class="px-2 py-2">Métrique</th><th class="px-2 py-2 text-center font-semibold">${currentCompanyData.symbol}</th><th class="px-2 py-2 text-center font-semibold">${comparisonCompanyData.symbol}</th></tr></thead><tbody>`;
        tableHTML += createComparisonRow("PER", safe(currentCompanyData.peRatio, r => r.toFixed(1)), safe(comparisonCompanyData.peRatio, r => r.toFixed(1)), true);
        tableHTML += createComparisonRow("ROE", safe(currentCompanyData.roe, formatPercentage), safe(comparisonCompanyData.roe, formatPercentage));
        tableHTML += createComparisonRow("Marge Nette", safe(currentCompanyData.netMargin, formatPercentage), safe(comparisonCompanyData.netMargin, formatPercentage));
        tableHTML += createComparisonRow("Dette/Cap. Propres", safe(currentCompanyData.debtToEquity, r => r.toFixed(2)), safe(comparisonCompanyData.debtToEquity, r => r.toFixed(2)), true);
        tableHTML += createComparisonRow("Dividende (Yield)", safe(currentCompanyData.dividendYield, formatPercentage), safe(comparisonCompanyData.dividendYield, formatPercentage));
        tableHTML += `</tbody></table>`;
        document.getElementById("comparison-table-container").innerHTML = tableHTML;
        summaryDiv.innerHTML = generateComparisonSummary(currentCompanyData, comparisonCompanyData);
      } catch (e) {
        alert("Erreur comparaison : " + e.message);
        containerDiv.classList.add("hidden");
      }
    });
});