# main.py - VERSION COMPLÈTE ET CORRIGÉE

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import requests

app = FastAPI()
MARKETAUX_API_KEY = "baEVwwUiQCp6G1zeJNVG93KqcFWrgz5tp0qrqQ2I" 
@app.get("/api/news")
def get_real_time_news():
    # (le code de la fonction qui appelle Marketaux)
    # ...
    url = f"https://api.marketaux.com/v1/news/all?countries=us,fr&filter_entities=true&limit=15&language=en&api_token={MARKETAUX_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status() 
        data = response.json()
        # On adapte la structure de la réponse pour le frontend
        return {"articles": data.get("data", [])}
    except requests.exceptions.RequestException as e:
        print(f"Erreur API Marketaux: {e}")
        raise HTTPException(status_code=503, detail="Le service d'actualités est temporairement indisponible.")
# Liste des origines autorisées à faire des requêtes vers notre API.
# C'est ici que nous donnons la permission à notre serveur de fichiers HTML.
origins = [
    "https://finanalyses.pages.dev",  # L'adresse de votre site en ligne
    "http://localhost:8080",      # Utile pour le développement local
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # On utilise notre nouvelle liste
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
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
            "sector": info.get("sector", "N/A"),
            "country": info.get("country", "N/A"),
            "price": info.get("currentPrice") or info.get("previousClose"),
            "revenue": latest_revenue or info.get("totalRevenue"),
            "netIncome": latest_net_income or info.get("netIncomeToCommon"),
            "peRatio": info.get("trailingPE"),
            "roe": info.get("returnOnEquity"),
            "debtToEquity": info.get("debtToEquity"), # Note: debtToEquity peut être None
            "netMargin": info.get("profitMargins")
        }
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