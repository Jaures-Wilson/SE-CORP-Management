# Justificatifs de caisse

Ce dossier conserve les reçus et photos de justificatifs de dépenses.

## Organisation

Créer un sous-dossier par date au format AAAA-MM-JJ :

```
justificatifs/
├── 2025-01-15/
│   ├── recu-imprimante.jpg
│   └── facture-internet.jpg
├── 2025-01-16/
│   └── recu-fournitures.jpg
```

## Comment ajouter un justificatif

1. Prendre la photo du reçu avec votre téléphone
2. La transférer sur votre ordinateur
3. La déposer dans le sous-dossier du jour correspondant
4. Faire un `git add . && git commit -m "Justificatif du JJ-MM-AAAA" && git push`

Les fichiers sont ainsi conservés de façon permanente et consultables depuis GitHub.
