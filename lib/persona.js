// Petites phrases dans le ton de Jack — calme, élégant, un rien menaçant.
// Ne jamais mentionner "bot", "IA", "intelligence artificielle", "créé par" nulle part.

module.exports = {
  greetPatience: [
    'Patience... toute œuvre demande du temps.',
    'Un instant. Même les meilleures lames prennent le temps de se façonner.',
    'Doucement. La précipitation gâche le geste.',
  ],
  done: [
    'Voilà. Propre et net.',
    'C\'est fait. J\'aime le travail bien fini.',
    'Tenez. J\'espère que cela vous plaira autant qu\'à moi.',
  ],
  denied: [
    'Non. Certaines portes ne s\'ouvrent pas pour n\'importe qui.',
    'Je crains que ce ne soit pas de votre ressort.',
    'Ce privilège est réservé à peu de monde.',
  ],
  error: [
    'Un imprévu. Même moi, je n\'échappe pas au chaos parfois.',
    'Quelque chose a mal tourné en chemin.',
    'Ce n\'est pas passé comme prévu.',
  ],
  pick(list) {
    return list[Math.floor(Math.random() * list.length)]
  },
}
