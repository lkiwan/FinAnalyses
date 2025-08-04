// js/chat.js - VERSION FINALE ET ROBUSTE

document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // Si les éléments du chat n'existent pas sur cette page, ne rien faire.
    if (!chatBox || !chatInput || !sendBtn) {
        return;
    }

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
        messageDiv.classList.add('p-3', 'rounded-lg', 'max-w-md', 'break-words', 'fade-in');

        if (sender === 'user') {
            messageDiv.classList.add('bg-blue-600', 'text-white', 'self-end', 'ml-auto');
        } else {
            messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'self-start', 'mr-auto');
        }
        
        // Simule la frappe pour la réponse de l'IA
        if (sender === 'ai' && text === "...") {
            messageDiv.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span></span>';
        } else {
            messageDiv.textContent = text;
        }

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
        appendMessage("...", 'ai'); // Indicateur de frappe

        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: message
                })
            });

            // Supprime l'indicateur de frappe
            if (chatBox.lastChild) {
                chatBox.removeChild(chatBox.lastChild);
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'La réponse du serveur n\'est pas OK.');
            }

            const data = await response.json();
            appendMessage(data.response, 'ai');

        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error);
            // S'assurer que le dernier message "..." est retiré même en cas d'erreur
            if (chatBox.lastChild && chatBox.lastChild.querySelector('.typing-indicator')) {
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

    // Message de bienvenue
    appendMessage("Bonjour ! Je suis FinAnalyse AI. Posez-moi une question sur la finance ou tout autre sujet.", 'ai');
});
// js/chat.js - VERSION FINALE ET ROBUSTE

document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // Si les éléments du chat n'existent pas sur cette page, ne rien faire.
    if (!chatBox || !chatInput || !sendBtn) {
        return;
    }

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
        messageDiv.classList.add('p-3', 'rounded-lg', 'max-w-md', 'break-words', 'fade-in');

        if (sender === 'user') {
            messageDiv.classList.add('bg-blue-600', 'text-white', 'self-end', 'ml-auto');
        } else {
            messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'self-start', 'mr-auto');
        }
        
        // Simule la frappe pour la réponse de l'IA
        if (sender === 'ai' && text === "...") {
            messageDiv.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span></span>';
        } else {
            messageDiv.textContent = text;
        }

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
        appendMessage("...", 'ai'); // Indicateur de frappe

        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: message
                })
            });

            // Supprime l'indicateur de frappe
            if (chatBox.lastChild) {
                chatBox.removeChild(chatBox.lastChild);
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'La réponse du serveur n\'est pas OK.');
            }

            const data = await response.json();
            appendMessage(data.response, 'ai');

        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error);
            // S'assurer que le dernier message "..." est retiré même en cas d'erreur
            if (chatBox.lastChild && chatBox.lastChild.querySelector('.typing-indicator')) {
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

    // Message de bienvenue
    appendMessage("Bonjour ! Je suis FinAnalyse AI. Posez-moi une question sur la finance ou tout autre sujet.", 'ai');
});
