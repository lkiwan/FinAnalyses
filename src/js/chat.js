// js/chat.js - VERSION FINALE ET COMPLÈTE

// --- CONFIGURATION ---
// Détecte automatiquement si on est en local ou en production
const IS_LOCAL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
const API_BASE = IS_LOCAL ? "http://localhost:8000/api" : "https://finanalyses.onrender.com/api";

// --- VARIABLES GLOBALES ---
let currentCompanyData = null; // Stocke les données de l'entreprise principale pour la comparaison
// --- SÉLECTION DES ÉLÉMENTS DU DOM ---
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// --- GESTION DE LA SESSION ---
// Génère un ID de session unique pour chaque utilisateur et le stocke dans le navigateur
// pour que la conversation puisse continuer même si on rafraîchit la page.
let sessionId = localStorage.getItem('finanalyse_session_id');
if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('finanalyse_session_id', sessionId);
}

// --- FONCTIONS DE L'INTERFACE ---

/**
 * Ajoute un message (de l'utilisateur ou de l'IA) à la fenêtre de chat.
 * @param {string} text Le contenu du message.
 * @param {string} sender 'user' ou 'ai'.
 */
function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('p-3', 'rounded-lg', 'max-w-md', 'break-words');
    messageDiv.textContent = text;

    if (sender === 'user') {
        messageDiv.classList.add('bg-blue-600', 'text-white', 'self-end', 'ml-auto');
    } else {
        messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'self-start', 'mr-auto');
    }
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Fait défiler automatiquement vers le bas
}

/**
 * Envoie le message de l'utilisateur à l'API backend et affiche la réponse.
 */
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return; // Ne rien faire si le message est vide

    appendMessage(message, 'user');
    chatInput.value = ''; // Vider le champ de saisie
    chatInput.disabled = true;
    sendBtn.disabled = true;
    appendMessage("...", 'ai'); // Affiche un indicateur de chargement

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId,
                message: message
            })
        });

        // Supprime l'indicateur de chargement
        chatBox.removeChild(chatBox.lastChild); 
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'La réponse du serveur n\'est pas OK.');
        }

        const data = await response.json();
        appendMessage(data.response, 'ai');

    } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        appendMessage(`Désolé, une erreur est survenue : ${error.message}`, 'ai');
    } finally {
        // Réactiver les champs de saisie
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// --- ÉCOUTEURS D'ÉVÉNEMENTS ---

// Envoyer le message en cliquant sur le bouton
sendBtn.addEventListener('click', sendMessage);

// Envoyer le message en appuyant sur la touche "Entrée"
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Affiche le message de bienvenue au chargement de la page
appendMessage("Bonjour ! Je suis FinAnalyse AI. Posez-moi une question sur la finance.", 'ai');