# bOBS

bOBS est un bot écrit en nodejs, à vocation d'animation de stream Twitch.
Il se destine aux streameurs codeurs pour l'instant, aucune page de configuration n'étant disponible actuellement.
La structure de commande permet de faire dialoguer les différentes API (twitch, discord, OBS, et un IA Drawer - Stable Diffusion) afin de créer des évènements construits. Ces commandes sont ensuite déclenchées selon de nombreux triggers.
Un streamdeck, un overlay de tchat, ou encore une logique d'édition d'avatars personalisés pour les viewers sont fournis à titre d'example.

# Installation

Le bot n'a été testé que sous windows pour l'instant. Tout feedback dans d'autre environnement est apprécié.

Au sein d'un nouveau dossier, ouvrez une invite de commande et clonez le repository

```git clone https://github.com/Guizmus/bOBS.git```

[NodeJS](https://nodejs.org/en/download) est nécessaire aux fonctions basiques du bot, et doit être disponible dans l'environnement. Installez le afin de poursuivre.

Une fois cela fait, vous pouvez installer les dépendances de code du bot via l'invite de commande précédente :

```npm install .```

Le bot est désormais "fonctionnel".

Vous pouvez configurer les modules voulus dans config.json mais la majorité vous demanderons aussi de remplir le fichier .env. Voici le détail par module.

## Module Twitch

Le module Twitch requiert plusieurs Tokens afin de s'authentifier correctement auprès de Twitch.

### Créer l'application Twitch
Les tokens "TWITCH_CLIENTID" et "TWITCH_CLIENTSECRET" sont obtenus en [créant une application dans l'interface développeur Twitch](https://dev.twitch.tv/console/apps/create).
Donnez lui le nom que vous souhaitez et configurer l'URL de redirection sur ``http://localhost:3000``.
Gardez l'application privée, et la catégorie importe peu. Vous obtiendrez alors l'identifiant client (TWITCH_CLIENTID), et pourrez générer un nouveau secret (TWITCH_CLIENTSECRET).

### Accorder les droits à l'application
L'obtention du TWITCH_REFRESH_TOKEN permet d'allouer les accès de l'application à votre chaine. [Plusieurs méthodes sont disponibles](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/). Une des plus simple revient à :
* télécharger le client [Twitch CLI](https://github.com/twitchdev/twitch-cli/releases) et dézipez le
* ouvrez une invite de commande dans le dossier dézipé
* configurez le client via ``twitch configure``. Vos tokens ClientID et ClientSecret vous seront demandés.
* obtenez le TWITCH_REFRESH_TOKEN via ``twitch token -u -s "chat:edit chat:read moderator:read:followers moderator:read:chatters channel:read:redemptions moderator:manage:announcements channel:manage:polls channel:manage:redemptions moderator:manage:shoutouts channel:manage:raids"``. Cette commande ouvrira une page web vous demandant d'accorder une liste de droits à l'application. Une fois cette page validée, le RefreshToken apparaitra dans l'invite de commande.

### Activer les notifications
Le module Twitch demande aussi l'ouverture d'un port sur un protocole SSL, afin de recevoir les notifications comme les nouveaux abonnements, les raids, ...
Pour cela, l'application utilise NGROK actuellement.
Vous devrez télécharger l'exécutable sur le site de [NGROK](https://ngrok.com). Il vous faut aussi créer un compte sur le site, et obtenir [votre token](https://dashboard.ngrok.com/get-started/your-authtoken).

De plus, il vous faut rediriger les appels réseaux entrant sur votre routeur pour un port choisi.
Ce port est ouvert pour y accueillir les appels de Twitch, et doit être redirigé vers l'ordinateur exécutant l'application.
Il convient ensuite de reporter le port choisi dans le fichier ``config.json`` dans la partie "Twitch", pour la clef "https_port".

### Configurer le module
Dans le fichier ``config.json`` dans la partie "Twitch", passez "active" à true, et renseignez le nom de votre channel en minuscules.
Votre identifiant de broadcaster pour être récupéré sur Twitch, ou via différents sites comme [celui ci](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) et doit être renseigné dans la clef "broadcaster_id"

## Module 


* IADrawer : le backend utilisé actuellement est [Stable Diffusion WebUI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) et doit être lancé avec l'option --api pour activer ce module.
