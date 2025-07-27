Voici une version **réécrite, plus claire et fluide** de ta présentation, tout en gardant l’aspect technique et professionnel :

---

# 📈 FinAnalyse — Analyse Financière Intelligente

**FinAnalyse** est une application web full-stack qui fournit des **analyses financières automatisées**, des **actualités de marché en temps réel** et un **assistant IA conversationnel**.
Elle repose sur un backend rapide en **FastAPI (Python)** et un frontend léger en **JavaScript pur**, stylisé avec **Tailwind CSS** et construit via **Gulp**.

---

##  Aperçu de l'application

![Aperçu FinAnalyse]((https://finanalyses.pages.dev/))

---

## ✨ Fonctionnalités Clés

* **🔍 Analyse Financière Assistée par IA**
  Obtenez des métriques financières essentielles et un résumé intelligent des performances d'une entreprise, généré par **Google Gemini**.

* **⚡ Moteur de Recherche Intelligent**
  Tapez "Apple" pour obtenir des suggestions comme "AAPL", grâce à une recherche prédictive.

* **📈 Top du Jour**
  Affichez instantanément les actions les plus performantes et les plus faibles du jour.

* **🌍 Explorateur Par Pays**
  Parcourez les entreprises cotées selon leur pays d’origine.

* **🗞️ Actualités en Temps Réel**
  Restez informé grâce à l'intégration de l'API **Marketaux**.

* **🤖 Chat IA Polyvalent**
  Un chatbot propulsé par **Gemini AI** capable de répondre à une large gamme de questions financières ou générales.

* **⚙️ Interface Moderne et Réactive**
  Design épuré, réactivité maximale grâce à **Tailwind CSS** et un processus de build optimisé avec **Gulp.js**.

---

## 🛠️ Architecture & Technologies

### Backend (FastAPI)

* **Langage** : Python 3
* **Framework** : FastAPI
* **Librairies** : `yfinance`, `pandas`, `requests`
* **Intelligence Artificielle** : Google Gemini
* **APIs Externes** : Financial Modeling Prep (FMP), Marketaux
* **Déploiement** : Render

### Frontend (JavaScript)

* **Langages** : HTML5, CSS3, JavaScript (ES6+)
* **Framework CSS** : Tailwind CSS
* **Build Tool** : Gulp.js
* **Déploiement** : Cloudflare Pages

---

## 🚀 Lancer le Projet en Local

### 1. Prérequis

* Python 3.9+
* Node.js & npm
* Clés API : Google AI Studio, Marketaux, Financial Modeling Prep

---

### 2. Cloner le Dépôt & Installer les Dépendances

```bash
# Cloner le dépôt
git clone https://github.com/lkiwan/FinAnalyses.git
cd FinAnalyses

# Installer les dépendances Python
py -m pip install -r requirements.txt

# Installer les dépendances JavaScript
npm install
```

---

### 3. Configuration des Clés API

Créer un fichier `.env` à la racine du projet :

```env
GOOGLE_API_KEY=votre_clé_google_ici
MARKETAUX_API_KEY=votre_clé_marketaux_ici
FMP_API_KEY=votre_clé_fmp_ici
```

> ✅ Ce fichier est ignoré par Git pour protéger vos données sensibles.

---

### 4. Démarrage des Services

#### Terminal 1 : Backend (FastAPI)

```bash
uvicorn main:app --reload
# Accessible sur http://localhost:8000
```

#### Terminal 2 : Build Frontend avec Gulp

```bash
npx gulp
# Génère automatiquement les fichiers dans /dist et surveille les changements
```

#### Terminal 3 : Serveur Web pour le Frontend

```bash
cd dist
python -m http.server 8080
# Site accessible sur http://localhost:8080
```

---

## 🌐 Déploiement

### 🔹 Frontend : Cloudflare Pages

* **Déploiement Continu** sur chaque `push` vers `main`
* **Build command** : `npm run build`
* **Dossier publié** : `dist`

### 🔹 Backend : Render

* **Déploiement Continu** depuis `main`
* **Build command** : `pip install -r requirements.txt`
* **Start command** : `uvicorn main:app --host 0.0.0.0 --port 10000`

