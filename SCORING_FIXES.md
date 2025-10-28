# Corrections apportées au système de scoring

## Problèmes corrigés

### 1. Calcul de score
- **Problème** : On pouvait perdre plus de points que pariés
- **Solution** : Le calcul de score retourne maintenant `-pointsBet` au lieu de potentiellement plus de pertes
- **Fichiers modifiés** :
  - `app/composables/useScoring.ts`
  - `app/composables/useRooms.ts`
  - `server/api/rooms/[id]/close.patch.ts`

### 2. Déduction automatique des points
- **Problème** : Les points étaient déduits lors du pari mais pas correctement redistribués
- **Solution** : Correction de la logique de redistribution des points à la fin de la room
- **Logique** : `nouveau_total = total_actuel + montant_parié + gains_obtenus`

### 3. Système de notifications
- **Ajout** : Notifications automatiques à la fin des rooms avec :
  - Résultat du match
  - Points gagnés/perdus
  - Rang obtenu
  - Nombre total de participants
- **Fichiers créés/modifiés** :
  - `app/composables/useNotifications.ts` (étendu)
  - `app/components/RoomResultsNotifications.vue` (nouveau)
  - `app/pages/index.vue` (ajout du composant)

### 4. Suppression des entrées KCTheGoat
- **Script SQL** : `cleanup_kcthegoat.sql`
- **Usage** : Exécuter ce script dans l'éditeur SQL de Supabase pour supprimer toutes les entrées liées à KCTheGoat

## Comment utiliser le script de nettoyage

1. Ouvrir l'éditeur SQL dans Supabase
2. Copier le contenu de `cleanup_kcthegoat.sql`
3. Exécuter le script
4. Vérifier que toutes les entrées KCTheGoat ont été supprimées

## Améliorations du flow

1. **Pari** : Les points sont déduits du compte utilisateur
2. **Fin de room** : 
   - Calcul des scores selon la précision des prédictions
   - Redistribution des points (montant parié + gains)
   - Envoi de notifications à tous les participants
3. **Notifications** : Affichage des résultats avec gains/pertes et rang

## Système de scoring

- **Score exact** : 100 × montant parié
- **Différence de buts correcte** : 50 × montant parié  
- **Gagnant correct** : 30 × montant parié
- **Prédiction incorrecte** : -montant parié (pas plus)

Le système garantit maintenant qu'on ne peut jamais perdre plus de points que ce qu'on a parié.
