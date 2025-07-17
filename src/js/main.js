// js/main.js

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("company-search");
    const analyzeBtn = document.getElementById("analyze-btn");

    /**
     * Lit la valeur de l'input et redirige vers la page d'analyse.
     */
    const startAnalysis = () => {
        // .trim() enlève les espaces inutiles, .toUpperCase() standardise le symbole
        const ticker = searchInput.value.trim().toUpperCase();
        
        if (ticker) {
            // Redirige vers analysis.html en passant le ticker comme paramètre d'URL
            window.location.href = `analysis.html?ticker=${ticker}`;
        } else {
            alert("Veuillez entrer un nom ou un symbole boursier.");
        }
    };

    // Gère le clic sur le bouton "Analyser"
    analyzeBtn.addEventListener("click", startAnalysis);

    // Gère la pression de la touche "Entrée" dans le champ de recherche
    searchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            startAnalysis();
        }
    });
});

/**
 * Fonction globale appelée par les cartes de suggestion dans index.html.
 * @param {string} ticker Le symbole boursier à analyser.
 */
function redirectToAnalysis(ticker) {
    if (ticker) {
        window.location.href = `analysis.html?ticker=${ticker}`;
    }
}