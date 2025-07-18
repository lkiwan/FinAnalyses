# main.py - VERSION FINALE, PROPRE ET SÉCURISÉE

import os
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import requests
from pydantic import BaseModel
import pandas as pd 

# --- CONFIGURATION SÉCURISÉE DES CLÉS API ---
# Charge les variables depuis le fichier .env (pour le local) ou l'environnement (pour Render)
# --- DÉBUT DU BLOC DE DÉBOGAGE ---


load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
MARKETAUX_API_KEY = os.getenv('MARKETAUX_API_KEY')

model = None


if GOOGLE_API_KEY:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("INFO: Clé API Google trouvée. Le service IA est activé.")
    except Exception as e:
        print(f"ERREUR: La configuration de l'IA a échoué. Raison : {e}")
        model = None # On s'assure que le modèle est None en cas d'erreur
else: print("AVERTISSEMENT: La clé API Google n'est pas configurée. Le service IA est désactivé.")

if MARKETAUX_API_KEY:
    print(f"Clé Marketaux trouvée ! Elle commence par : '{MARKETAUX_API_KEY[:5]}...'")
else:
    print("Clé Marketaux NON TROUVÉE.")

print("--- FIN DU DÉBOGAGE ---")
# --- FIN DU BLOC DE DÉBOGAGE ---


GOOGLE_API_KEY = GOOGLE_API_KEY
MARKETAUX_API_KEY = MARKETAUX_API_KEY

# --- INITIALISATION DE L'APPLICATION FASTAPI ---
app = FastAPI()

# --- CONFIGURATION CORS ---
origins = [
    "https://finanalyses.pages.dev",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODÈLES DE DONNÉES ET STOCKAGE POUR LE CHAT ---
class ChatMessage(BaseModel):
    session_id: str
    message: str

chat_sessions = {} # Stockage simple en mémoire

# --- FONCTIONS HELPER ---
def get_stock_data(ticker: str):
    stock = yf.Ticker(ticker.upper())
    if stock.history(period="1d").empty:
        raise HTTPException(status_code=404, detail=f"Symbole '{ticker}' non trouvé ou sans données.")
    return stock

def generate_ai_analysis_comment(data: dict) -> str:
    if not model:
        return "Le service d'analyse par IA est désactivé car la clé API n'est pas configurée."
    try:
        prompt = f"""
        En tant qu'analyste financier pour des débutants, rédige une courte analyse (3-4 phrases) pour l'entreprise {data.get('name', 'N/A')}.
        Le ton doit être neutre et informatif. Utilise un langage simple.
        Voici les données clés :
        - Prix : ${data.get('price', 0):.2f}
        - Chiffre d'affaires : {data.get('revenue', 0) / 1e9:.1f} milliards $
        - Bénéfice net : {data.get('netIncome', 0) / 1e9:.1f} milliards $
        - PER : {data.get('peRatio', 0):.1f}
        - ROE : {data.get('roe', 0) * 100:.1f}%
        - Marge nette : {data.get('netMargin', 0) * 100:.1f}%
        Basé sur ces données, mentionne un point fort et un point de vigilance. Conclus par une phrase neutre. Ne donne pas de conseil d'investissement.
        """
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Erreur lors de la génération par l'IA: {e}")
        return "Le commentaire d'analyse par l'IA n'est pas disponible pour le moment."

# --- POINTS D'ACCÈS DE L'API (ROUTES) ---

@app.get("/api/news")
def get_real_time_news():
    if not MARKETAUX_API_KEY:
        raise HTTPException(status_code=500, detail="La clé API pour les actualités n'est pas configurée.")
    
    url = f"https://api.marketaux.com/v1/news/all?countries=us,fr&filter_entities=true&limit=15&language=en&api_token={MARKETAUX_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return {"articles": data.get("data", [])}
    except requests.exceptions.RequestException as e:
        print(f"Erreur API Marketaux: {e}")
        raise HTTPException(status_code=503, detail="Le service d'actualités est temporairement indisponible.")

@app.get("/api/entreprise/{ticker}")
def get_financial_data(ticker: str):
    try:
        stock = get_stock_data(ticker)
        info = stock.info
        
        financial_data = {
            "name": info.get("longName", ticker.upper()),
            "symbol": info.get("symbol", ticker.upper()),
            "logo_url": info.get("logo_url", ""),
            "sector": info.get("sector", "N/A"),
            "country": info.get("country", "N/A"),
            "price": info.get("currentPrice") or info.get("previousClose") or 0,
            "revenue": info.get("totalRevenue") or 0,
            "netIncome": info.get("netIncomeToCommon") or 0,
            "peRatio": info.get("trailingPE") or 0,
            "roe": info.get("returnOnEquity") or 0,
            "netMargin": info.get("profitMargins") or 0,
            "dividendYield": info.get('dividendYield') or 0,
            "financialScore": 8.2 # Placeholder
        }

        # On appelle l'IA AVANT de retourner le résultat
        financial_data["analysisComment"] = generate_ai_analysis_comment(financial_data)
        
        return financial_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat_with_ai(chat_message: ChatMessage):
    session_id = chat_message.session_id
    user_message = chat_message.message

    if not model:
        raise HTTPException(status_code=503, detail="Le service de chat IA est désactivé.")

    # NOUVELLE VERSION (Généraliste)
    if session_id not in chat_sessions:
        print(f"Création d'une nouvelle session de chat pour : {session_id}")
    # --- MODIFICATION ICI ---
    # On donne de nouvelles instructions à l'IA pour qu'elle soit généraliste.
    chat_sessions[session_id] = model.start_chat(history=[
        {
            "role": "user",
            "parts": [
                "Tu es FinAnalyse AI, un assistant conversationnel généraliste, amical et serviable. "
                "Ton objectif est d'aider les utilisateurs en répondant à leurs questions sur une grande variété de sujets, "
                "allant de la science à l'histoire, en passant par la cuisine ou la programmation. "
                "Sois toujours poli, éthique et assure-toi que tes réponses sont sûres et appropriées. "
                "Ne donne jamais d'informations dangereuses ou illégales."
            ]
        },
        {
            "role": "model",
            "parts": ["Bonjour ! Je suis FinAnalyse AI, votre assistant personnel. Comment puis-je vous aider aujourd'hui ?"]
        }
    ])

    current_chat_session = chat_sessions[session_id]

    try:
        response = current_chat_session.send_message(user_message)
        return {"response": response.text}
    except Exception as e:
        print(f"Erreur lors de la conversation avec l'IA: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la communication avec l'assistant IA.")

# (Les autres routes comme /historique, /screener, etc. peuvent être ajoutées ici si nécessaire)

# --- NOUVELLE FONCTION D'ANALYSE PAR IA ---
def generate_ai_analysis_comment(data: dict) -> str:
    """
    Utilise l'IA Gemini pour générer un commentaire d'analyse financière.
    """
    try:
        # On prépare un "prompt" clair et détaillé pour l'IA
        prompt = f"""
        En tant qu'analyste financier pour des investisseurs débutants, rédige une courte analyse (3-4 phrases) pour l'entreprise {data.get('name', 'N/A')}.
        Le ton doit être neutre et informatif. Utilise un langage simple.
        Voici les données financières clés :
        - Prix de l'action : ${data.get('price', 'N/A'):.2f}
        - Chiffre d'affaires annuel : {data.get('revenue', 0) / 1e9:.1f} milliards de dollars
        - Bénéfice net annuel : {data.get('netIncome', 0) / 1e9:.1f} milliards de dollars
        - Ratio Cours/Bénéfice (PER) : {data.get('peRatio', 'N/A'):.1f}
        - Rentabilité des capitaux propres (ROE) : {data.get('roe', 0) * 100:.1f}%
        - Marge nette : {data.get('netMargin', 0) * 100:.1f}%

        Basé sur ces données, mentionne un point fort (par exemple, une forte rentabilité ou une faible valorisation) et un point de vigilance (par exemple, une valorisation élevée ou une faible marge). Termine par une phrase de conclusion neutre.
        Ne donne pas de conseil d'investissement.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Erreur lors de la génération par l'IA: {e}")
        return "Le commentaire d'analyse par l'IA n'est pas disponible pour le moment."






# --- DONNÉES SIMULÉES POUR LES ACTUALITÉS ---
MOCK_NEWS = {
    "moneywise": [
        {"title": "Inflation Reduction Act: Are You Missing Out on These Major Savings?", "snippet": "The landmark legislation could save you thousands. Are you taking advantage?", "url": "#", "source": "Moneywise"},
        {"title": "Suze Orman Warns of a Major Financial 'Earthquake' — Here's How to Prepare", "snippet": "The personal finance guru is sounding the alarm. Here are three ways to protect yourself.", "url": "#", "source": "Moneywise"},
    ],
    "gobankingrates": [
        {"title": "5 High-Paying Jobs That Don’t Require a Bachelor’s Degree", "snippet": "You don't need a four-year degree to land a lucrative career. Check out these options.", "url": "#", "source": "GOBankingRates"},
        {"title": "How To Build Generational Wealth With Just a Few Hundred Dollars", "snippet": "Think you need a fortune to start? Think again. Small, consistent investments can lead to big results.", "url": "#", "source": "GOBankingRates"},
    ],
    "morningstar": [
        {"title": "3 Undervalued Stocks to Buy Now", "snippet": "Our analysts have identified three companies trading below their intrinsic value.", "url": "#", "source": "Morningstar Research"},
        {"title": "Market Outlook 2025: Navigating a Shifting Landscape", "snippet": "Experts weigh in on what to expect from the markets in the coming year.", "url": "#", "source": "Morningstar Research"},
    ],
    "barchart": [
        {"title": "Corn Prices Surge on Weather Concerns", "snippet": "Futures for corn are up as unfavorable weather patterns threaten crop yields.", "url": "#", "source": "Barchart"},
        {"title": "Analyst Upgrade: Is This Tech Giant a 'Strong Buy'?", "snippet": "Barchart's technical analysis points to a strong upward trend for this well-known stock.", "url": "#", "source": "Barchart"},
    ]
}
def get_stock_data(ticker: str):
    """Fonction utilitaire pour récupérer l'objet Ticker et gérer les erreurs de base."""
    stock = yf.Ticker(ticker.upper())
    # Si l'historique est vide, le ticker est probablement invalide
    if stock.history(period="1d").empty:
        raise HTTPException(status_code=404, detail=f"Symbole '{ticker}' non trouvé ou sans données.")
    return stock

@app.get("/api/entreprise/{ticker}")
def get_financial_data(ticker: str):
    try:
        stock = get_stock_data(ticker)
        info = stock.info
        financials = stock.financials
        
        latest_revenue = None
        latest_net_income = None

        if not financials.empty:
            if 'Total Revenue' in financials.index:
                latest_revenue = financials.loc['Total Revenue'].iloc[0]
            if 'Net Income' in financials.index:
                latest_net_income = financials.loc['Net Income'].iloc[0]
        
        return {
            "name": info.get("longName", ticker.upper()),
            "symbol": info.get("symbol", ticker.upper()),
            "logo_url": info.get("logo_url", ""),
            "sector": info.get("sector", "N/A"),
            "country": info.get("country", "N/A"),
            "price": info.get("currentPrice") or info.get("previousClose"),
            "revenue": info.get("totalRevenue"),
            "netIncome": info.get("netIncomeToCommon"),
            "peRatio": info.get("trailingPE"),
            "roe": info.get("returnOnEquity"),
            "netMargin": info.get("profitMargins"),
            "dividendYield": info.get('dividendYield'),
            "financialScore": 7.5
        }
# ON APPELLE LA NOUVELLE FONCTION IA !
        financial_data["analysisComment"] = generate_ai_analysis_comment(financial_data)
        
        return financial_data
        
          
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne dans get_financial_data: {str(e)}")

@app.get("/api/historique/{ticker}")
def get_historical_data(ticker: str):
    try:
        stock = get_stock_data(ticker)
        hist = stock.history(period="1y")
        # Remplacer les valeurs NaN (Not a Number) par 0 pour éviter les erreurs dans les graphiques
        return {
            "dates": hist.index.strftime("%Y-%m-%d").tolist(),
            "prices": hist["Close"].fillna(0).tolist(),
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne dans get_historical_data: {str(e)}")

@app.get("/api/advanced-metrics/{ticker}")
def get_advanced_metrics(ticker: str):
    try:
        stock = get_stock_data(ticker)
        info = stock.info
        cashflow = stock.cashflow
        
        free_cashflow = None
        if not cashflow.empty:
            op_cash_names = ['Total Cash From Operating Activities', 'Cash From Operations']
            op_cash_series = next((cashflow.loc[name] for name in op_cash_names if name in cashflow.index), None)
            cap_ex_series = cashflow.loc['Capital Expenditures'] if 'Capital Expenditures' in cashflow.index else None
            
            if op_cash_series is not None and cap_ex_series is not None:
                op_cash = op_cash_series.iloc[0]
                cap_ex = cap_ex_series.iloc[0]
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
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne dans get_advanced_metrics: {str(e)}")

@app.get("/api/dividends/{ticker}")
def get_dividend_data(ticker: str):
    try:
        stock = get_stock_data(ticker)
        info = stock.info
        dividends = stock.dividends
        
        annual_dividends = {}
        if not dividends.empty:
            dividends_last_5y = dividends.last('5Y')
            if not dividends_last_5y.empty:
                 annual_dividends = dividends_last_5y.resample('YE').sum().to_dict()
        
        return {
            "dividendRate": info.get("dividendRate"),
            "payoutRatio": info.get("payoutRatio"),
            "dividendHistory": {
                "years": [d.year for d in annual_dividends.keys()],
                "amounts": list(annual_dividends.values())
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne dans get_dividend_data: {str(e)}")

@app.get("/api/screener")
def stock_screener(sector: str = None, pe_max: float = None, dividend_min: float = None):
    sample_tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "JPM", "JNJ", "WMT", "PG", "XOM", "NVDA", "V", "UNH", "HD"]
    results = []
    
    dividend_min_float = dividend_min / 100 if dividend_min is not None else None

    for ticker in sample_tickers:
        try:
            info = yf.Ticker(ticker).info
            
            # Vérification rapide pour éviter les tickers morts
            if not info.get('longName'):
                continue
            
            include = True
            if sector and info.get('sector') != sector:
                include = False
            if pe_max is not None and info.get('trailingPE', float('inf')) > pe_max:
                include = False
            if dividend_min_float is not None and info.get('dividendYield', 0) < dividend_min_float:
                include = False
            
            if include:
                results.append({
                    "symbol": info.get('symbol'), "name": info.get('longName'),
                    "pe": info.get('trailingPE'), "dividendYield": info.get('dividendYield'),
                })
        except Exception:
            continue

    return {"results": results}

@app.get("/api/news")
def get_news(source: str):
    """Nouveau point d'accès pour les actualités."""
    if source not in MOCK_NEWS:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"articles": MOCK_NEWS[source]}