// js/chat.js - VERSION FINALE ET ROBUSTE

document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    if (!chatBox || !chatInput || !sendBtn) return;

    // --- CONFIGURATION ---
    const IS_LOCAL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
    const API_BASE = IS_LOCAL ? "http://localhost:8000/api" : "https://finanalyses.onrender.com/api";

    // --- GESTION DE LA SESSION ---
    let sessionId = localStorage.getItem('finanalyse_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('finanalyse_session_id', sessionId);
    }

    // --- FONCTIONS DE L'INTERFACE ---
    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('p-3', 'rounded-lg', 'max-w-md', 'break-words');

        if (sender === 'user') {
            messageDiv.classList.add('bg-blue-600', 'text-white', 'self-end', 'ml-auto');
        } else {
            messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'self-start', 'mr-auto');
        }
        messageDiv.textContent = text;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        appendMessage(message, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        sendBtn.disabled = true;
        
        appendMessage("...", 'ai'); // Indicateur de frappe simple

        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: message
                })
            });

            chatBox.removeChild(chatBox.lastChild); // Supprime "..."
            
            if (!response.ok) {
                const errorData = await response.json();
                // Gère spécifiquement le cas où l'IA est désactivée
                if (response.status === 503) {
                     throw new Error("Le service de Chat AI est actuellement désactivé sur le serveur.");
                }
                throw new Error(errorData.detail || 'Erreur inconnue du serveur.');
            }

            const data = await response.json();
            appendMessage(data.response, 'ai');

        } catch (error) {
             if (chatBox.lastChild && chatBox.lastChild.textContent === "...") {
                chatBox.removeChild(chatBox.lastChild);
            }
            appendMessage(`Désolé, une erreur est survenue : ${error.message}`, 'ai');
        } finally {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    // --- ÉCOUTEURS D'ÉVÉNEMENTS ---
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Message de bienvenue initial
    appendMessage("Bonjour ! Je suis FinAnalyse AI. Posez-moi une question sur la finance.", 'ai');
});