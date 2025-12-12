// iat.config.js
// Tutto ciò che è specifico di QUESTO IAT:
// - file CSV, cartelle
// - testi, mapping tasti, tempi minimi
// - struttura dei blocchi (iatBuildBlocks)

// ==========================
// CONFIGURAZIONE GENERALE
// ==========================

const IAT_CONFIG = {
  // File CSV e cartelle immagini
  stimFiles: {
    images1: "images1.csv",
    images2: "images2.csv"
    // images3 viene generato da images1 in codice invertendo RispostaCorretta
  },
  stimFolders: {
    images1: "images1/",
    images2: "images2/"
  },

  // Durata visibile dello stimolo (ms)
  stimDurationMs: 1000,

  // Tempi minimi (ms) di visualizzazione delle istruzioni per blocco (1-based)
  instructionMinTimes: {
    1: 15000, // 15s
    2: 15000, // 15s
    3: 30000, // 30s
    4: 15000, // 15s
    5: 30000  // 30s
  },

  // Quali blocchi salvare nel CSV finale
  savedBlocks: new Set([3, 5]),

  // Testo fisso per blocco (sopra/sotto l’immagine)
// Se un blocco non è presente qui, viene mostrata la categoria dell'immagine
  blockLabels: {
    1: "Conflitto = A    Neutre = L",
    2: "Spiacevoli = A    Piacevoli-Neutre = L",
    3: "Conflitto e Spiacevole = A    Neutre e Piacevole/Neutra = L",
    4: "Neutre = A    Conflitto = L",
    5: "Neutre o Spiacevole = A    Conflitto o Piacevole/Neutra = L"
  },

  // Testi delle istruzioni per ciascun blocco (HTML)
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
      <p><strong>Piacevoli-Neutre</strong> = premere il tasto <strong>L</strong></p>
      <br>
    `,
    3: `
      <p>In questa sezione il partecipante vedrà sullo schermo due gruppi di categorie, uno a sinistra e uno a destra.</p>
      <p>Al centro dello schermo verranno presentate, una alla volta, le immagini di diverso tipo.</p>
      <p>Il compito è classificare ogni immagine il più rapidamente e accuratamente possibile, premendo:</p>
      <p>il tasto <strong>A</strong> se l’immagine appartiene a una delle categorie mostrate a sinistra (<strong>Conflitto</strong> e <strong>Spiacevole</strong>)</p>
      <p>il tasto <strong>L</strong> se l’immagine appartiene a una delle categorie mostrate a destra (<strong>Neutre</strong> e <strong>Piacevole/Neutra</strong>)</p>
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
      <p>il tasto <strong>A</strong> se l’immagine appartiene a una delle categorie mostrate a sinistra (<strong>Neutre</strong> e <strong>Spiacevole</strong>)</p>
      <p>il tasto <strong>L</strong> se l’immagine appartiene a una delle categorie mostrate a destra (<strong>Conflitto</strong> e <strong>Piacevole/Neutra</strong>)</p>
      <br>
      <p>Rispondi il più velocemente possibile, senza pensarci troppo, cercando allo stesso tempo di evitare errori.</p>
      <br>
    `
  }
};

// ==========================
// FUNZIONE DI COSTRUZIONE BLOCCHI
// ==========================
//
// iatBuildBlocks riceve gli stimoli base (images1, images2, images3)
// e deve restituire:
//  - blocks: array [b1, b2, ...]
//  - totalTrialsCount: numero totale di trial (per la progress bar)
//
// In futuro, per un altro IAT, modificherai SOLO questa funzione
// (insieme a IAT_CONFIG) per cambiare la struttura dei blocchi.

function iatBuildBlocks(baseStimuli) {
  const s1 = baseStimuli.images1;
  const s2 = baseStimuli.images2;
  const s3 = baseStimuli.images3;

  if (!s1.length || !s2.length || !s3.length) {
    console.warn("Stimoli mancanti per preparare i blocchi.");
    return { blocks: [], totalTrialsCount: 0 };
  }

  // helper categorie (adatta se cambi i nomi nel CSV)
  const isConflitto = (cat) =>
    cat && cat.toLowerCase().includes("confl"); // es. "Conflitto"

  const isNeutro = (cat) =>
    cat && cat.toLowerCase().includes("neut"); // es. "Neutre"

  const isSpiacevole = (cat) =>
    cat && cat.toLowerCase().includes("spiac"); // es. "Spiacevole"

  const isPiacevoleNeutro = (cat) => {
    if (!cat) return false;
    const c = cat.toLowerCase();
    return c.includes("piace") || c.includes("neutr"); // es. "Piacevole-Neutra"
  };

  // -------- BLOCCO 1 --------
  // 10 immagini (5 conflitto + 5 neutre) random da images1
  const confl1 = s1.filter((t) => isConflitto(t.category));
  const neutr1 = s1.filter((t) => isNeutro(t.category));
  const b1 = [
    ...iatSampleN(confl1, 5),
    ...iatSampleN(neutr1, 5)
  ].map((t) => ({ ...t, block: 1 }));
  iatShuffleArray(b1);

  // -------- BLOCCO 2 --------
  // 10 immagini (5 Spiacevoli + 5 Piacevoli-Neutre) random da images2
  const spiace2 = s2.filter((t) => isSpiacevole(t.category));
  const piace2 = s2.filter((t) => isPiacevoleNeutro(t.category));
  console.log("Bloc2 - spiacevoli:", spiace2.length, "piacevoli-neutre:", piace2.length);
  const b2 = [
    ...iatSampleN(spiace2, 5),
    ...iatSampleN(piace2, 5)
  ].map((t) => ({ ...t, block: 2 }));
  iatShuffleArray(b2);

  // -------- BLOCCO 3 --------
  // tutte le 20 di images1 + 20 di images2, totale 40
  const b3 = [...s1, ...s2].map((t) => ({ ...t, block: 3 }));
  iatShuffleArray(b3);

  // -------- BLOCCO 4 --------
  // 10 immagini (5 conflitto + 5 neutre) random da images3
  const confl3 = s3.filter((t) => isConflitto(t.category));
  const neutr3 = s3.filter((t) => isNeutro(t.category));
  const b4 = [
    ...iatSampleN(confl3, 5),
    ...iatSampleN(neutr3, 5)
  ].map((t) => ({ ...t, block: 4 }));
  iatShuffleArray(b4);

  // -------- BLOCCO 5 --------
  // tutte le 20 di images2 + 20 di images3, totale 40
  const b5 = [...s2, ...s3].map((t) => ({ ...t, block: 5 }));
  iatShuffleArray(b5);

  const blocks = [b1, b2, b3, b4, b5];
  const totalTrialsCount = blocks.reduce((sum, b) => sum + b.length, 0);

  console.log("Blocchi preparati. Trial totali:", totalTrialsCount);

  return { blocks, totalTrialsCount };
}

// ==========================
// PICCOLE UTILITY USATE SOLO QUI
// ==========================

// Estrae n elementi random da un array (senza modificare l'originale)
function iatSampleN(arr, n) {
  if (n >= arr.length) {
    return iatShuffleArray([...arr]).slice(0, arr.length);
  }
  const copy = [...arr];
  iatShuffleArray(copy);
  return copy.slice(0, n);
}

// Shuffle in-place
function iatShuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
