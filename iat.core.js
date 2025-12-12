// iat.core.js
// Motore generico dell'IAT
// Usa IAT_CONFIG e iatBuildBlocks definiti in iat.config.js

// ==========================
// STATO DELL'ESPERIMENTO
// ==========================

const IAT_STATE = {
  baseStimuli: {
    images1: [],
    images2: [],
    images3: [] // copia di images1 con RispostaCorretta invertita
  },
  blocks: [],               // array di array di trial (blocchi 1–5)
  currentBlockIndex: 0,     // 0 = blocco1, 1 = blocco2, ...
  currentTrialIndex: 0,     // indice trial nel blocco corrente
  totalTrialsCount: 0,      // es. 110
  completedTrials: 0,       // quanti trial completati in tutto il test
  phoneLast3: "",
  trialStartTime: null,
  hideTimeoutId: null,      // id del setTimeout che nasconde l'immagine
  results: [],              // solo blocchi configurati in savedBlocks
  canLeaveInstructions: false,
  instrTimerIntervalId: null   // intervallo per il countdown istruzioni

};

// ==========================
// INIZIALIZZAZIONE
// ==========================

document.addEventListener("DOMContentLoaded", () => {
  console.log("Pagina caricata, inizializzo...");

  const startButton = document.getElementById("start-button");
  if (startButton) {
    startButton.addEventListener("click", handleStart);
  }

  const nextInstrButton = document.getElementById("next-instruction");
  if (nextInstrButton) {
    nextInstrButton.addEventListener("click", handleInstructionContinue);
  }

  // Carica gli stimoli di base (images1 e images2)
  loadAllStimuli();
});

// ==========================
// CARICAMENTO STIMOLI
// ==========================

function loadAllStimuli() {
  Promise.all([
    fetchAndParseCSV(IAT_CONFIG.stimFiles.images1, "images1"),
    fetchAndParseCSV(IAT_CONFIG.stimFiles.images2, "images2")
  ])
    .then(([s1, s2]) => {
      IAT_STATE.baseStimuli.images1 = s1;
      IAT_STATE.baseStimuli.images2 = s2;
      IAT_STATE.baseStimuli.images3 = createImages3FromImages1(s1);

      console.log("Stimoli base:", {
        images1: s1.length,
        images2: s2.length,
        images3: IAT_STATE.baseStimuli.images3.length
      });

      const { blocks, totalTrialsCount } = iatBuildBlocks(IAT_STATE.baseStimuli);
      IAT_STATE.blocks = blocks;
      IAT_STATE.totalTrialsCount = totalTrialsCount;
    })
    .catch((err) => {
      console.error(err);
      alert("Errore nel caricamento dei file CSV (images1.csv / images2.csv).");
    });
}

function fetchAndParseCSV(url, folderKey) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Errore nel caricamento di " + url);
      }
      return response.text();
    })
    .then((text) => parseCSVText(text, folderKey));
}

function parseCSVText(text, folderKey) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    console.warn("CSV vuoto o solo header per", folderKey);
    return [];
  }

  const headerLine = lines[0];
  const delimiter = headerLine.includes(";") ? ";" : ",";
  const headers = headerLine.split(delimiter).map((h) => h.trim());

  const idxImmagine = headers.indexOf("Immagine");
  const idxCategoria = headers.indexOf("Categoria");
  const idxRisposta = headers.indexOf("RispostaCorretta");

  if (idxImmagine === -1 || idxCategoria === -1 || idxRisposta === -1) {
    alert(
      "Le intestazioni del CSV " +
        folderKey +
        " non corrispondono. Devono esserci le colonne: Immagine; Categoria; RispostaCorretta"
    );
    return [];
  }

  const arr = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(delimiter).map((p) => p.trim());
    const img = parts[idxImmagine];
    const cat = parts[idxCategoria];
    const corr = parts[idxRisposta];

    if (!img) continue;

    arr.push({
      image: img,
      category: cat,
      correct: corr ? corr.toUpperCase() : "",
      folder: folderKey // "images1" o "images2"
    });
  }

  return arr;
}

// images3 = copia di images1 ma con RispostaCorretta invertita (A <-> L)
function createImages3FromImages1(images1Array) {
  return images1Array.map((stim) => {
    let flipped = stim.correct;
    if (stim.correct === "A") flipped = "L";
    else if (stim.correct === "L") flipped = "A";

    return {
      image: stim.image,
      category: stim.category,
      correct: flipped,
      folder: "images1"
    };
  });
}

// ==========================
// SCHERMATA INIZIALE
// ==========================

function handleStart() {
  const input = document.getElementById("phone-last3");
  const error = document.getElementById("start-error");

  if (!input || !error) return;

  const value = input.value.trim();

  // controllo che siano esattamente 3 cifre numeriche
  if (!/^[0-9]{3}$/.test(value)) {
    error.textContent = "Inserisci esattamente 3 cifre numeriche.";
    return;
  }

  IAT_STATE.phoneLast3 = value;
  error.textContent = "";

  console.log("Numero soggetto:", IAT_STATE.phoneLast3);

  // rimuovo la schermata iniziale
  const startScreen = document.getElementById("start-screen");
  if (startScreen) startScreen.remove();

  // inizializzo progress bar
  updateProgress(0, IAT_STATE.totalTrialsCount || 110);

  // parto dal blocco 1 (indice 0)
  IAT_STATE.currentBlockIndex = 0;
  showInstructionScreen();
}

// ==========================
// SCHERMATE ISTRUZIONI
// ==========================

function showInstructionScreen() {
  hideAllScreens();

  const instrScreen = document.getElementById("instruction-screen");
  const instrText = document.getElementById("instruction-text");
  const nextBtn = document.getElementById("next-instruction");
  const timerEl = document.getElementById("instruction-timer");

  if (!instrScreen || !instrText || !nextBtn) return;

  const blockIdx = IAT_STATE.currentBlockIndex;
  const blockNumber = blockIdx + 1;

  const html = IAT_CONFIG.instructionsHtml[blockNumber] ||
    `<p>Istruzioni per il blocco ${blockNumber}</p>`;
  instrText.innerHTML = html;
  instrScreen.classList.remove("hidden");

  // se c'era un vecchio countdown, lo puliamo
  if (IAT_STATE.instrTimerIntervalId !== null) {
    clearInterval(IAT_STATE.instrTimerIntervalId);
    IAT_STATE.instrTimerIntervalId = null;
  }
  if (timerEl) {
    timerEl.textContent = "";
  }

  // tempo minimo per le istruzioni di questo blocco (se configurato)
  const wait = IAT_CONFIG.instructionMinTimes[blockNumber];

  if (wait) {
    IAT_STATE.canLeaveInstructions = false;
    nextBtn.disabled = true;
    nextBtn.style.opacity = 0.5;

    const endTime = Date.now() + wait;

    const updateTimer = () => {
      const remainingMs = endTime - Date.now();
      if (remainingMs <= 0) {
        // tempo scaduto
        if (timerEl) {
          timerEl.textContent = "Ora puoi iniziare (premi Invio o Continua).";
        }
        IAT_STATE.canLeaveInstructions = true;
        nextBtn.disabled = false;
        nextBtn.style.opacity = 1;

        if (IAT_STATE.instrTimerIntervalId !== null) {
          clearInterval(IAT_STATE.instrTimerIntervalId);
          IAT_STATE.instrTimerIntervalId = null;
        }
        return;
      }

      const sec = Math.ceil(remainingMs / 1000);
      if (timerEl) {
        timerEl.textContent = `Potrai iniziare tra ${sec} secondi...`;
      }
    };

    // aggiorna subito e poi ogni 250 ms
    updateTimer();
    IAT_STATE.instrTimerIntervalId = setInterval(updateTimer, 250);

  } else {
    // nessun vincolo di tempo per questo blocco
    IAT_STATE.canLeaveInstructions = true;
    nextBtn.disabled = false;
    nextBtn.style.opacity = 1;
    if (timerEl) {
      timerEl.textContent = "";
    }
  }

  document.addEventListener("keydown", handleInstructionKey);
}

function handleInstructionContinue() {
  if (!IAT_STATE.canLeaveInstructions) return;

  document.removeEventListener("keydown", handleInstructionKey);

  // cancella eventuale countdown
  if (IAT_STATE.instrTimerIntervalId !== null) {
    clearInterval(IAT_STATE.instrTimerIntervalId);
    IAT_STATE.instrTimerIntervalId = null;
  }
  const timerEl = document.getElementById("instruction-timer");
  if (timerEl) {
    timerEl.textContent = "";
  }

  IAT_STATE.currentTrialIndex = 0;
  startBlockTrials();
}


function handleInstructionKey(e) {
  if (e.key === "Enter") {
    handleInstructionContinue();
  }
}

// ==========================
// GESTIONE TRIAL PER BLOCCHI
// ==========================

function startBlockTrials() {
  hideAllScreens();

  const blockTrials = getCurrentBlockTrials();
  if (!blockTrials.length) {
    console.warn("Nessun trial nel blocco", IAT_STATE.currentBlockIndex + 1);
    goToNextBlockOrEnd();
    return;
  }

  console.log(
    "Inizio blocco",
    IAT_STATE.currentBlockIndex + 1,
    "Trial nel blocco:",
    blockTrials.length
  );

  // listener per A/L
  document.addEventListener("keydown", handleTrialKey);

  showNextTrial();
}

function getCurrentBlockTrials() {
  return IAT_STATE.blocks[IAT_STATE.currentBlockIndex] || [];
}

function showNextTrial() {
  const blockTrials = getCurrentBlockTrials();

  if (IAT_STATE.currentTrialIndex >= blockTrials.length) {
    // blocco finito
    endCurrentBlock();
    return;
  }

  const trial = blockTrials[IAT_STATE.currentTrialIndex];

  console.log(
    "Blocco",
    trial.block,
    "- trial",
    IAT_STATE.currentTrialIndex + 1,
    "/",
    blockTrials.length,
    "-",
    trial.image
  );

  hideAllScreens();

  const trialScreen = document.getElementById("trial-screen");
  const imgElement = document.getElementById("stimulus-image");
  const catLabel = document.getElementById("category-label");

  if (!trialScreen || !imgElement || !catLabel) return;

  // Aggiorna barra di avanzamento globale
  updateProgress(
    IAT_STATE.completedTrials,
    IAT_STATE.totalTrialsCount || 110
  );

  // Etichetta fissa per blocco (se definita), altrimenti categoria
  const label = IAT_CONFIG.blockLabels[trial.block];
  catLabel.textContent = label || (trial.category || "");

  // NASCONDE l'immagine prima di cambiare src
  imgElement.style.visibility = "hidden";

  // Se c'è un timeout di nascondimento precedente, lo annullo
  if (IAT_STATE.hideTimeoutId !== null) {
    clearTimeout(IAT_STATE.hideTimeoutId);
    IAT_STATE.hideTimeoutId = null;
  }

  // Quando la nuova immagine è caricata
  imgElement.onload = () => {
    IAT_STATE.trialStartTime = performance.now();
    imgElement.style.visibility = "visible";

    IAT_STATE.hideTimeoutId = setTimeout(() => {
      imgElement.style.visibility = "hidden"; // nasconde ma non comprime layout
      IAT_STATE.hideTimeoutId = null;
    }, IAT_CONFIG.stimDurationMs);
  };

  // Path cartella corretto
  const folderKey = trial.folder; // "images1" o "images2"
  const basePath = IAT_CONFIG.stimFolders[folderKey] || "";
  imgElement.src = basePath + trial.image;

  trialScreen.classList.remove("hidden");
}

// Gestione pressione tasti A / L
function handleTrialKey(e) {
  const key = e.key.toLowerCase();

  if (key !== "a" && key !== "l") {
    return;
  }

  if (IAT_STATE.trialStartTime === null) {
    console.warn("trialStartTime è null, ma è stato premuto", key);
    return;
  }

  const rt = Math.round(performance.now() - IAT_STATE.trialStartTime);
  const blockTrials = getCurrentBlockTrials();
  const trial = blockTrials[IAT_STATE.currentTrialIndex];

  const rispostaData = key.toUpperCase();
  const rispostaCorretta = trial.correct || "";
  const corretto = rispostaData === rispostaCorretta ? 1 : 0;

  console.log(
    "Blocco",
    trial.block,
    "| Risposta:",
    rispostaData,
    "Corretta:",
    rispostaCorretta,
    "RT:",
    rt,
    "ms",
    "Corretto? ",
    corretto
  );

  // Incrementa contatore globale di trial completati
  IAT_STATE.completedTrials++;

  // Salva SOLO se il blocco è tra quelli da salvare
  if (IAT_CONFIG.savedBlocks.has(trial.block)) {
    IAT_STATE.results.push({
      numero_telefono: IAT_STATE.phoneLast3,
      immagine: trial.image,
      tipo_immagine: trial.category,
      risposta_data: rispostaData,
      risposta_corretta: rispostaCorretta,
      correttezza: corretto,
      rt_ms: rt,
      blocco: trial.block
    });
  }

  IAT_STATE.currentTrialIndex++;
  IAT_STATE.trialStartTime = null;

  showNextTrial();
}

function endCurrentBlock() {
  console.log("Fine blocco", IAT_STATE.currentBlockIndex + 1);

  document.removeEventListener("keydown", handleTrialKey);

  // passa al blocco successivo o a fine esperimento
  goToNextBlockOrEnd();
}

function goToNextBlockOrEnd() {
  IAT_STATE.currentBlockIndex++;

  if (IAT_STATE.currentBlockIndex >= IAT_STATE.blocks.length) {
    endExperiment();
  } else {
    showInstructionScreen();
  }
}

// ==========================
// FINE ESPERIMENTO
// ==========================

function endExperiment() {
  hideAllScreens();

  const endScreen = document.getElementById("end-screen");
  if (endScreen) {
    endScreen.classList.remove("hidden");
  }

  console.log(
    "Esperimento finito. Trial salvati (blocchi configurati):",
    IAT_STATE.results.length
  );

  // porta progress bar al 100%
  updateProgress(
    IAT_STATE.totalTrialsCount,
    IAT_STATE.totalTrialsCount || 110
  );

  downloadResultsCSV();
}

// ==========================
// UTILITY
// ==========================

function hideAllScreens() {
  const ids = ["instruction-screen", "trial-screen", "end-screen"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.classList.contains("hidden")) {
      el.classList.add("hidden");
    }
  });
}

// Barra di avanzamento globale
function updateProgress(current, total) {
  const track = document.getElementById("progress-track");
  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");

  if (!track || !fill || !text || !total) return;

  const completed = Math.min(current, total);
  const percent = Math.round((completed / total) * 100);

  fill.style.width = percent + "%";
  text.textContent = `Progresso: ${percent}%`;
}

// Genera e scarica il CSV con SOLO i blocchi configurati (3 e 5 ora)
function downloadResultsCSV() {
  if (!IAT_STATE.results.length) return;

  const sep = ";";

  const headers = [
    "Numero_telefono",
    "Immagine",
    "Tipo_immagine",
    "Risposta_data",
    "RispostaCorretta",
    "Correttezza",
    "RT_ms",
    "Blocco"
  ];

  const rows = IAT_STATE.results.map((r) => [
    r.numero_telefono,
    r.immagine,
    r.tipo_immagine,
    r.risposta_data,
    r.risposta_corretta,
    r.correttezza,
    r.rt_ms,
    r.blocco
  ]);

  let csvContent = headers.join(sep) + "\n";
  rows.forEach((row) => {
    csvContent += row.join(sep) + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const filename = `IAT_risultati_${IAT_STATE.phoneLast3}.csv`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
