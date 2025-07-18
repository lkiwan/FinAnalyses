// src/js/chat.js

// On utilise l'API de production ou locale
const API_BASE = window.location.hostname.includes('localhost')
    ? "http://localhost:8000/api"
    : "https://finanalyses.onrender.com/api";

const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// Génère un ID de session unique pour cet utilisateur et le stocke
let sessionId = localStorage.getItem('finanalyse_session_id');
if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('finanalyse_session_id', sessionId);
}

// Fonction pour ajouter un message à l'interface
function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('p-3', 'rounded-lg', 'max-w-md');
    messageDiv.textContent = text;

    if (sender === 'user') {
        messageDiv.classList.add('bg-blue-500', 'text-white', 'self-end', 'ml-auto');
    } else {
        messageDiv.classList.add('bg-gray-200', 'text-gray-800', 'self-start', 'mr-auto');
    }
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Fait défiler vers le bas
}

// Fonction pour envoyer un message à l'API
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage(message, 'user');
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, message: message })
        });

        if (!response.ok) throw new Error('La réponse du serveur n\'est pas OK.');

        const data = await response.json();
        appendMessage(data.response, 'ai');

    } catch (error) {
        console.error("Erreur:", error);
        appendMessage("Désolé, une erreur est survenue.", 'ai');
    } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Affiche le message de bienvenue de l'IA
appendMessage("Bonjour ! Je suis FinAnalyse AI. Comment puis-je vous aider ?", 'ai');