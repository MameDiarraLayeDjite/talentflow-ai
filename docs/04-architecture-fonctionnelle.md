# Architecture fonctionnelle — TalentFlow AI (MVP)

## 1. Vue d'ensemble

```
                     ┌─────────────────┐
                     │   apps/web       │  Next.js 15 (App Router)
                     │  (Vercel)        │  React 19, Tailwind, Shadcn/UI
                     └────────┬─────────┘
                              │ REST (TanStack Query)
                              ▼
                     ┌─────────────────┐
                     │   apps/api       │  NestJS
                     │  (Railway/Render)│  Prisma ORM
                     └───┬─────────┬───┘
                         │         │
                 ┌───────▼──┐   ┌──▼───────────┐
                 │ PostgreSQL│   │ OpenAI API    │
                 │ (Railway) │   │ (analyse CV)  │
                 └───────────┘   └──────────────┘
                         │
                 ┌───────▼──────────┐
                 │ Supabase Storage  │  (fichiers CV)
                 └────────────────────┘
```

## 2. Modules backend (NestJS)

- `auth` : inscription, connexion, JWT, refresh token, guards par rôle
  (candidat / entreprise)
- `users` : profil candidat
- `companies` : profil entreprise
- `jobs` : offres d'emploi, recherche full-text
- `applications` : candidatures, statuts, pipeline
- `resumes` : upload CV, appel au service IA d'analyse
- `ai` : intégration OpenAI, extraction de compétences, scoring de
  correspondance CV/offre
- `notifications` : création et listing de notifications in-app

## 3. Modèle de données (entités principales)

- `User` (id, email, passwordHash, role, refreshTokenHash, createdAt)
- `CandidateProfile` (userId, fullName, title, bio, skills[], links)
- `CompanyProfile` (userId, name, logoUrl, description, sector)
- `Resume` (id, candidateProfileId, fileUrl, parsedSkills[], parsedAt)
- `Job` (id, companyProfileId, title, description, requiredSkills[],
  contractType, location, status, createdAt)
- `Application` (id, jobId, candidateProfileId, resumeId, status,
  matchScore, createdAt, updatedAt)
- `Notification` (id, userId, type, payload, read, createdAt)

Relations clés : un `CandidateProfile` a plusieurs `Resume` et
`Application`. Un `Job` a plusieurs `Application`. Le `matchScore` est
calculé par le module `ai` au moment de la candidature (ou à la demande côté
candidat, avant de postuler).

## 4. Flux IA (analyse de CV)

1. Le candidat uploade un CV (PDF) → stocké sur Supabase Storage.
2. Le backend extrait le texte du PDF (ex: `pdf-parse`).
3. Le texte est envoyé à l'API OpenAI avec un prompt structuré qui retourne
   du JSON : compétences détectées, expériences, niveau estimé.
4. Si le CV est analysé dans le contexte d'une offre précise, un second appel
   (ou le même, prompt étendu) calcule un score de correspondance +
   suggestions de compétences manquantes, en comparant `parsedSkills` du CV
   à `requiredSkills` de l'offre.
5. Le résultat est stocké (`Resume.parsedSkills`, `Application.matchScore`)
   pour éviter de recalculer à chaque affichage.

## 5. Authentification

- Access token JWT (courte durée, ex 15 min) + refresh token (longue durée,
  stocké hashé en base, rotation à chaque refresh).
- Guards NestJS par rôle pour séparer les routes candidat / entreprise.
- OAuth Google/GitHub explicitement en V1.1 (pas bloquant pour le MVP).

## 6. Découpage monorepo

```
talentflow-ai/
  apps/
    web/      # Next.js
    api/      # NestJS
  packages/
    types/    # types partagés (DTO, enums de statut...)
    config/   # config ESLint/TS partagée
  docker/
  .github/
  docs/
```

`packages/ui` et `apps/mobile` sont volontairement absents du MVP (voir
roadmap) pour éviter de complexifier le monorepo avant d'avoir un premier
flux qui fonctionne de bout en bout.
