# main.py - VERSION FINALE, PROPRE ET SÉCURISÉE

import os
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import requests
from pydantic import BaseModel
import pandas as pd
from datetime import datetime, timedelta

# --- CONFIGURATION SÉCURISÉE DES CLÉS API ---
load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
FMP_API_KEY = os.getenv('FMP_API_KEY')

model = None
# Configuration du modèle Gemini (IA)
if GOOGLE_API_KEY:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("INFO: Clé API Google trouvée. Le service IA est activé.")
    except Exception as e:
        print(f"ERREUR: La configuration de l'IA a échoué. Raison : {e}")
        model = None
else:
    print("AVERTISSEMENT: La clé API Google n'est pas configurée. Le service IA est désactivé.")

# --- INITIALISATION DE L'APPLICATION FASTAPI ---
app = FastAPI()

# --- CONFIGURATION CORS ---
origins = [
    "https://finanalyses.pages.dev", # Assurez-vous que ceci est votre URL de production
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODÈLES DE DONNÉES ---
class ChatMessage(BaseModel):
    session_id: str
    message: str

chat_sessions = {} # Stockage en mémoire simple pour les sessions de chat

# --- FONCTIONS UTILITAIRES ---
def get_stock_data(ticker: str):
    """Récupère les données d'un ticker et gère l'erreur 404."""
    stock = yf.Ticker(ticker.upper())
    if stock.history(period="1d").empty:
        raise HTTPException(status_code=404, detail=f"Symbole '{ticker}' non trouvé ou sans données.")
    return stock

# --- POINTS D'ACCÈS DE L'API (ROUTES) ---

@app.get("/api/entreprise/{ticker}")
def get_financial_data(ticker: str):
    try:
        stock = get_stock_data(ticker)
        info = stock.info
        return {
            "name": info.get("longName", ticker.upper()),
            "symbol": info.get("symbol", ticker.upper()),
            "sector": info.get("sector", "N/A"),
            "country": info.get("country", "N/A"),
            "price": info.get("currentPrice") or info.get("previousClose"),
            "revenue": info.get("totalRevenue"),
            "netIncome": info.get("netIncomeToCommon"),
            "peRatio": info.get("trailingPE"),
            "roe": info.get("returnOnEquity"),
            "netMargin": info.get("profitMargins"),
            "dividendYield": info.get('dividendYield'),
        }
    except HTTPException as e:
        raise e # Fait remonter l'erreur 404
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne du serveur : {e}")

@app.get("/api/historique/{ticker}")
def get_historical_data(ticker: str):
    try:
        stock = get_stock_data(ticker)
        hist = stock.history(period="1y")
        return {
            "dates": hist.index.strftime("%Y-%m-%d").tolist(),
            "prices": hist["Close"].fillna(0).tolist(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/advanced-metrics/{ticker}")
def get_advanced_metrics(ticker: str):
    try:
        stock = get_stock_data(ticker)
        info = stock.info
        cashflow = stock.cashflow
        free_cashflow = None
        if not cashflow.empty and 'Total Cash From Operating Activities' in cashflow.index and 'Capital Expenditures' in cashflow.index:
            op_cash = cashflow.loc['Total Cash From Operating Activities'].iloc[0]
            cap_ex = cashflow.loc['Capital Expenditures'].iloc[0]
            if pd.notna(op_cash) and pd.notna(cap_ex):
                free_cashflow = op_cash + cap_ex
        return {
            "currentRatio": info.get('currentRatio'),
            "quickRatio": info.get('quickRatio'),
            "debtToEquity": info.get('debtToEquity'),
            "interestCoverage": info.get('interestCoverage'),
            "freeCashFlow": free_cashflow,
            "dividendYield": info.get('dividendYield'),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dividends/{ticker}")
def get_dividend_data(ticker: str):
    try:
        stock = get_stock_data(ticker)
        dividends = stock.dividends.last('5Y') # '5Y' pour 5 ans
        annual_dividends = {}
        if not dividends.empty:
            annual_dividends = dividends.resample('YE').sum().to_dict()
        return {
            "dividendHistory": {
                "years": [d.year for d in annual_dividends.keys()],
                "amounts": list(annual_dividends.values())
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat_with_ai(chat_message: ChatMessage):
    if not model:
        raise HTTPException(status_code=503, detail="Le service de chat IA est désactivé sur le serveur (clé API manquante).")

    session_id = chat_message.session_id
    user_message = chat_message.message

    if session_id not in chat_sessions:
        chat_sessions[session_id] = model.start_chat(history=[
            {"role": "user", "parts": ["Tu es FinAnalyse AI, un assistant conversationnel spécialisé en finance pour les débutants. Sois amical, pédagogique et explique les concepts simplement. Ne donne jamais de conseil d'investissement direct."]},
            {"role": "model", "parts": ["Bonjour ! Je suis FinAnalyse AI. Comment puis-je vous aider à mieux comprendre la finance aujourd'hui ?"]}
        ])
    try:
        response = chat_sessions[session_id].send_message(user_message)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de communication avec l'IA: {e}")