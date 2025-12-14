// iat.texts.js
// Testi/etichette specifici di QUESTO IAT (separati dalla logica)

const IAT_TEXTS = {
  blockLabels: {
    1: "Conflitto = A    Neutre = L",
    2: "Spiacevoli = A    Piacevoli = L",
    3: "Conflitto o Spiacevole = A    Neutre o Piacevole = L",
    4: "Neutre = A    Conflitto = L",
    5: "Neutre o Spiacevole = A    Conflitto o Piacevole = L"
  },

  instructionsHtml: {
    1: `
      <p>In questo test verranno presentate delle immagini di diversa natura.</p>
      <p>Lo scopo del partecipante è quello di categorizzarle come:</p>
      <p><strong>Immagini relative al conflitto israeliano-palestinese</strong> = premere il tasto <strong>A</strong></p>
      <p><strong>Immagini neutre</strong> = premere il tasto <strong>L</strong></p>
      <br>
    `,
    2: `
      <p>Adesso è richiesto al partecipante di categorizzare le immagini, che verranno mostrate successivamente, come:</p>
      <p><strong>Spiacevoli</strong> = premere il tasto <strong>A</strong></p>
      <p><strong>Piacevoli</strong> = premere il tasto <strong>L</strong></p>
      <br>
    `,
    3: `
      <p>In questa sezione il partecipante vedrà sullo schermo due gruppi di categorie, uno a sinistra e uno a destra.</p>
      <p>Al centro dello schermo verranno presentate, una alla volta, le immagini di diverso tipo.</p>
      <p>Il compito è classificare ogni immagine il più rapidamente e accuratamente possibile, premendo:</p>
      <p>il tasto <strong>A</strong> se l’immagine appartiene a una delle categorie mostrate a sinistra (<strong>Conflitto</strong> o <strong>Spiacevole</strong>)</p>
      <p>il tasto <strong>L</strong> se l’immagine appartiene a una delle categorie mostrate a destra (<strong>Neutre</strong> o <strong>Piacevole</strong>)</p>
      <br>
      <p>Rispondi il più velocemente possibile, senza pensarci troppo, cercando allo stesso tempo di evitare errori.</p>
      <br>
    `,
    4: `
      <p><strong>Attenzione:</strong> in questa parte le immagini conflitto e neutre cambieranno posizione.</p>
      <p>Da ora in poi, le categorie associate ai tasti <strong>A</strong> e <strong>L</strong> sono diverse rispetto al blocco precedente.</p>
      <p>Al centro dello schermo verranno presentate immagini una alla volta.</p>
      <p>Il tuo compito è classificare ogni immagine il più rapidamente e accuratamente possibile, premendo:</p>
      <p>il tasto <strong>A</strong> per le immagini <strong>Neutre</strong></p>
      <p>il tasto <strong>L</strong> per le immagini del <strong>Conflitto</strong></p>
      <br>
    `,
    5: `
      <p><strong>Benvenuti nella sezione finale!</strong></p>
      <p>In questa sezione il partecipante vedrà nuovamente sullo schermo due gruppi di categorie, uno a sinistra e uno a destra dello schermo.</p>
      <p>Al centro dello schermo verranno presentate, una alla volta, le immagini di diverso tipo.</p>
      <p>Il compito è classificare ogni immagine il più rapidamente e accuratamente possibile, premendo:</p>
      <p>il tasto <strong>A</strong> se l’immagine appartiene a una delle categorie mostrate a sinistra (<strong>Neutre</strong> o <strong>Spiacevole</strong>)</p>
      <p>il tasto <strong>L</strong> se l’immagine appartiene a una delle categorie mostrate a destra (<strong>Conflitto</strong> o <strong>Piacevole</strong>)</p>
      <br>
      <p>Rispondi il più velocemente possibile, senza pensarci troppo, cercando allo stesso tempo di evitare errori.</p>
      <br>
    `
  }
};
