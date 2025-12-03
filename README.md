# Trokacha Website

Site web officiel de Trokacha - La première plateforme algérienne tout-en-un pour le Troc, la Vente, le Transport, les Colis et le Covoiturage.

## Stack Technique

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Développement Local

1. Installer les dépendances:
```bash
npm install
```

2. Lancer le serveur de développement:
```bash
npm run dev
```

3. Ouvrir [http://localhost:3000](http://localhost:3000)

## Build Production

```bash
npm run build
npm start
```

## Déploiement

Le site est prêt à être déployé sur Vercel:

```bash
vercel
```

## Structure du Projet

```
trokacha-website/
├── app/                  # Pages et layouts Next.js
│   ├── layout.tsx       # Layout principal
│   ├── page.tsx         # Page d'accueil
│   └── globals.css      # Styles globaux
├── components/          # Composants réutilisables
│   └── ui/             # Composants UI
├── lib/                # Utilitaires
├── public/             # Assets statiques
└── ...config files     # Configuration
```

## Fonctionnalités

- ✨ Design moderne et élégant
- 📱 Responsive (mobile-first)
- 🎨 Animations fluides
- ⚡ Performance optimisée
- 🎯 SEO friendly
- 🌐 Prêt pour i18n

## À Faire

- [ ] Ajouter les liens vers les stores (Google Play / App Store)
- [ ] Intégrer les screenshots de l'app
- [ ] Ajouter plus de sections (témoignages, FAQ, etc.)
- [ ] Configurer l'analytics
- [ ] Ajouter un formulaire de contact
