# Hermes Discord Bot — Le Mistral Bot

Bot Discord francophone propulsé par Hermes Agent. Répond aux @mentions en français dans le canal configuré.

## État actuel

- **Nom du bot** : Le Mistral Bot#9470
- **Statut** : ✅ En ligne (PM2)
- **Framework** : Node.js + discord.js v14
- **Sécurité** : Token chiffré via dotenvx

## Structure du projet

```
/data/workspace/
├── hermes-discord-bot-clean.js   # Code principal du bot
├── manage_hermes.sh              # Script canonique de gestion (start/stop/restart/status/logs)
├── hermes_watchdog.sh            # Surveillance automatique (vérifie PM2 toutes les 60s)
├── start_after_reboot.sh         # Démarrage post-reboot
├── test-token.js                 # Utilitaire de test de token Discord
├── package.json                  # Configuration npm
├── .env                          # Variables chiffrées (dotenvx)
├── .env.keys                     # Clés de déchiffrement (⚠️ ne pas commit)
└── node_modules/                 # Dépendances
```

## Gestion du bot

Toutes les opérations passent par `manage_hermes.sh` :

```bash
./manage_hermes.sh start      # Démarrer le bot
./manage_hermes.sh stop       # Arrêter le bot
./manage_hermes.sh restart    # Redémarrer le bot
./manage_hermes.sh status     # Voir l'état
./manage_hermes.sh logs       # Voir les logs
```

Équivalents npm :

```bash
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
npm run pm2:status
npm run pm2:logs
```

## Après un reboot

```bash
/data/workspace/start_after_reboot.sh
```

Ce script lance le watchdog (surveillance automatique) puis démarre le bot.

## Récupération automatique

Le watchdog (`hermes_watchdog.sh`) :
- Vérifie l'état du bot via `pm2 list` toutes les 60 secondes
- Redémarre automatiquement en cas de crash
- Abandonne après 5 redémarrages consécutifs (intervention manuelle requise)
- Logs dans `/data/workspace/hermes_watchdog.log`

## Sécurité

- Le token Discord est **chiffré** dans `.env` via dotenvx
- Le bot est lancé avec `npx dotenvx run` qui déchiffre les variables au runtime
- **Ne jamais** commit `.env.keys` ou exposer le token en clair
- Pour ajouter/modifier une variable chiffrée : `npx dotenvx set NOM_VARIABLE "valeur"`

## Dépannage

| Problème | Vérification |
|---|---|
| Bot ne répond pas | `./manage_hermes.sh status` |
| Erreur de token | `npx dotenvx get DISCORD_BOT_TOKEN` |
| Watchdog muet | `tail -f /data/workspace/hermes_watchdog.log` |
| PM2 corrompu | `npx pm2 kill && ./manage_hermes.sh start` |

## Maintenance

- **Logs** : `./manage_hermes.sh logs` ou `tail -f /data/workspace/hermes_watchdog.log`
- **Màj dépendances** : `npm update`
- **Test de réactivité** : Mentionner @Le Mistral Bot dans Discord
