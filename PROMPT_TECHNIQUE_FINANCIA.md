# Prompt Technique - Projet Financia

## 🎯 Contexte et Objectif

**Financia** est une application web progressive (PWA) de gestion des finances personnelles développée avec une architecture moderne et performante. L'application permet aux utilisateurs de suivre leurs revenus, dépenses, et d'analyser leurs habitudes financières via un tableau de bord intuitif et des rapports détaillés.

---

## 🏗️ Architecture Technique

### Stack Technologique Principal

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| **Framework** | Next.js | 15.1.0 | Framework React avec App Router |
| **Frontend** | React | 19.0.0 | Bibliothèque UI |
| **Styling** | Tailwind CSS | 4.0.0 | Framework CSS utilitaire |
| **État Global** | TanStack React Query | 5.90.21 | Gestion du cache et des requêtes |
| **Base de Données** | IndexedDB (idb) | 8.0.3 | Stockage local côté client |
| **Graphiques** | Chart.js + react-chartjs-2 | 4.5.1 / 5.3.1 | Visualisation de données |
| **PWA** | @ducanh2912/next-pwa | 10.2.9 | Progressive Web App |
| **Notifications** | react-hot-toast | 2.6.0 | Système de notifications |
| **Export** | file-saver | 2.0.5 | Export de fichiers |

### Structure du Projet

```
financia/
├── app/                          # App Router (Next.js 13+)
│   ├── layout.js                 # Layout principal avec providers
│   ├── page.js                   # Page d'accueil (Dashboard)
│   ├── providers.js              # Providers React Query
│   ├── globals.css               # Styles globaux Tailwind
│   ├── components/
│   │   └── BottomNavigation.js   # Navigation par onglets
│   ├── add/
│   │   └── page.js               # Page ajout de transaction
│   ├── reports/
│   │   └── page.js               # Page rapports
│   └── settings/
│       └── page.js               # Page paramètres
├── src/                          # Composants et logique métier
│   ├── components/
│   │   ├── Dashboard.jsx         # Composant tableau de bord
│   │   ├── AddTransaction.jsx    # Formulaire ajout transaction
│   │   ├── Reports.jsx           # Rapports et graphiques
│   │   └── Settings.jsx          # Paramètres utilisateur
│   ├── services/
│   │   └── database.js           # Service IndexedDB
│   └── utils/
│       └── formatters.js         # Utilitaires de formatage
├── public/                       # Assets statiques
│   ├── manifest.json             # Manifeste PWA
│   ├── sw.js                     # Service Worker
│   └── icons/                    # Icônes PWA
└── next.config.mjs               # Configuration Next.js
```

---

## 🎨 Design System et UI

### Principes de Design

- **Mobile-First** : Interface optimisée pour mobile (max-width: 480px)
- **Glassmorphism** : Effets de transparence et blur modernes
- **Micro-interactions** : Animations fluides et feedback visuel
- **Accessibilité** : Contraste WCAG 2.1 AA respecté

### Palette de Couleurs

```css
/* Couleurs principales */
--primary-500: #0ea5e9;    /* Bleu ciel */
--primary-600: #0284c7;    /* Bleu foncé */

/* Couleurs sémantiques */
--success-500: #10b981;    /* Vert - Revenus */
--warning-500: #f59e0b;    /* Orange - Alertes */
--danger-500: #ef4444;     /* Rouge - Dépenses */

/* Neutres */
--slate-50: #f8fafc;
--slate-900: #0f172a;
```

### Composants UI Réutilisables

1. **Card** : Conteneur avec ombre et bordure arrondie
2. **BalanceCard** : Affichage de montant avec icône et couleur
3. **BottomNavigation** : Navigation fixe en bas (4 onglets)
4. **Toaster** : Notifications toast personnalisées

---

## 📊 Fonctionnalités Principales

### 1. Tableau de Bord (Dashboard)

**Fichier** : `src/components/Dashboard.jsx`

**Fonctionnalités** :
- Affichage du solde total en temps réel
- Résumé mensuel (revenus/dépenses)
- Liste des 5 dernières transactions
- Mise à jour automatique avec React Query
- Horloge en temps réel

**Composants** :
```jsx
<BalanceCard title="Solde total" amount={balance} color="primary" />
<RecentTransactions />
<QuickStats />
```

### 2. Ajout de Transaction

**Fichier** : `src/components/AddTransaction.jsx`

**Fonctionnalités** :
- Formulaire de création de transaction
- Types : Revenu / Dépense
- Catégories prédéfinies
- Validation des champs
- Sauvegarde IndexedDB
- Notification de succès

### 3. Rapports et Statistiques

**Fichier** : `src/components/Reports.jsx`

**Fonctionnalités** :
- Graphiques interactifs (Chart.js)
- Répartition par catégorie
- Évolution mensuelle
- Export des données (CSV/PDF)
- Filtres par période

### 4. Paramètres

**Fichier** : `src/components/Settings.jsx`

**Fonctionnalités** :
- Gestion des catégories
- Export/import des données
- Réinitialisation
- Informations de l'application

---

## 🔧 Services et Données

### Service de Base de Données

**Fichier** : `src/services/database.js`

**API** :
```javascript
transactionService = {
  // CRUD
  addTransaction(transaction),
  getTransactions(filters),
  updateTransaction(id, data),
  deleteTransaction(id),
  
  // Agrégations
  getBalance(),
  getMonthlySummary(month, year),
  getCategoryStats(startDate, endDate),
  
  // Utilitaires
  exportData(),
  importData(data),
  clearAllData()
}
```

**Schéma de Transaction** :
```javascript
{
  id: string,
  type: 'income' | 'expense',
  amount: number,
  category: string,
  description: string,
  date: Date,
  createdAt: Date
}
```

### Utilitaires de Formatage

**Fichier** : `src/utils/formatters.js`

```javascript
formatCurrency(amount)      // Format monétaire (FCFA)
formatDate(date)            // Format date localisé
formatPercentage(value)     // Format pourcentage
```

---

## 🚀 Configuration et Performance

### Configuration Next.js

**Fichier** : `next.config.mjs`

```javascript
{
  reactStrictMode: true,
  experimental: {
    turbo: false  // Désactivé pour compatibilité
  }
}
```

### Optimisations Performance

1. **React Query** :
   - Cache de 5 secondes (`staleTime: 5000`)
   - Refetch automatique en arrière-plan
   - Mise à jour optimiste

2. **Lazy Loading** :
   - Composants chargés à la demande
   - Images optimisées par Next.js

3. **PWA** :
   - Service Worker pour le cache
   - Manifeste pour installation
   - Mode hors ligne basique

### Tailwind CSS Configuration

**Fichier** : `tailwind.config.js`

```javascript
{
  content: ['./app/**/*.{js,jsx}', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { /* palette bleue */ },
        success: { /* palette verte */ },
        warning: { /* palette orange */ }
      },
      boxShadow: {
        'premium': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
      }
    }
  }
}
```

---

## 📱 Progressive Web App (PWA)

### Manifeste PWA

**Fichier** : `public/manifest.json`

```json
{
  "name": "Financia",
  "short_name": "Financia",
  "description": "Gestion des finances personnelles",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#0ea5e9",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512" }
  ]
}
```

### Service Worker

**Fichier** : `public/sw.js`

- Cache des assets statiques
- Stratégie Network-First pour les données
- Fallback hors ligne

---

## 🔐 Sécurité et Bonnes Pratiques

### Sécurité

1. **XSS Prevention** : React échappe automatiquement les outputs
2. **CSP** : Content Security Policy configuré
3. **Données locales** : Pas de transmission de données sensibles

### Bonnes Pratiques Code

1. **Composants Fonctionnels** : 100% hooks React
2. **TypeScript Ready** : Structure préparée pour migration
3. **ESLint** : Configuration Next.js stricte
4. **Modularité** : Séparation claire des responsabilités

---

## 🧪 Tests et Qualité

### Scripts Disponibles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # Vérification ESLint
```

### Structure de Tests Recommandée

```
__tests__/
├── components/
│   ├── Dashboard.test.jsx
│   └── AddTransaction.test.jsx
├── services/
│   └── database.test.js
└── utils/
    └── formatters.test.js
```

---

## 📈 Métriques et Monitoring

### Métriques Clés

- **FCP** (First Contentful Paint) : < 1.5s
- **LCP** (Largest Contentful Paint) : < 2.5s
- **TTI** (Time to Interactive) : < 3.5s
- **PWA Score** : 100/100

### Outils de Monitoring

- Lighthouse pour les performances
- React DevTools pour le debug
- React Query Devtools pour les requêtes

---

## 🚀 Déploiement

### Plateformes Recommandées

1. **Vercel** (Recommandé pour Next.js)
   - Déploiement automatique
   - Edge Functions
   - Analytics intégrés

2. **Netlify**
   - Support Next.js
   - Formulaires intégrés

3. **Docker**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

---

## 🔄 Évolutions Futures

### Roadmap Suggérée

1. **v1.1** : Synchronisation cloud (Firebase/Supabase)
2. **v1.2** : Multi-devises
3. **v1.3** : Budgets et objectifs
4. **v1.4** : Notifications push
5. **v2.0** : Application mobile native (React Native)

### Améliorations Techniques

- Migration TypeScript
- Tests unitaires et E2E
- CI/CD avec GitHub Actions
- Monitoring avec Sentry
- Analytics avec Plausible

---

## 📚 Ressources

### Documentation

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TanStack React Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)
- [Chart.js](https://www.chartjs.org)

### Support

- GitHub Issues pour les bugs
- Discussions pour les fonctionnalités
- Wiki pour la documentation

---

**Version** : 1.0.0  
**Dernière mise à jour** : Mars 2026  
**Licence** : MIT