# Kadea Chat

Kadea Chat est une application web de messagerie construite avec AdonisJS. Elle permet aux utilisateurs inscrits de discuter en privé ou en groupe, d'envoyer des fichiers et des messages vocaux, et de recevoir les nouveaux messages en temps réel.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage et commandes](#démarrage-et-commandes)
- [Utilisation](#utilisation)
- [Routes principales](#routes-principales)
- [Organisation du projet](#organisation-du-projet)
- [Données et fichiers](#données-et-fichiers)
- [Validation et tests](#validation-et-tests)

## Fonctionnalités

- Création de compte avec nom, adresse e-mail et mot de passe.
- Confirmation obligatoire de l'adresse e-mail avant la connexion.
- Connexion et déconnexion avec session.
- Demande de réinitialisation du mot de passe par e-mail.
- Modification du nom et ajout d'une photo de profil depuis **Mon profil**. Les photos acceptées sont JPG, PNG et WebP, jusqu'à 5 Mo.
- Liste des contacts et recherche par nom ou adresse e-mail.
- Conversations privées et création de groupes (nom du groupe et membres).
- Messages texte jusqu'à 4 000 caractères.
- Envoi de photos et de pièces jointes. Les formats autorisés sont JPG, JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT, ZIP, MP3, WAV, OGG, WebM, M4A et MP4, jusqu'à 15 Mo.
- Enregistrement et envoi de messages vocaux à l'aide du microphone du navigateur.
- Indication de saisie, compteur de messages non lus et mise à jour des conversations en temps réel.
- Thème clair ou sombre.

## Technologies

- **Serveur :** Node.js, TypeScript et AdonisJS 7.
- **Base de données :** PostgreSQL via Lucid ORM.
- **Vues :** Edge.
- **Interface réactive :** Alpine.js.
- **Temps réel :** AdonisJS Transmit (événements diffusés au navigateur).
- **Styles et compilation :** CSS, Vite.
- **E-mails :** SMTP, configuré par défaut pour Gmail.

## Prérequis

- Node.js **24 ou plus récent**.
- npm.
- Une base PostgreSQL accessible depuis l'application.
- Un serveur SMTP fonctionnel pour l'inscription, la confirmation d'adresse et la réinitialisation du mot de passe. Pour la configuration Gmail, utiliser un mot de passe d'application, et non le mot de passe principal du compte.

## Installation

Dans les commandes suivantes, le terminal doit être ouvert à la racine du dépôt `kadea-chat`.

Installez les dépendances :

```powershell
npm install
```

Créez le fichier d'environnement local à partir de l'exemple :

```powershell
Copy-Item .env.example .env
```

Configurez les variables ci-dessous, puis générez la clé de chiffrement et appliquez les migrations :

```powershell
node ace generate:key
node ace migration:run
```

Enfin, lancez le serveur de développement :

```powershell
npm run dev
```

Ouvrez ensuite l'adresse configurée dans `APP_URL` (par défaut `http://localhost:3333`).

> Dans PowerShell, si la politique d'exécution bloque les scripts `npm`, utilisez `npm.cmd` à la place de `npm` (par exemple `npm.cmd install`).

## Configuration

Le modèle de configuration complet se trouve dans `.env.example`. Le fichier `.env` est local et ne doit pas être ajouté au dépôt.

### Application

| Variable         | Rôle                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ |
| `NODE_ENV`       | Environnement : `development`, `production` ou `test`.                               |
| `PORT`           | Port HTTP, `3333` par défaut.                                                        |
| `HOST`           | Adresse d'écoute, `localhost` par défaut.                                            |
| `APP_KEY`        | Clé secrète générée avec `node ace generate:key`.                                    |
| `APP_URL`        | URL publique de l'application, utilisée notamment pour les liens envoyés par e-mail. |
| `LOG_LEVEL`      | Niveau de journalisation.                                                            |
| `SESSION_DRIVER` | Stockage de session. Le modèle utilise `cookie`.                                     |

### PostgreSQL

Créez une base de données PostgreSQL, puis renseignez ses paramètres :

| Variable      | Rôle                                      |
| ------------- | ----------------------------------------- |
| `DB_HOST`     | Hôte PostgreSQL.                          |
| `DB_PORT`     | Port PostgreSQL, généralement `5432`.     |
| `DB_USER`     | Utilisateur PostgreSQL.                   |
| `DB_PASSWORD` | Mot de passe PostgreSQL.                  |
| `DB_DATABASE` | Nom de la base, par exemple `kadea_chat`. |

L'application est configurée pour utiliser PostgreSQL par défaut.

### E-mails Gmail / SMTP

Pour que les inscriptions et demandes de réinitialisation aboutissent :

1. Activez la validation en deux étapes sur le compte Google utilisé pour l'envoi.
2. Créez un mot de passe d'application Google.
3. Configurez les variables SMTP et l'adresse d'expédition dans `.env`.

| Variable            | Valeur ou rôle                                     |
| ------------------- | -------------------------------------------------- |
| `MAIL_MAILER`       | `smtp`.                                            |
| `MAIL_FROM_NAME`    | Nom de l'expéditeur affiché.                       |
| `MAIL_FROM_ADDRESS` | Adresse e-mail d'expédition.                       |
| `SMTP_HOST`         | Hôte du serveur SMTP, `smtp.gmail.com` pour Gmail. |
| `SMTP_PORT`         | Port SMTP, `587` pour TLS ou `465` pour SSL.       |
| `SMTP_USERNAME`     | Adresse e-mail du compte SMTP.                     |
| `SMTP_PASSWORD`     | Mot de passe d'application SMTP.                   |

## Démarrage et commandes

| Commande                 | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `npm run dev`            | Lance AdonisJS en développement avec rechargement à chaud. |
| `npm start`              | Lance le serveur compilé (`bin/server.js`).                |
| `npm run build`          | Compile l'application pour la production.                  |
| `node ace migration:run` | Applique les migrations en attente.                        |
| `npm run lint`           | Exécute ESLint sur le projet.                              |
| `npm run typecheck`      | Vérifie les types TypeScript.                              |
| `npm test`               | Lance le runner de tests AdonisJS.                         |
| `npm run format`         | Formate les fichiers du projet avec Prettier.              |

Pour démarrer en production, configurez les variables d'environnement sur le serveur, exécutez `npm run build`, appliquez les migrations, puis lancez `npm start`.

## Utilisation

1. Ouvrez `/signup` et créez un compte.
2. Consultez le message envoyé par e-mail et confirmez l'adresse avec le lien reçu. Le lien de confirmation expire après 24 heures.
3. Connectez-vous sur `/login`. Les comptes dont l'adresse n'est pas confirmée ne peuvent pas se connecter.
4. Choisissez un contact dans la colonne latérale pour commencer une conversation privée. La recherche permet de filtrer les contacts.
5. Utilisez l'action de création de groupe pour choisir un nom et ajouter des membres.
6. Dans une conversation, écrivez un message ou sélectionnez le trombone pour joindre un fichier. L'icône de microphone permet d'enregistrer un message vocal ; le navigateur doit avoir accès au microphone.
7. Ouvrez l'icône de profil dans la barre latérale pour consulter ou modifier votre nom et votre photo, puis enregistrez les changements.
8. Depuis la page de connexion, utilisez le lien de mot de passe oublié pour recevoir les instructions de réinitialisation. Le lien de réinitialisation expire après une heure.

## Routes principales

| Méthode        | URL                               | Accès            | Description                                          |
| -------------- | --------------------------------- | ---------------- | ---------------------------------------------------- |
| `GET`          | `/signup`                         | Visiteur         | Formulaire de création de compte.                    |
| `POST`         | `/signup`                         | Visiteur         | Création du compte et envoi du lien de confirmation. |
| `GET`          | `/login`                          | Visiteur         | Formulaire de connexion.                             |
| `POST`         | `/login`                          | Visiteur         | Authentification ; requiert une adresse confirmée.   |
| `GET`          | `/verify-email/:token`            | Public           | Confirmation de l'adresse e-mail.                    |
| `POST`         | `/resend-verification`            | Public           | Renvoi du lien de confirmation.                      |
| `GET`          | `/forgot-password`                | Public           | Formulaire de demande de réinitialisation.           |
| `POST`         | `/forgot-password`                | Public           | Demande d'envoi du lien de réinitialisation.         |
| `GET`          | `/reset-password/:token`          | Public           | Formulaire de définition du nouveau mot de passe.    |
| `POST`         | `/reset-password`                 | Public           | Validation du nouveau mot de passe.                  |
| `POST`         | `/logout`                         | Connecté         | Déconnexion.                                         |
| `GET` / `POST` | `/profile`                        | Connecté         | Consultation et mise à jour du profil.               |
| `GET`          | `/users/:id/avatar`               | Connecté         | Affichage d'une photo de profil.                     |
| `GET`          | `/chats`                          | Connecté         | Liste des discussions et contacts.                   |
| `GET`          | `/chats/:id`                      | Connecté, membre | Affichage d'une conversation.                        |
| `POST`         | `/chats/with/:userId`             | Connecté         | Ouverture ou création d'une conversation privée.     |
| `POST`         | `/chats/groups`                   | Connecté         | Création d'un groupe.                                |
| `POST`         | `/chats/:conversationId/messages` | Connecté, membre | Envoi d'un message ou d'une pièce jointe.            |
| `POST`         | `/chats/:conversationId/typing`   | Connecté, membre | Diffusion de l'état de saisie.                       |
| `GET`          | `/attachments/:messageId`         | Connecté, membre | Consultation d'une pièce jointe de message.          |

Les routes de discussion sont protégées par authentification. L'accès à une conversation et à ses pièces jointes est limité à ses membres.

## Organisation du projet

```text
app/
  controllers/       Contrôleurs HTTP (authentification, profils, discussions)
  mails/             Notifications de confirmation et de réinitialisation
  middleware/        Middleware d'authentification
  models/            Modèles Lucid : utilisateurs, messages, discussions
  services/          Logique métier des discussions et des messages
  validators/        Validation des formulaires et requêtes
config/              Configuration de la base, des e-mails, des sessions et du temps réel
database/
  migrations/        Schéma SQL versionné
resources/
  css/               Styles de l'application
  js/                Alpine.js et client de messagerie
  views/              Vues Edge
start/
  routes.ts          Déclaration des routes HTTP
  env.ts             Validation des variables d'environnement
  kernel.ts          Middleware global et configuration HTTP
storage/uploads/     Fichiers téléversés
tests/               Configuration des tests
```

## Données et fichiers

Les migrations créent les tables des utilisateurs, jetons de confirmation d'e-mail, jetons de réinitialisation, conversations, membres et messages.

- Les messages contiennent le texte, le type de contenu, les informations de pièce jointe, l'expéditeur et la date de lecture.
- Les conversations privées sont associées à deux utilisateurs ; les groupes disposent d'un nom et d'une liste de membres avec leur rôle.
- Les pièces jointes de messages sont enregistrées sous `storage/uploads/messages`.
- Les photos de profil sont enregistrées sous `storage/uploads/avatars`.

En production, conservez les fichiers téléversés sur un stockage persistant et incluez-les dans la stratégie de sauvegarde avec la base de données. Les fichiers locaux ne sont pas automatiquement partagés entre plusieurs instances de l'application.

## Validation et tests

Avant une livraison, les contrôles principaux sont :

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Les règles d'inscription imposent une adresse e-mail unique et un mot de passe de 8 à 32 caractères. La création de groupe accepte de 1 à 50 membres, en plus du créateur.
