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
    images1: "images1/optimized/",
    images2: "images2/optimized/"
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
    2: "Spiacevoli = A    Piacevoli = L",
    3: "Conflitto o Spiacevole = A    Neutre o Piacevole = L",
    4: "Neutre = A    Conflitto = L",
    5: "Neutre o Spiacevole = A    Conflitto o Piacevole = L"
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
  let s1 = baseStimuli.images1;
  let s2 = baseStimuli.images2;
  let s3 = baseStimuli.images3;

  // Dedup robusto: elimina eventuali doppioni per folder+filename
  s1 = iatUniqueByKey(s1, iatStimKey);
  s2 = iatUniqueByKey(s2, iatStimKey);
  s3 = iatUniqueByKey(s3, iatStimKey);

  if (!s1.length || !s2.length || !s3.length) {
    console.warn("Stimoli mancanti per preparare i blocchi.");
    return { blocks: [], totalTrialsCount: 0 };
  }

  // ✅ BLOCCO 1: tutte le immagini di images1
  const b1 = [...s1].map((t) => ({ ...t, block: 1 }));
  iatShuffleArray(b1);

  // ✅ BLOCCO 2: tutte le immagini di images2
  const b2 = [...s2].map((t) => ({ ...t, block: 2 }));
  iatShuffleArray(b2);

  // ✅ BLOCCO 3: tutte le immagini di images1 + images2 (40)
  const b3 = [...s1, ...s2].map((t) => ({ ...t, block: 3 }));
  iatShuffleArray(b3);

  // ✅ BLOCCO 4: tutte le immagini di images3 (images1 con risposte invertite)
  const b4 = [...s3].map((t) => ({ ...t, block: 4 }));
  iatShuffleArray(b4);

  // ✅ BLOCCO 5: tutte le immagini di images2 + images3 (40)
  const b5 = [...s2, ...s3].map((t) => ({ ...t, block: 5 }));
  iatShuffleArray(b5);

  const blocks = [b1, b2, b3, b4, b5];
  const totalTrialsCount = blocks.reduce((sum, b) => sum + b.length, 0);

  console.log("Blocchi preparati. Trial totali:", totalTrialsCount);
  console.log("Lunghezze blocchi:", blocks.map(b => b.length)); // utile per debug, puoi rimuoverlo

  return { blocks, totalTrialsCount };
}

// ==========================
// UTILITY (USATE ORA)
// ==========================

// Shuffle in-place (usato ora)
function iatShuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Chiave unica per uno stimolo (usato ora)
function iatStimKey(t) {
  return `${t.folder}/${t.image}`;
}

// Dedup per chiave (usato ora)
function iatUniqueByKey(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

// ==========================
// UTILITY (OPZIONALI / FUTURO)
// ==========================
// Non usate dalla logica attuale, ma utili se in futuro torni
// a fare blocchi con subset random (es. 5+5).

// Estrae N elementi random (senza modificare l'originale)
function iatSampleN(arr, n) {
  if (n >= arr.length) {
    return iatShuffleArray([...arr]).slice(0, arr.length);
  }
  const copy = [...arr];
  iatShuffleArray(copy);
  return copy.slice(0, n);
}

// Campiona N elementi distinti (senza ripetizioni per keyFn)
// e aggiorna il set usedKeys per evitare sovrapposizioni tra gruppi.
function iatSampleNDistinct(arr, n, keyFn, usedKeys = new Set()) {
  const candidates = arr.filter((t) => !usedKeys.has(keyFn(t)));
  iatShuffleArray(candidates);
  const picked = candidates.slice(0, n);
  for (const t of picked) usedKeys.add(keyFn(t));
  return { picked, usedKeys };
}