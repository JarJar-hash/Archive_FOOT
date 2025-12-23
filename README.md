
# Foot Matches Video (GitHub Pages)

## Déploiement
1. Crée un repo GitHub `foot-matches-video`
2. Ajoute ces fichiers (index.html, assets/, data/)
3. Va dans **Settings → Pages**
4. **Source** : `Deploy from a branch`
5. **Branch** : `main` / folder `/ (root)`
6. Attends 1-2 minutes → ton site est en ligne

## Mettre à jour les matchs
- Remplace `data/matches.csv` par ton CSV actualisé.
- Assure-toi que les noms des colonnes correspondent au mapping dans `assets/app.js` (`COL`).

## Colonnes attendues
Par défaut (modifiable) :
- date
- competition
- phase
- home_team
- away_team
- video_url
- (optionnel) stadium, season, notes
