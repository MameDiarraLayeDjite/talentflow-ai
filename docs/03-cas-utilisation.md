# Cas d'utilisation — TalentFlow AI (MVP)

## Candidat

| # | Cas d'utilisation | Détail |
|---|---|---|
| C1 | S'inscrire / se connecter | Email + mot de passe, JWT + refresh token |
| C2 | Créer/éditer son profil | Nom, titre, bio, compétences, liens (LinkedIn, GitHub) |
| C3 | Uploader un CV | PDF, stocké sur Supabase Storage |
| C4 | Obtenir une analyse IA de son CV | Extraction compétences + score vs une offre ciblée + suggestions |
| C5 | Rechercher des offres | Filtres : mot-clé, localisation, type de contrat |
| C6 | Postuler à une offre | Candidature liée au profil + CV, statut initial "reçue" |
| C7 | Suivre ses candidatures | Liste avec statut à jour |
| C8 | Recevoir des notifications | Ex: statut de candidature changé |

## Entreprise

| # | Cas d'utilisation | Détail |
|---|---|---|
| E1 | S'inscrire / se connecter | Compte entreprise, JWT |
| E2 | Créer/éditer le profil entreprise | Nom, logo, description, secteur |
| E3 | Publier une offre | Titre, description, compétences requises, contrat, localisation |
| E4 | Voir les candidatures reçues | Liste par offre, avec score IA de matching |
| E5 | Changer le statut d'une candidature | reçue → en revue → entretien → refusée/acceptée |
| E6 | Consulter un pipeline simple | Vue Kanban ou liste groupée par statut |

## Flux critique (parcours de bout en bout à démontrer)

1. Fatou s'inscrit (C1), complète son profil (C2), uploade son CV (C3).
2. Elle cherche une offre (C5), consulte le score IA de correspondance (C4).
3. Elle postule (C6).
4. Ousmane reçoit la candidature (E4), voit le score IA, change le statut
   (E5).
5. Fatou voit son statut mis à jour dans son suivi (C7) et reçoit une
   notification (C8).

Ce flux complet est la démo de référence du projet — c'est lui qui doit
fonctionner sans accroc en priorité.

## Hors périmètre V1 (renvoyé en roadmap)

- Chat recruteur ↔ candidat
- Génération de lettre de motivation
- Planification d'entretien avec calendrier
- Notifications temps réel (WebSocket)
