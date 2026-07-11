# Cahier des charges — TalentFlow AI (MVP)

## 1. Contexte et objectif

TalentFlow AI est une plateforme de recrutement qui met en relation candidats et
entreprises, avec des fonctionnalités d'IA pour accélérer l'analyse de CV et la
mise en relation.

Objectif du MVP : livrer une version **web** fonctionnelle de bout en bout
(inscription → candidature → suivi) avec une première brique IA utile, plutôt
que de couvrir tout le périmètre imaginé. Le mobile, le chat temps réel avancé
et les fonctionnalités IA secondaires sont repoussés en roadmap (voir
`05-roadmap.md`).

## 2. Périmètre du MVP

### Inclus

- Authentification (email/mot de passe + JWT + refresh token). OAuth Google/GitHub
  en V1.1 si le temps le permet.
- Deux rôles : **Candidat** et **Entreprise**. Le rôle **Administrateur** est
  limité à un accès technique minimal (pas d'interface dédiée en V1).
- Candidat : profil, upload de CV, recherche d'offres, candidature, suivi de
  candidatures.
- Entreprise : profil entreprise, publication d'offres, gestion des
  candidatures reçues (pipeline simple : reçue → en revue → entretien →
  refusée/acceptée).
- IA (une seule feature en V1, complète et bien faite) :
  **analyse de CV** → extraction compétences/expériences + score de
  correspondance par rapport à une offre + suggestions de compétences
  manquantes.
- Notifications basiques (in-app, liste, pas de temps réel WebSocket en V1).
- Recherche d'offres via PostgreSQL Full-Text Search.

### Explicitement hors périmètre du MVP

- Application mobile React Native
- Génération de lettre de motivation par IA
- Chat RH temps réel (Socket.IO)
- Dashboard administrateur avec statistiques avancées
- Elasticsearch
- Tableau de bord entreprise avec graphiques avancés (un dashboard simple
  suffit en V1)

## 3. Contraintes techniques

- Monorepo (`apps/web`, `apps/api`, `packages/*`)
- Frontend : Next.js 15, React 19, TypeScript, Tailwind, Shadcn/UI, React Hook
  Form, Zod, TanStack Query
- Backend : NestJS, Prisma, PostgreSQL
- Stockage fichiers (CV) : Supabase Storage
- IA : API OpenAI (ou équivalent) pour l'analyse de CV
- Conteneurisation : Docker + Docker Compose pour le dev local
- CI : GitHub Actions (lint + test + build sur chaque PR)
- Déploiement : Vercel (web) + Railway ou Render (api + Postgres)

## 4. Critères de succès du MVP

- Un candidat peut s'inscrire, créer un profil, uploader un CV, obtenir un
  score IA sur une offre, et postuler.
- Une entreprise peut s'inscrire, publier une offre, et voir/traiter les
  candidatures reçues.
- Le projet est déployé publiquement (URL accessible) avec CI verte.
- Code documenté (README clair, ce dossier `docs/`), historique Git propre par
  petits commits/PRs logiques.

## 5. Hors-sujet volontaire

Ce document ne couvre pas le design (voir maquettes Figma à venir) ni le détail
technique d'implémentation (voir `04-architecture-fonctionnelle.md`).
