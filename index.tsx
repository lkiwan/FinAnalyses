// index.tsx - VERSION FINALE, COMPLÈTE ET CORRIGÉE

// Déclaration pour informer TypeScript de l'existence de la bibliothèque Chart.js chargée globalement
declare const Chart: any;

// Déclaration pour étendre l'objet window et éviter les erreurs TypeScript
declare global {
  interface Window {
    stockChart?: any;
    dividendChart?: any;
    analyzeCompany: (ticker: string) => void;
  }
}

// --- CONSTANTES ET FONCTIONS UTILITAIRES GLOBALES ---
const API_BASE = "http://localhost:8000/api"; // CORRECTION : Déplacé ici pour être accessible partout

const safe = (value: any, formatter: (v: any) => string = String) =>
  value !== undefined && value !== null && !isNaN(value)
    ? formatter(value)
    : "N/A";
const formatCurrencyBillion = (n: number) => `$${(n / 1e9).toFixed(1)}B`;
const formatPercentage = (n: number) => `${(n * 100).toFixed(1)}%`;
const formatRatio = (n: number) => `${Number(n).toFixed(1)}x`;

// --- VARIABLE GLOBALE POUR LA COMPARAISON ---
let currentCompanyData: any = null;

// --- FONCTIONS DE COMPARAISON ---
function createComparisonRow(
  metric: string,
  valueA: any,
  valueB: any,
  lowerIsBetter = false
): string {
  const numA = parseFloat(valueA);
  const numB = parseFloat(valueB);
  let classA = "",
    classB = "";
  if (!isNaN(numA) && !isNaN(numB)) {
    const winnerClass = "text-green-600 font-bold",
      loserClass = "text-red-600";
    if ((!lowerIsBetter && numA > numB) || (lowerIsBetter && numA < numB)) {
      classA = winnerClass;
      classB = loserClass;
    } else if (
      (!lowerIsBetter && numB > numA) ||
      (lowerIsBetter && numB < numA)
    ) {
      classB = winnerClass;
      classA = loserClass;
    }
  }
  return `<tr><td class="px-2 py-2 font-medium text-gray-600">${metric}</td><td class="px-2 py-2 text-center ${classA}">${valueA}</td><td class="px-2 py-2 text-center ${classB}">${valueB}</td></tr>`;
}

function generateComparisonSummary(dataA: any, dataB: any): string {
  const strengthsA: string[] = [],
    strengthsB: string[] = [];
  if (dataA.peRatio && dataB.peRatio)
    dataA.peRatio < dataB.peRatio
      ? strengthsA.push("une valorisation plus attractive (PER bas)")
      : strengthsB.push("une valorisation plus attractive (PER bas)");
  if (dataA.roe && dataB.roe)
    dataA.roe > dataB.roe
      ? strengthsA.push("une meilleure rentabilité (ROE)")
      : strengthsB.push("une meilleure rentabilité (ROE)");
  if (dataA.netMargin && dataB.netMargin)
    dataA.netMargin > dataB.netMargin
      ? strengthsA.push("des marges plus élevées")
      : strengthsB.push("des marges plus élevées");
  if (dataA.debtToEquity && dataB.debtToEquity)
    dataA.debtToEquity < dataB.debtToEquity
      ? strengthsA.push("un endettement mieux maîtrisé")
      : strengthsB.push("un endettement mieux maîtrisé");
  let summary = `En comparant <strong>${dataA.name}</strong> et <strong>${dataB.name}</strong>, plusieurs points ressortent.`;
  if (strengthsA.length > 0)
    summary += ` <br><br><strong>${
      dataA.name
    }</strong> se distingue par ${strengthsA.join(", ")}.`;
  if (strengthsB.length > 0)
    summary += ` <br><br>À l'inverse, <strong>${
      dataB.name
    }</strong> montre sa force avec ${strengthsB.join(", ")}.`;
  let conclusion = "";
  if (strengthsA.length > strengthsB.length)
    conclusion = `<strong>${dataA.name}</strong> semble présenter un profil globalement plus robuste.`;
  else if (strengthsB.length > strengthsA.length)
    conclusion = `<strong>${dataB.name}</strong> semble présenter un profil globalement plus attractif.`;
  else
    conclusion =
      "Les deux entreprises présentent des profils compétitifs, le choix dépend des priorités de l'investisseur.";
  summary += `<br><br><strong>Conclusion :</strong> ${conclusion}`;
  summary += `<br><br><em class="text-xs text-gray-500">Ce commentaire est généré automatiquement à titre informatif et ne constitue pas un conseil en investissement.</em>`;
  return summary;
}

// --- FONCTIONS DE MISE À JOUR DE L'UI ---
function updateCompanyCard(data: any) {
  const card = document.getElementById("company-card")!;
  card.innerHTML = `<h3 class="text-xl font-bold text-gray-800">${
    data.name
  }</h3><p class="text-gray-600 mb-4">${
    data.symbol
  }</p><div class="space-y-2 text-sm"><p><i class="fas fa-industry w-5 text-gray-400 mr-2"></i>${
    data.sector
  }</p><p><i class="fas fa-globe w-5 text-gray-400 mr-2"></i>${
    data.country
  }</p><p><i class="fas fa-dollar-sign w-5 text-gray-400 mr-2"></i><span class="font-semibold">${safe(
    data.price,
    (p: number) => `$${p.toFixed(2)}`
  )}</span></p></div>`;
}
function updateScoreCard(score: number, comment: string) {
  const card = document.getElementById("score-card")!;
  const hue = (score / 10) * 120;
  card.innerHTML = `<h3 class="text-lg font-semibold text-gray-800 mb-2 text-center">Score Financier</h3><div class="text-center my-4"><span class="text-5xl font-bold" style="color: hsl(${hue}, 80%, 45%)">${score.toFixed(
    1
  )}</span><span class="text-2xl text-gray-500">/10</span></div><p class="text-xs text-gray-600 text-center">${
    comment.split(". ")[1] || ""
  }</p>`;
  document.getElementById("analysis-comment")!.textContent = comment;
}
function createStat(label: string, value: string): string {
  return `<div class="bg-gray-50 p-2 rounded-lg"><p class="text-xs text-gray-500">${label}</p><p class="text-md font-semibold">${value}</p></div>`;
}
function updateQuickStatsCard(finData: any, advData: any) {
  const card = document.getElementById("quick-stats-card")!;
  card.innerHTML = `<h3 class="text-lg font-semibold text-gray-800 mb-4">Indicateurs Clés</h3><div class="grid grid-cols-2 gap-2">${createStat(
    "Chiffre d'affaires",
    safe(finData.revenue, formatCurrencyBillion)
  )}${createStat(
    "Bénéfice net",
    safe(finData.netIncome, formatCurrencyBillion)
  )}${createStat(
    "PER",
    safe(finData.peRatio, (r: number) => r.toFixed(1))
  )}${createStat("ROE", safe(finData.roe, formatPercentage))}${createStat(
    "Marge nette",
    safe(finData.netMargin, formatPercentage)
  )}${createStat(
    "Dividende (Yield)",
    safe(advData.dividendYield, formatPercentage)
  )}</div>`;
}
function updateAdvancedMetrics(advData: any) {
  const grid = document.getElementById("advanced-metrics-grid")!;
  grid.innerHTML = `${createStat(
    "Ratio de liquidité",
    safe(advData.currentRatio, (r: number) => r.toFixed(2))
  )}${createStat(
    "Liquidité rapide",
    safe(advData.quickRatio, (r: number) => r.toFixed(2))
  )}${createStat(
    "Dette/Cap. Propres",
    safe(advData.debtToEquity, (r: number) => r.toFixed(2))
  )}${createStat(
    "Free Cash Flow",
    safe(advData.freeCashFlow, formatCurrencyBillion)
  )}${createStat(
    "Couv. des intérêts",
    safe(advData.interestCoverage, formatRatio)
  )}`;
}

// --- FONCTIONS DE CALCUL ---
function calculateFinancialScore(data: any): number {
  let score = 0;
  const maxScore = 14;
  if (data.roe > 0.2) score += 2;
  else if (data.roe > 0.1) score += 1;
  if (data.netMargin > 0.15) score += 2;
  else if (data.netMargin > 0.05) score += 1;
  if (data.peRatio > 0 && data.peRatio < 15) score += 3;
  else if (data.peRatio < 25) score += 2;
  else if (data.peRatio < 40) score += 1;
  if (data.debtToEquity < 0.5) score += 3;
  else if (data.debtToEquity < 1) score += 2;
  else if (data.debtToEquity < 2) score += 1;
  if (data.revenue > 100e9) score += 2;
  else if (data.revenue > 20e9) score += 1;
  if (data.dividendYield > 0.03) score += 2;
  else if (data.dividendYield > 0.01) score += 1;
  return Math.min(10, Math.round((score / maxScore) * 10 * 10) / 10);
}
function generateFinancialComment(data: any, score: number): string {
  let comment = `Avec un score de ${score}/10, ${data.name} `;
  if (score >= 8) comment += "présente une excellente santé financière. ";
  else if (score >= 6) comment += "affiche une situation financière solide. ";
  else if (score >= 4)
    comment +=
      "montre une performance financière moyenne avec des points à surveiller. ";
  else comment += "présente des défis financiers significatifs. ";
  if (data.roe > 0.15)
    comment += `La rentabilité sur capitaux propres est remarquable (${formatPercentage(
      data.roe
    )}). `;
  if (data.peRatio > 30)
    comment += `Cependant, sa valorisation semble élevée (PER de ${data.peRatio?.toFixed(
      1
    )}). `;
  if (data.debtToEquity < 1) comment += `L'endettement est bien maîtrisé. `;
  if (data.netMargin < 0.05)
    comment += `Les marges bénéficiaires semblent faibles (${formatPercentage(
      data.netMargin
    )}). `;
  return comment;
}

// --- FONCTION DE CRÉATION DE GRAPHIQUE ---
function createChart(
  canvasId: string,
  type: any,
  data: any,
  options: any
): any {
  const ctx = (
    document.getElementById(canvasId) as HTMLCanvasElement
  )?.getContext("2d");
  if (!ctx) return null;
  return new Chart(ctx, { type, data, options });
}

// --- FONCTION PRINCIPALE D'ANALYSE ---
async function analyzeCompany(ticker: string) {
  document.getElementById("analysis-page")?.classList.remove("hidden");
  document
    .getElementById("analysis-page")
    ?.scrollIntoView({ behavior: "smooth" });
  document.getElementById("loading-state")?.classList.remove("hidden");
  document.getElementById("analysis-content")?.classList.add("hidden");
  document.getElementById("comparison-container")?.classList.add("hidden");
  const dividendChartEl = document.getElementById(
    "dividend-chart"
  ) as HTMLCanvasElement;
  const dividendNoDataEl = document.getElementById("dividend-no-data")!;
  try {
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
    currentCompanyData = { ...financialData, ...advancedData };
    const score = calculateFinancialScore(currentCompanyData);
    const comment = generateFinancialComment(financialData, score);
    updateCompanyCard(financialData);
    updateScoreCard(score, comment);
    updateQuickStatsCard(financialData, advancedData);
    updateAdvancedMetrics(advancedData);
    if (window.stockChart) window.stockChart.destroy();
    if (window.dividendChart) window.dividendChart.destroy();
    window.stockChart = createChart(
      "stock-chart",
      "line",
      {
        labels: historicalData.dates,
        datasets: [
          {
            label: "Prix ($)",
            data: historicalData.prices,
            borderColor: "#3b82f6",
            fill: true,
            backgroundColor: "rgba(59, 130, 246, 0.1)",
          },
        ],
      },
      { responsive: true, maintainAspectRatio: false }
    );
    if (
      dividendData.dividendHistory &&
      dividendData.dividendHistory.amounts.length > 0
    ) {
      dividendChartEl.classList.remove("hidden");
      dividendNoDataEl.classList.add("hidden");
      window.dividendChart = createChart(
        "dividend-chart",
        "bar",
        {
          labels: dividendData.dividendHistory.years,
          datasets: [
            {
              label: "Dividende Annuel ($)",
              data: dividendData.dividendHistory.amounts,
              backgroundColor: "#10b981",
            },
          ],
        },
        {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
        }
      );
    } else {
      dividendChartEl.classList.add("hidden");
      dividendNoDataEl.classList.remove("hidden");
    }
  } catch (e: any) {
    alert("Erreur : " + e.message);
  } finally {
    document.getElementById("loading-state")?.classList.add("hidden");
    document.getElementById("analysis-content")?.classList.remove("hidden");
  }
}
window.analyzeCompany = analyzeCompany;

// --- GESTIONNAIRES D'ÉVÉNEMENTS ---
document.addEventListener("DOMContentLoaded", () => {
  // Navigation
  const homeBtn = document.getElementById("home-link")!,
    backBtn = document.getElementById("back-btn")!;
  const homePage = document.getElementById("home-page")!,
    analysisPage = document.getElementById("analysis-page")!;
  const goToHome = () => {
    analysisPage.classList.add("hidden");
    homePage.classList.remove("hidden");
  };
  homeBtn.addEventListener("click", goToHome);
  backBtn.addEventListener("click", goToHome);

  // Recherche
  document.getElementById("analyze-btn")!.addEventListener("click", () => {
    const ticker = (
      document.getElementById("company-search") as HTMLInputElement
    ).value;
    if (ticker) analyzeCompany(ticker);
  });

  // Screener
  document
    .getElementById("run-screener")!
    .addEventListener("click", async () => {
      const sector = (
        document.getElementById("sector-select") as HTMLSelectElement
      ).value;
      const peMax = (document.getElementById("pe-max") as HTMLInputElement)
        .value;
      const dividendMin = (
        document.getElementById("dividend-min") as HTMLInputElement
      ).value;
      const params = new URLSearchParams();
      if (sector) params.append("sector", sector);
      if (peMax) params.append("pe_max", peMax);
      if (dividendMin) params.append("dividend_min", dividendMin);

      const response = await fetch(`${API_BASE}/screener?${params.toString()}`);
      const data = await response.json();
      const resultsDiv = document.getElementById("screener-results")!;
      const tableBody = data.results
        .map(
          (stock: any) =>
            `<tr><td class="px-4 py-2"><a href="#" onclick="window.analyzeCompany('${
              stock.symbol
            }')" class="text-blue-600 hover:underline">${
              stock.symbol
            }</a></td><td class="px-4 py-2">${
              stock.name
            }</td><td class="px-4 py-2">${safe(stock.pe, (r: number) =>
              r.toFixed(1)
            )}</td><td class="px-4 py-2">${safe(
              stock.dividendYield,
              formatPercentage
            )}</td></tr>`
        )
        .join("");
      resultsDiv.innerHTML = `<table class="min-w-full text-sm text-left"><thead class="bg-gray-50"><tr><th class="px-4 py-2 font-medium">Sym.</th><th class="px-4 py-2 font-medium">Nom</th><th class="px-4 py-2 font-medium">PER</th><th class="px-4 py-2 font-medium">Dividende</th></tr></thead><tbody>${tableBody}</tbody></table>`;
      resultsDiv.classList.remove("hidden");
    });

  // Comparaison
  document
    .getElementById("add-to-comparison")!
    .addEventListener("click", async () => {
      const compareTicker = (
        document.getElementById("compare-ticker") as HTMLInputElement
      ).value;
      if (!compareTicker || !currentCompanyData) {
        alert(
          "Veuillez d'abord analyser une entreprise et entrer un symbole à comparer."
        );
        return;
      }
      const summaryDiv = document.getElementById("comparison-summary")!;
      const containerDiv = document.getElementById("comparison-container")!;
      summaryDiv.innerHTML = "Chargement des données de comparaison...";
      containerDiv.classList.remove("hidden");
      try {
        const [compFinRes, compAdvRes] = await Promise.all([
          fetch(`${API_BASE}/entreprise/${compareTicker}`),
          fetch(`${API_BASE}/advanced-metrics/${compareTicker}`),
        ]);
        if (!compFinRes.ok) throw new Error((await compFinRes.json()).detail);
        const compFinancialData = await compFinRes.json();
        const compAdvancedData = await compAdvRes.json();
        const comparisonCompanyData = {
          ...compFinancialData,
          ...compAdvancedData,
        };
        const tableContainer = document.getElementById(
          "comparison-table-container"
        )!;
        let tableHTML = `<table class="min-w-full text-sm text-left"><thead class="bg-gray-50"><tr><th class="px-2 py-2">Métrique</th><th class="px-2 py-2 text-center font-semibold">${currentCompanyData.symbol}</th><th class="px-2 py-2 text-center font-semibold">${comparisonCompanyData.symbol}</th></tr></thead><tbody>`;
        tableHTML += createComparisonRow(
          "PER",
          safe(currentCompanyData.peRatio, (r: number) => r.toFixed(1)),
          safe(comparisonCompanyData.peRatio, (r: number) => r.toFixed(1)),
          true
        );
        tableHTML += createComparisonRow(
          "ROE",
          safe(currentCompanyData.roe, formatPercentage),
          safe(comparisonCompanyData.roe, formatPercentage)
        );
        tableHTML += createComparisonRow(
          "Marge Nette",
          safe(currentCompanyData.netMargin, formatPercentage),
          safe(comparisonCompanyData.netMargin, formatPercentage)
        );
        tableHTML += createComparisonRow(
          "Dette/Cap. Propres",
          safe(currentCompanyData.debtToEquity, (r: number) => r.toFixed(2)),
          safe(comparisonCompanyData.debtToEquity, (r: number) => r.toFixed(2)),
          true
        );
        tableHTML += createComparisonRow(
          "Dividende (Yield)",
          safe(currentCompanyData.dividendYield, formatPercentage),
          safe(comparisonCompanyData.dividendYield, formatPercentage)
        );
        tableHTML += `</tbody></table>`;
        tableContainer.innerHTML = tableHTML;
        summaryDiv.innerHTML = generateComparisonSummary(
          currentCompanyData,
          comparisonCompanyData
        );
      } catch (e: any) {
        alert("Erreur lors de la comparaison : " + e.message);
        containerDiv.classList.add("hidden");
      }
    });
});

// Assure que le fichier est traité comme un module TypeScript
export {};
