# Guide de Test - Ajout de Production et Impact Financier

## Objectif
Tester le workflow complet d'ajout de production avec le compte manager et vérifier l'impact sur les rapports financiers.

---

## Étape 1 : Connexion avec le Compte Manager

### Identifiants
- **Email** : `manager@goldmine.com`
- **Mot de passe** : `manager123`

### Actions
1. Accédez à la page de connexion
2. Entrez l'email et le mot de passe du manager
3. Cliquez sur "Se connecter"
4. Vous serez redirigé vers le tableau de bord

### Résultat Attendu
- ✅ Connexion réussie
- ✅ Affichage du nom "Manager User" dans le menu utilisateur
- ✅ Rôle "manager" visible dans le profil
- ✅ Accès au tableau de bord avec les permissions manager

---

## Étape 2 : Localiser le Formulaire d'Ajout de Production

### Actions
1. Sur le tableau de bord, cherchez le bouton **"+ Ajouter Production"** (bouton orange)
2. Le bouton est situé en haut à droite du tableau de bord
3. Cliquez sur le bouton

### Résultat Attendu
- ✅ Une modale "Ajouter une Production" s'ouvre
- ✅ Le formulaire contient les champs suivants :
  - Équipe (dropdown)
  - Employé (dropdown)
  - Poids (en grammes)
  - Pureté (en pourcentage)
  - Notes (optionnel)

---

## Étape 3 : Remplir le Formulaire de Production

### Données de Test Recommandées

**Exemple 1 - Production Standard**
- **Équipe** : Équipe A (Site 1)
- **Employé** : Sélectionner un employé de l'équipe
- **Poids** : 500 (grammes)
- **Pureté** : 95 (%)
- **Notes** : "Production test du manager"

**Exemple 2 - Production Importante**
- **Équipe** : Équipe B (Site 1)
- **Employé** : Sélectionner un employé
- **Poids** : 1200 (grammes)
- **Pureté** : 98 (%)
- **Notes** : "Production importante"

### Actions
1. Sélectionnez une équipe dans le dropdown
2. Sélectionnez un employé associé à cette équipe
3. Entrez le poids en grammes (ex: 500)
4. Entrez la pureté en pourcentage (ex: 95)
5. Optionnellement, ajoutez des notes
6. Cliquez sur "Ajouter"

### Résultat Attendu
- ✅ Modale se ferme
- ✅ Message de confirmation "Production ajoutée avec succès"
- ✅ Les données sont sauvegardées

---

## Étape 4 : Vérifier l'Impact sur le Tableau de Bord

### Actions
1. Retournez au tableau de bord (cliquez sur "Tableau de Bord" dans le menu)
2. Observez les cartes de statistiques en haut

### Métriques à Vérifier

**Production Totale**
- Avant : Notez la valeur initiale (ex: 4500g)
- Après : Doit augmenter du poids ajouté (ex: 4500 + 500 = 5000g)
- ✅ Vérifiez que le changement est visible

**Valeur Production**
- Calcul : Poids × Pureté / 100 × Prix unitaire
- Avant : Notez la valeur initiale (ex: 293k€)
- Après : Doit augmenter (ex: 293k€ + valeur nouvelle production)
- ✅ Vérifiez que la valeur augmente proportionnellement

**Résultat Net**
- Calcul : Valeur Production - Dépenses Totales
- Avant : Notez la valeur initiale (ex: 289k€)
- Après : Doit augmenter du bénéfice de la nouvelle production
- ✅ Vérifiez que le résultat net s'améliore

**Rentabilité**
- Calcul : (Résultat Net / Valeur Production) × 100
- Avant : Notez le pourcentage initial (ex: 98.6%)
- Après : Peut varier selon la pureté de la nouvelle production
- ✅ Vérifiez que le pourcentage change

---

## Étape 5 : Consulter les Rapports Financiers Détaillés

### Actions
1. Cliquez sur "Résultats Financiers" dans le menu de gauche
2. Observez les tableaux détaillés

### Vérifications

**Tableau des Équipes**
- Cherchez l'équipe pour laquelle vous avez ajouté la production
- La ligne correspondante doit montrer :
  - ✅ Production Totale augmentée
  - ✅ Valeur augmentée
  - ✅ Résultat Net augmenté
  - ✅ Rentabilité mise à jour

**Tableau des Sites**
- Cherchez le site correspondant
- Les totaux du site doivent être augmentés
- ✅ Vérifiez que les agrégations sont correctes

---

## Étape 6 : Vérifier l'Impact sur le Profil de l'Équipe

### Actions
1. Cliquez sur "Équipes" dans le menu
2. Cliquez sur le nom de l'équipe pour laquelle vous avez ajouté la production
3. Consultez le profil détaillé

### Vérifications

**Statistiques de l'Équipe**
- ✅ Production Totale mise à jour
- ✅ Valeur Production augmentée
- ✅ Graphique "Production Mensuelle" reflète la nouvelle production
- ✅ Tableau "Historique des Productions" affiche la nouvelle entrée

**Profil de l'Employé**
1. Cliquez sur "Employés" dans le menu
2. Cliquez sur l'employé pour lequel vous avez ajouté la production
3. Consultez son profil

### Vérifications
- ✅ Production Totale de l'employé augmentée
- ✅ Graphique "Historique de Production" affiche la nouvelle production
- ✅ Tableau "Détail des Productions" contient la nouvelle entrée

---

## Étape 7 : Vérifier les Prévisions

### Actions
1. Cliquez sur "Prévisions" dans le menu
2. Sélectionnez le filtre approprié (Global, Par Site, ou Par Équipe)

### Vérifications
- ✅ Les prévisions futures sont recalculées
- ✅ La tendance peut avoir changé (hausse/baisse/stable)
- ✅ Les intervalles de confiance sont mis à jour
- ✅ Les recommandations reflètent la nouvelle production

---

## Étape 8 : Tester avec Plusieurs Productions

### Actions
1. Ajoutez 2-3 productions supplémentaires avec des équipes/poids différents
2. Vérifiez que chaque ajout met à jour correctement les rapports

### Cas de Test

**Test 1 : Production Faible Pureté**
- Poids : 800g
- Pureté : 80%
- Vérifiez que la valeur est proportionnellement plus basse

**Test 2 : Production Haute Pureté**
- Poids : 300g
- Pureté : 99%
- Vérifiez que la valeur est proportionnellement plus haute malgré le poids inférieur

**Test 3 : Production d'une Autre Équipe**
- Sélectionnez une équipe différente
- Vérifiez que les statistiques de chaque équipe sont correctes

---

## Étape 9 : Vérifier les Permissions du Manager

### Actions
1. Essayez d'accéder à des sections restreintes :
   - Cliquez sur "Employés" → Essayez de supprimer un employé
   - Cliquez sur "Sites" → Essayez de modifier un site

### Résultats Attendus
- ✅ Manager peut consulter les employés
- ✅ Manager peut consulter les sites
- ✅ Manager peut ajouter/modifier des équipes
- ✅ Manager peut ajouter des productions et dépenses
- ✅ Manager peut consulter les rapports financiers
- ❌ Manager ne peut pas supprimer des employés ou sites (accès restreint)

---

## Étape 10 : Comparer avec le Compte Admin

### Actions
1. Déconnectez-vous (cliquez sur votre profil → Déconnexion)
2. Connectez-vous avec le compte admin :
   - Email : `admin@goldmine.com`
   - Mot de passe : `admin123`
3. Vérifiez que les productions ajoutées par le manager sont visibles

### Vérifications
- ✅ Admin voit toutes les productions
- ✅ Admin voit les mêmes totaux que le manager
- ✅ Admin a accès à plus de fonctionnalités (gestion des utilisateurs, etc.)

---

## Résumé des Résultats Attendus

| Métrique | Avant | Après | Changement |
|----------|-------|-------|-----------|
| Production Totale | 4500g | 5000g | +500g |
| Valeur Production | 293k€ | ~298k€ | +~5k€ |
| Dépenses Totales | 3k€ | 3k€ | 0€ |
| Résultat Net | 289k€ | ~294k€ | +~5k€ |
| Rentabilité | 98.6% | ~98.7% | Stable |

---

## Troubleshooting

### Le bouton "Ajouter Production" ne s'affiche pas
- ✅ Vérifiez que vous êtes connecté avec le compte manager
- ✅ Vérifiez que vous êtes sur le tableau de bord
- ✅ Actualisez la page (F5)

### Les données ne se mettent pas à jour
- ✅ Attendez quelques secondes
- ✅ Actualisez la page
- ✅ Vérifiez la console du navigateur pour les erreurs

### Impossible de sélectionner un employé
- ✅ Vérifiez que vous avez sélectionné une équipe d'abord
- ✅ La liste des employés dépend de l'équipe sélectionnée

### Les prévisions ne changent pas
- ✅ Les prévisions sont recalculées avec les données historiques
- ✅ Une seule production peut ne pas avoir d'impact visible
- ✅ Ajoutez plusieurs productions pour voir un changement de tendance

---

## Conclusion

Ce guide de test vérifie que :
1. ✅ Le compte manager peut ajouter des productions
2. ✅ Les données sont correctement sauvegardées
3. ✅ Les rapports financiers se mettent à jour en temps réel
4. ✅ Les permissions sont correctement appliquées
5. ✅ Les prévisions sont recalculées automatiquement
6. ✅ L'intégrité des données est maintenue

