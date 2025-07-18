# test_chat.py

import os
import google.generativeai as genai
from dotenv import load_dotenv

# Charger et configurer la clé API (comme avant)
load_dotenv()
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

# --- DÉBUT DU CHANGEMENT ---

# 1. On commence une session de chat. C'est notre "mémoire".
chat_session = model.start_chat(
    # (Optionnel) Vous pouvez donner une instruction de départ à l'IA.
    history=[
        {
            "role": "user",
            "parts": ["Tu es FinAnalyse AI, un assistant financier expert. Tu réponds aux questions sur la finance et l'investissement de manière simple et éducative. Ne donne jamais de conseil d'investissement direct."]
        },
        {
            "role": "model",
            "parts": ["Bonjour ! Je suis FinAnalyse AI. Comment puis-je vous aider à mieux comprendre la finance aujourd'hui ?"]
        }
    ]
)

print("🤖 FinAnalyse AI: Bonjour ! Posez-moi une question sur la finance (tapez 'quitter' pour arrêter).")

# 2. On crée une boucle pour chatter en continu
while True:
    # On attend la question de l'utilisateur
    user_input = input("👤 Vous: ")

    if user_input.lower() == 'quitter':
        print("🤖 FinAnalyse AI: Au revoir !")
        break

    # 3. On envoie le message à la session de chat (pas directement au modèle)
    response = chat_session.send_message(user_input)

    # On affiche la réponse de l'IA
    print(f"🤖 FinAnalyse AI: {response.text}")