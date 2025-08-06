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

# (Les autres routes comme /historique, /screener, etc. peuvent être ajoutées ici si nécessaire)
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
# Charge les variables depuis le fichier .env (pour le local) ou l'environnement (pour Render)
load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
MARKETAUX_API_KEY = os.getenv('MARKETAUX_API_KEY')
FMP_API_KEY = os.getenv('FMP_API_KEY')

model = None

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
    "https://finanalyses.pages.dev",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5500", # Ajout pour le développement local avec Live Server
    "http://127.0.0.1:5500",
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

chat_sessions = {}

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
        }
        
        return financial_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
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
        dividends = stock.dividends.last('5YE')
        annual_dividends = {}
        if not dividends.empty:
            annual_dividends = dividends.resample('YE').sum().to_dict()
        
        return {
            "dividendRate": stock.info.get("dividendRate"),
            "payoutRatio": stock.info.get("payoutRatio"),
            "dividendHistory": {
                "years": [d.year for d in annual_dividends.keys()],
                "amounts": list(annual_dividends.values())
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/screener")
def stock_screener(sector: str = None, pe_max: float = None, dividend_min: float = None):
    # Vérifie si la clé API FMP est disponible
    if not FMP_API_KEY:
        raise HTTPException(status_code=503, detail="La clé API pour le screener n'est pas configurée sur le serveur.")

    # Construit l'URL de l'API FMP avec les paramètres
    base_url = "https://financialmodelingprep.com/api/v3/stock-screener"
    params = {
        "apikey": FMP_API_KEY,
        "limit": 100  # On peut récupérer jusqu'à 100 résultats
    }

    if sector:
        params["sector"] = sector
    if pe_max is not None:
        params["priceEarningRatio"] = pe_max  # FMP utilise "priceEarningRatio" pour le P/E Ratio
    if dividend_min is not None:
        # FMP attend le % de dividende, donc on n'a pas besoin de le diviser par 100
        params["dividendYield"] = dividend_min

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()  # Lève une exception si la requête échoue (ex: 4xx, 5xx)
        
        # Formate les résultats pour correspondre à ce que le frontend attend
        data = response.json()
        results = []
        for item in data:
            results.append({
                "symbol": item.get("symbol"),
                "name": item.get("companyName"),
                "pe": item.get("priceEarningRatio"),
                "dividendYield": item.get("dividendYield")
            })

        return {"results": results}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Erreur de communication avec le service de screener: {e}")

@app.get("/api/search")
def search_symbols(query: str):
    if not FMP_API_KEY: raise HTTPException(status_code=500, detail="Clé API FMP non configurée.")
    url = f"https://financialmodelingprep.com/api/v3/search?query={query}&limit=10&apikey={FMP_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Service de recherche indisponible: {e}")

@app.get("/api/companies-by-country/{country_code}")
def get_companies_by_country(country_code: str):
    if not FMP_API_KEY: raise HTTPException(status_code=500, detail="Clé API FMP non configurée.")
    url = f"https://financialmodelingprep.com/api/v3/stock-screener?country={country_code.upper()}&limit=20&apikey={FMP_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Service de recherche par pays indisponible: {e}")

@app.get("/api/gainers")
def get_top_gainers():
    if not FMP_API_KEY: raise HTTPException(status_code=500, detail="Clé API FMP non configurée.")
    url = f"https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey={FMP_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Service 'top gainers' indisponible: {e}")

@app.get("/api/losers")
def get_top_losers():
    if not FMP_API_KEY: raise HTTPException(status_code=500, detail="Clé API FMP non configurée.")
    url = f"https://financialmodelingprep.com/api/v3/stock_market/losers?apikey={FMP_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Service 'top losers' indisponible: {e}")

# --- NOUVEAU : POINT D'ACCÈS POUR LE CALENDRIER ÉCONOMIQUE ---
@app.get("/api/economic-calendar")
def get_economic_calendar():
    if not FMP_API_KEY:
        raise HTTPException(status_code=500, detail="La clé API pour le calendrier n'est pas configurée.")
    
    # On récupère les événements pour la semaine à venir
    today = datetime.now().strftime('%Y-%m-%d')
    next_week = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
    url = f"https://financialmodelingprep.com/api/v3/economic_calendar?from={today}&to={next_week}&apikey={FMP_API_KEY}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Erreur API FMP (calendrier): {e}")
        raise HTTPException(status_code=503, detail="Le service de calendrier économique est indisponible.")

# --- NOUVEAU : POINT D'ACCÈS POUR L'ANALYSE DE CORRÉLATION ---
@app.get("/api/correlation")
def get_correlation(tickers: str = Query(..., min_length=3)):
    ticker_list = [ticker.strip().upper() for ticker in tickers.split(',')]
    if len(ticker_list) < 2:
        raise HTTPException(status_code=400, detail="Veuillez fournir au moins deux symboles.")

    try:
        # Télécharger les données historiques sur 1 an pour tous les tickers
        data = yf.download(ticker_list, period="1y")['Close']
        if data.empty or data.isnull().all().all():
            raise HTTPException(status_code=404, detail="Impossible de récupérer les données pour les symboles fournis.")

        # Supprimer les colonnes où toutes les valeurs sont NaN (tickers invalides)
        data.dropna(axis=1, how='all', inplace=True)
        if len(data.columns) < 2:
            raise HTTPException(status_code=400, detail="Données valides trouvées pour moins de deux symboles.")
        
        # Remplir les valeurs manquantes restantes
        data.ffill(inplace=True)
        data.bfill(inplace=True)

        # Calculer la matrice de corrélation
        correlation_matrix = data.corr()

        # Normaliser les prix pour la visualisation
        normalized_prices = (data / data.iloc[0] * 100)
        
        return {
            "correlation_matrix": correlation_matrix.to_dict(),
            "normalized_prices": {
                "dates": normalized_prices.index.strftime('%Y-%m-%d').tolist(),
                "series": {col: normalized_prices[col].tolist() for col in normalized_prices.columns}
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul de la corrélation : {str(e)}")


@app.post("/api/chat")
def chat_with_ai(chat_message: ChatMessage):
    session_id = chat_message.session_id
    user_message = chat_message.message

    if not model:
        raise HTTPException(status_code=503, detail="Le service de chat IA est désactivé.")

    if session_id not in chat_sessions:
        chat_sessions[session_id] = model.start_chat(history=[
            {"role": "user", "parts": ["Tu es FinAnalyse AI, un assistant conversationnel spécialisé en finance pour les débutants. Sois amical, pédagogique et explique les concepts simplement. Ne donne jamais de conseil d'investissement direct, mais aide les utilisateurs à comprendre les données."]},
            {"role": "model", "parts": ["Bonjour ! Je suis FinAnalyse AI. Comment puis-je vous aider à mieux comprendre la finance aujourd'hui ?"]}
        ])

    try:
        response = chat_sessions[session_id].send_message(user_message)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de communication avec l'IA: {e}")
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

