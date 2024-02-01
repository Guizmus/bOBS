# bOBS

bOBS est un bot écrit en nodejs, à vocation d'animation de stream Twitch.
Il se destine aux streameurs codeurs pour l'instant, aucune page de configuration n'étant disponible actuellement.
La structure de commande permet de faire dialoguer les différentes API (twitch, discord, OBS, et un IA Drawer - Stable Diffusion) afin de créer des évènements construits. Ces commandes sont ensuite déclenchées selon de nombreux triggers.
Un streamdeck, un overlay de tchat, ou encore une logique d'édition d'avatars personalisés pour les viewers sont fournis à titre d'example.

# Installation

Le bot n'a été testé que sous windows pour l'instant. Tout feedback dans d'autre environnement est apprécié.

``git clone https://github.com/Guizmus/bOBS.git``

[NodeJS](https://nodejs.org/en/download) est nécessaire aux fonctions basiques du bot, et doit être disponible dans l'environnement.

Il convient désormais d'installer les dépendances de code :

``npm install .``

Le bot est désormais fonctionnel. Vous pouvez configurer les modules voulus dans config.json.
Afin d'utiliser les différents modules, il convient cependant de valider les prérequis suivants :

## Module Twitch

Le module Twitch requiert plusieurs Tokens afin de s'authentifier correctement auprès de Twitch.

### Déclaration de l'application Twitch

Accéder à votre console 
Le module Twitch demande aussi l'ouverture d'un port sur un protocole SSL, afin de recevoir les notifications comme les nouveaux abonnements, les raids, ...



Certaines API que le bot met à disposition demandent des prérequis supplémentaires.

* Twitch : l'exécutable [ngrok](https://ngrok.com) doit être disponible dans l'environnement (ou déposé dans le dossier bOBS) pour permettre la réception des events (onSub, onFollow, ...) qui ne peut se faire qu'en SSL.
* IADrawer : le backend utilisé actuellement est [Stable Diffusion WebUI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) et doit être lancé avec l'option --api pour activer ce module.
