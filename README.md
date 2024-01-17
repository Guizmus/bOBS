# bOBS

bOBS est un bot écrit en nodejs, à vocation d'animation de stream Twitch.
Il se destine aux streameurs codeurs pour l'instant, aucune page de configuration n'étant disponible actuellement.
La structure de commande permet de faire dialoguer les différentes API (twitch, discord, OBS, et un IA Drawer - Stable Diffusion) afin de créer des évènements construits. Ces commandes sont ensuite déclenchées selon de nombreux triggers.
Un streamdeck, un overlay de tchat, ou encore une logique d'édition d'avatars personalisés pour les viewers sont fournis à titre d'example.

## Installation

Une procédure plus complète d'installation viendra compléter cette section.
* NodeJS
* obtenir des tokens pour les différentes API à connecter, et les ajouter en tant que variables d'environnement.
* configurer config.json à votre convenance

Les commandes du dossier usercommands sont désactivées, et présentes à titre d'example. Elles nécessite les bonnes scènes et sources OBS pour fonctionner.