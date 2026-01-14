### Résumé Complété sur Git et GitLab

---

#### Présentation de Git

Git est un logiciel de gestion de versions décentralisé, libre et gratuit, créé en 2005 par Linus Torvalds. Il permet de stocker un ensemble de fichiers tout en conservant un historique des modifications, sécurisant ainsi les données et facilitant la collaboration entre utilisateurs.

#### Glossaire Git

- **Dépôt (repository)** : Espace de stockage public géré par le logiciel de gestion de version.
- **Gestion de version** :
  - **Copie locale (clone)** : Copie d’une version d’un fichier en local.
  - **Téléchargement (pull)** : Récupération d’un fichier depuis le dépôt.
  - **Écriture (push)** : Envoi de modifications au dépôt.
  - **Suivi d’état (status)** : Vérification des modifications sur les fichiers.
  - **Branche (branch)** : « Copie » de votre projet pour développer et tester de nouvelles fonctionnalités sans impacter la version de base.

---

#### Zones de travail dans Git

Les états de fichiers dans Git sont liés à des zones de travail distinctes :
- **Working Directory** : Zone de travail locale.
- **Staging Area** : Zone préparatoire pour la validation.
- **Repository** : Zone où les versions validées sont stockées.

---

#### Configuration des outils

Pour configurer Git selon l’identité de l’utilisateur, utilisez les commandes suivantes :
```bash
git config --global user.name "Votre nom"
git config --global user.email "Votre email"
```

---

#### Création de dépôts

Pour débuter avec Git, créez un nouveau dépôt :
```bash
git init
```
Ou clonez un dépôt existant avec :
```bash
git clone git@github.com:name/chemin/vers/dépôt
```

---

#### Manipulation des commandes de base de Git

**Synchroniser les changements** :
- Envoyer les modifications locales à la branche principale :
  ```bash
  git push origin main
  ```
- Fusionner les modifications du dépôt distant dans le répertoire local :
  ```bash
  git pull origin main
  ```

**Grouper les changements** :
- Lister toutes les branches présentes :
  ```bash
  git branch
  ```
- Créer une nouvelle branche :
  ```bash
  git branch <nom-branche>
  ```
- Passer à une autre branche :
  ```bash
  git checkout <nom-branche>
  ```
- Fusionner une branche dans la branche actuelle :
  ```bash
  git merge <nom-branche>
  ```

---

Ce résumé englobe les éléments essentiels de Git et GitLab, en fournissant une vue d'ensemble de la gestion de versions, des commandes de base, des zones de travail, et de la configuration des outils.
<!-- Updated: 2025-12-11 -->
<!-- Updated: 2025-12-17 -->
<!-- Updated: 2025-12-17 -->
<!-- Updated: 2025-12-19 -->
<!-- Updated: 2025-12-31 -->
<!-- Updated: 2026-01-09 -->
<!-- Updated: 2026-01-13 -->
<!-- Updated: 2026-01-14 -->
