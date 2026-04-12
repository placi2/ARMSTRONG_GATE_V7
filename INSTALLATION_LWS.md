# AMSTRONG GATE - Guide d'Installation sur LWS

## Vue d'ensemble

**AMSTRONG GATE** est une application web complète de gestion d'exploitation aurifère. Cette version full-stack utilise React pour le frontend et PHP/MySQL pour le backend, optimisée pour l'hébergement sur LWS (Lws.fr).

## Architecture de l'application

L'application est composée de trois éléments principaux :

1. **Frontend React** : Interface utilisateur moderne et responsive
2. **Backend PHP** : APIs RESTful pour la gestion des données
3. **Base de données MySQL** : Stockage persistant de toutes les données

### Structure des fichiers

```
amstrong-gate/
├── frontend/                 # Application React compilée
│   ├── dist/                # Build production
│   └── public/              # Assets statiques
├── backend/                 # Code PHP
│   ├── api/                 # Endpoints API
│   │   ├── sites.php
│   │   ├── teams.php
│   │   ├── employees.php
│   │   ├── productions.php
│   │   ├── expenses.php
│   │   ├── advances.php
│   │   ├── cash.php
│   │   └── settings.php
│   ├── config/              # Configuration
│   │   └── Database.php
│   └── index.php            # Point d'entrée
└── database/                # Scripts SQL
    └── schema.sql           # Schéma complet
```

## Prérequis

- Compte LWS actif avec accès FTP et phpMyAdmin
- PHP 7.4 ou supérieur
- MySQL 5.7 ou supérieur
- Navigateur web moderne

## Étapes d'installation

### Étape 1 : Préparation de la base de données

1. **Connectez-vous à phpMyAdmin LWS**
   - Accédez à votre panneau de contrôle LWS
   - Cliquez sur "phpMyAdmin"
   - Connectez-vous avec vos identifiants

2. **Créer la base de données**
   - Cliquez sur "Créer une base de données"
   - Nommez-la `amstrong_gate`
   - Sélectionnez le charset `utf8mb4_unicode_ci`
   - Cliquez sur "Créer"

3. **Importer le schéma SQL**
   - Sélectionnez la base de données `amstrong_gate`
   - Cliquez sur l'onglet "Importer"
   - Choisissez le fichier `database/schema.sql` de ce projet
   - Cliquez sur "Exécuter"

4. **Vérifier les tables créées**
   - Vous devriez voir 13 tables : users, settings, sites, teams, employees, productions, expenses, salary_advances, cash_movements, invoices, favorites, audit_log, et les vues

### Étape 2 : Configuration du backend PHP

1. **Télécharger les fichiers via FTP**
   - Connectez-vous à votre serveur FWS via FTP
   - Naviguez vers le répertoire racine public_html
   - Créez un dossier `api` à la racine
   - Uploadez tous les fichiers du dossier `backend/` dans ce répertoire

2. **Configurer la connexion à la base de données**
   - Ouvrez le fichier `backend/config/Database.php`
   - Modifiez les paramètres de connexion :

```php
private $host = 'localhost';           // Généralement localhost
private $db_name = 'amstrong_gate';    // Nom de votre base
private $user = 'votre_utilisateur';   // Utilisateur MySQL LWS
private $password = 'votre_mot_de_passe'; // Mot de passe MySQL
```

3. **Tester la connexion**
   - Accédez à `https://votredomaine.com/api/sites.php`
   - Vous devriez recevoir une réponse JSON

### Étape 3 : Déployer le frontend React

1. **Compiler l'application React**
   - En local, exécutez : `npm run build`
   - Cela crée un dossier `dist/` avec les fichiers optimisés

2. **Télécharger les fichiers compilés**
   - Via FTP, uploadez le contenu du dossier `dist/` à la racine `public_html/`
   - Assurez-vous que `index.html` est à la racine

3. **Configurer les URLs API**
   - Modifiez le fichier `src/config/api.js` (ou créez-le) :

```javascript
const API_BASE_URL = 'https://votredomaine.com/api';

export const API_ENDPOINTS = {
  sites: `${API_BASE_URL}/sites.php`,
  teams: `${API_BASE_URL}/teams.php`,
  employees: `${API_BASE_URL}/employees.php`,
  productions: `${API_BASE_URL}/productions.php`,
  expenses: `${API_BASE_URL}/expenses.php`,
  advances: `${API_BASE_URL}/advances.php`,
  cash: `${API_BASE_URL}/cash.php`,
  settings: `${API_BASE_URL}/settings.php`,
};
```

4. **Vérifier le déploiement**
   - Accédez à `https://votredomaine.com/`
   - L'application devrait charger

### Étape 4 : Configuration initiale

1. **Accéder à l'application**
   - Ouvrez `https://votredomaine.com/`
   - Connectez-vous avec les identifiants par défaut :
     - **Admin** : `admin@amstrong.com` / `admin123`
     - **Manager** : `manager@amstrong.com` / `manager123`
     - **Employé** : `employee@amstrong.com` / `employee123`

2. **Configurer les paramètres**
   - Allez dans "Paramètres" (Admin uniquement)
   - Configurez :
     - Devise (EUR, USD, CDF)
     - Taux de change USD → CDF
     - Prix de rachat de l'or (€/g)
     - Logo et couleur de l'entreprise

3. **Ajouter vos données**
   - Créez vos sites d'exploitation
   - Ajoutez vos équipes
   - Enregistrez vos employés
   - Commencez à enregistrer les productions et dépenses

## Gestion des utilisateurs

### Créer un nouvel utilisateur

1. Connectez-vous en tant qu'administrateur
2. Accédez à la section "Utilisateurs" (si disponible)
3. Cliquez sur "Ajouter un utilisateur"
4. Remplissez les informations :
   - Email
   - Mot de passe
   - Rôle (Admin, Manager, Employé)
5. Cliquez sur "Créer"

### Modifier les mots de passe

Les mots de passe sont stockés en hash bcrypt. Pour modifier un mot de passe :

1. Via phpMyAdmin, accédez à la table `users`
2. Cliquez sur "Modifier" pour l'utilisateur
3. Utilisez une fonction PHP pour hasher le nouveau mot de passe :

```php
$newPassword = password_hash('nouveau_mot_de_passe', PASSWORD_BCRYPT);
```

4. Collez le hash dans le champ `password_hash`

## Maintenance et sauvegarde

### Sauvegarder la base de données

1. Accédez à phpMyAdmin
2. Sélectionnez la base `amstrong_gate`
3. Cliquez sur "Exporter"
4. Choisissez le format SQL
5. Cliquez sur "Exécuter"

### Sauvegarder les fichiers

1. Via FTP, téléchargez régulièrement :
   - Le contenu de `public_html/`
   - Les fichiers du backend

### Mettre à jour l'application

1. Téléchargez la nouvelle version
2. Sauvegardez votre version actuelle
3. Uploadez les nouveaux fichiers via FTP
4. Exécutez les scripts de migration (si nécessaire)
5. Testez l'application

## Dépannage

### Erreur de connexion à la base de données

**Problème** : "Erreur de connexion: SQLSTATE[HY000]"

**Solutions** :
- Vérifiez les identifiants MySQL dans `Database.php`
- Assurez-vous que la base de données existe
- Vérifiez que l'utilisateur MySQL a les permissions nécessaires
- Testez la connexion via phpMyAdmin

### Erreur 404 sur les APIs

**Problème** : Les endpoints API retournent 404

**Solutions** :
- Vérifiez que les fichiers PHP sont uploadés dans le bon répertoire
- Assurez-vous que le serveur supporte les URLs rewriting (généralement activé par défaut)
- Vérifiez les permissions des fichiers (644 pour les fichiers, 755 pour les dossiers)

### Erreur CORS (Cross-Origin)

**Problème** : "Access to XMLHttpRequest blocked by CORS policy"

**Solutions** :
- Les headers CORS sont déjà configurés dans les fichiers PHP
- Si le problème persiste, créez un fichier `.htaccess` à la racine :

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

### L'application charge mais les données ne s'affichent pas

**Problème** : Le frontend charge mais aucune donnée n'apparaît

**Solutions** :
- Ouvrez la console du navigateur (F12)
- Vérifiez les erreurs réseau
- Testez les URLs API directement dans le navigateur
- Vérifiez que la base de données contient des données

## Sécurité

### Recommandations importantes

1. **Changer les mots de passe par défaut**
   - Modifiez immédiatement les mots de passe des utilisateurs par défaut
   - Utilisez des mots de passe forts

2. **Configurer HTTPS**
   - LWS offre des certificats SSL gratuits
   - Activez HTTPS dans le panneau de contrôle
   - Forcez la redirection HTTP → HTTPS

3. **Sécuriser les fichiers sensibles**
   - Limitez l'accès à `Database.php`
   - Utilisez des permissions de fichier appropriées

4. **Mettre à jour régulièrement**
   - Vérifiez les mises à jour de sécurité
   - Appliquez les patches rapidement

5. **Sauvegarder régulièrement**
   - Effectuez des sauvegardes hebdomadaires
   - Testez les restaurations

## Support et ressources

- **Documentation LWS** : https://www.lws.fr/aide/
- **Documentation PHP** : https://www.php.net/docs.php
- **Documentation MySQL** : https://dev.mysql.com/doc/
- **React Documentation** : https://react.dev/

## Licence

AMSTRONG GATE est fourni tel quel pour usage interne. Tous les droits sont réservés.

---

**Version** : 1.0.0  
**Dernière mise à jour** : Mars 2026  
**Auteur** : Manus AI
