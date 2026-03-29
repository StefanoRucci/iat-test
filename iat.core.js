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
  participantCode: "",
  runId: null,
  trialStartTime: null,
  hideTimeoutId: null,      // id del setTimeout che nasconde l'immagine
  trialHasError: false,     // true se il partecipante ha sbagliato nel trial corrente
  results: [],              // solo blocchi configurati in savedBlocks
  canLeaveInstructions: false,
  instrTimerIntervalId: null,   // intervallo per il countdown istruzioni
  canStartPreScreen: false,
  prestartTimerIntervalId: null,
  startTimestamp: null,
  endTimestamp: null, 
  sessionSummary: null,
};

// ==========================
// INIZIALIZZAZIONE
// ==========================

document.addEventListener("DOMContentLoaded", () => {
  console.log("Pagina caricata, inizializzo...");

  const mother = document.getElementById("mother-code");
  const father = document.getElementById("father-code");
  const day = document.getElementById("birth-day");

  if (father) father.disabled = true;
  if (day) day.disabled = true;

  function autoAdvance(current, next, isLetter = true) {
    if (!current) return;

    current.addEventListener("input", () => {
      let val = current.value;

      if (isLetter) {
        val = val.replace(/[^a-zA-Z]/g, "").toUpperCase();
      } else {
        val = val.replace(/[^0-9]/g, "");
      }

      current.value = val;

      if (val.length === 2 && next) {
        next.disabled = false;
        next.focus();
      }
    });
  }

  autoAdvance(mother, father, true);
  autoAdvance(father, day, true);
  autoAdvance(day, null, false);

  function validateCodeFields() {
    const error = document.getElementById("start-error");

    const m = mother.value.trim().toUpperCase();
    const f = father.value.trim().toUpperCase();
    const d = day.value.trim();

    mother.classList.remove("valid", "invalid");
    father.classList.remove("valid", "invalid");
    day.classList.remove("valid", "invalid");

    let message = "";
    let isError = false;
    let allValid = true;

    // --- MADRE ---
    if (m.length === 0) {
      allValid = false;
    } 
    else if (m.length < 2) {
      message = "Inserisci 2 lettere (es. MA).";
      allValid = false;
    }
    else if (!/^[A-Z]{2}$/.test(m)) {
      mother.classList.add("invalid");
      message = "Solo lettere A-Z.";
      isError = true;
      allValid = false;
    }
    else {
      mother.classList.add("valid");
    }

    // --- PADRE ---
    if (!message) {
      if (f.length === 0) {
        allValid = false;
      }
      else if (f.length < 2) {
        message = "Inserisci 2 lettere (es. PA).";
        allValid = false;
      }
      else if (!/^[A-Z]{2}$/.test(f)) {
        father.classList.add("invalid");
        message = "Solo lettere A-Z.";
        isError = true;
        allValid = false;
      }
      else {
        father.classList.add("valid");
      }
    } else {
      allValid = false;
    }

    // --- GIORNO ---
    if (!message) {
      if (d.length === 0) {
        allValid = false;
      }
      else if (d.length < 2) {
        message = "Inserisci 2 cifre (es. 04).";
        allValid = false;
      }
      else {
        const dayNum = parseInt(d, 10);
        if (!/^[0-9]{2}$/.test(d) || dayNum < 1 || dayNum > 31) {
          day.classList.add("invalid");
          message = "Il giorno deve essere tra 01 e 31.";
          isError = true;
          allValid = false;
        } else {
          day.classList.add("valid");
        }
      }
    } else {
      allValid = false;
    }

    // aggiorna bottone
    const startButtonEl = document.getElementById("start-button");
    if (startButtonEl) startButtonEl.disabled = !allValid;

    // mostra hint o errore
    if (error) {
      error.textContent = message;
      error.className = isError ? "error-text" : "hint";
    }
  }

  mother.addEventListener("input", validateCodeFields);
  father.addEventListener("input", validateCodeFields);
  day.addEventListener("input", validateCodeFields);

  const prestartBtn = document.getElementById("prestart-button");
  if (prestartBtn) {
    prestartBtn.addEventListener("click", handlePrestartContinue);
  }

  const startButton = document.getElementById("start-button");
  if (startButton) {
    startButton.addEventListener("click", handleStart);
    startButton.disabled = true;
  }

  // ENTER per avanzare nella schermata codice
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    const startScreen = document.getElementById("start-screen");
    if (!startScreen || startScreen.classList.contains("hidden")) return;

    const startButton = document.getElementById("start-button");
    if (startButton && !startButton.disabled) {
      e.preventDefault();
      handleStart();
    }
  });

  const nextInstrButton = document.getElementById("next-instruction");
  if (nextInstrButton) {
    nextInstrButton.addEventListener("click", handleInstructionContinue);
  }

  // Carica gli stimoli di base (images1 e images2)
  loadAllStimuli();

  // Mostra la schermata iniziale prima del telefono
  showPrestartScreen();
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

            // Preload di tutte le immagini usate nel test
      const allTrials = blocks.flat();

      preloadImages(allTrials).then((res) => {
        const ok = res.filter(r => r.ok).length;
        const fail = res.length - ok;
        console.log(
          `Preload immagini completato: OK=${ok}, FAIL=${fail}`
        );
      });

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

function showPrestartScreen() {
  hideAllScreens();

  const pre = document.getElementById("prestart-screen");
  const btn = document.getElementById("prestart-button");
  const timerEl = document.getElementById("prestart-timer");
  const startScreen = document.getElementById("start-screen");

  const textEl = document.getElementById("prestart-text");
  if (textEl && IAT_CONFIG.prestartHtml) {
    textEl.innerHTML = IAT_CONFIG.prestartHtml;
  }

  if (startScreen) startScreen.classList.add("hidden");
  if (!pre || !btn) return;

  pre.classList.remove("hidden");

  // reset timer/flag
  IAT_STATE.canStartPreScreen = false;
  btn.disabled = true;

  if (timerEl) timerEl.textContent = "";

  if (IAT_STATE.prestartTimerIntervalId !== null) {
    clearInterval(IAT_STATE.prestartTimerIntervalId);
    IAT_STATE.prestartTimerIntervalId = null;
  }

  const waitMs = IAT_CONFIG.debugMode ? 0 : 30000; // 30 secondi fissi
  const endTime = Date.now() + waitMs;

  const tick = () => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      IAT_STATE.canStartPreScreen = true;
      btn.disabled = false;
      if (timerEl) timerEl.textContent = "Ora può iniziare (premi Invio o clicca Inizia).";

      clearInterval(IAT_STATE.prestartTimerIntervalId);
      IAT_STATE.prestartTimerIntervalId = null;
      return;
    }

    const sec = Math.ceil(remaining / 1000);
    if (timerEl) timerEl.textContent = `Potrà iniziare tra ${sec} secondi...`;
  };

  tick();
  IAT_STATE.prestartTimerIntervalId = setInterval(tick, 250);

  document.addEventListener("keydown", handlePrestartKey);
}

function handlePrestartKey(e) {
  if (e.key === "Enter") {
    handlePrestartContinue();
  }
}

function handlePrestartContinue() {
  if (!IAT_STATE.canStartPreScreen) return;

  document.removeEventListener("keydown", handlePrestartKey);

  if (IAT_STATE.prestartTimerIntervalId !== null) {
    clearInterval(IAT_STATE.prestartTimerIntervalId);
    IAT_STATE.prestartTimerIntervalId = null;
  }

  const pre = document.getElementById("prestart-screen");
  const startScreen = document.getElementById("start-screen");

  const codeInstruction = document.getElementById("code-instruction");

  // 🔹 Inserimento dinamico testo istruzioni codice
  if (codeInstruction && IAT_CONFIG.participantCodeInstructionsHtml) {
    codeInstruction.innerHTML =
      IAT_CONFIG.participantCodeInstructionsHtml;
  }

  if (pre) pre.classList.add("hidden");
  if (startScreen) startScreen.classList.remove("hidden");

  // 🔹 autofocus sul primo campo
  const mother = document.getElementById("mother-code");
  if (mother) mother.focus();
}


function handleStart() {
  const mother = document.getElementById("mother-code");
  const father = document.getElementById("father-code");
  const day = document.getElementById("birth-day");
  const error = document.getElementById("start-error");

  if (!mother || !father || !day || !error) return;

  const m = mother.value.trim().toUpperCase();
  const f = father.value.trim().toUpperCase();
  const d = day.value.trim();

  // Validazione lettere
  if (!/^[A-Z]{2}$/.test(m)) {
    error.textContent = "Inserisci le prime 2 lettere del nome della madre.";
    return;
  }

  if (!/^[A-Z]{2}$/.test(f)) {
    error.textContent = "Inserisci le prime 2 lettere del nome del padre.";
    return;
  }

  // Validazione giorno
  if (!/^[0-9]{2}$/.test(d)) {
    error.textContent = "Il giorno deve essere composto da 2 cifre (es. 07).";
    return;
  }

  const dayNum = parseInt(d, 10);
  if (dayNum < 1 || dayNum > 31) {
    error.textContent = "Il giorno deve essere compreso tra 01 e 31.";
    return;
  }

  const code = m + f + d;
  IAT_STATE.participantCode = code;
  IAT_STATE.runId = crypto.randomUUID();
  IAT_STATE.startTimestamp = Date.now();

  error.textContent = "";

  const startScreen = document.getElementById("start-screen");
  if (startScreen) startScreen.remove();

  updateProgress(0, IAT_STATE.totalTrialsCount || 110);

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
  const wait = IAT_CONFIG.debugMode ? 0 : IAT_CONFIG.instructionMinTimes[blockNumber];

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
          timerEl.textContent = "Ora può iniziare (premi Invio o Continua).";
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
        timerEl.textContent = `Potrà iniziare tra ${sec} secondi...`;
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
  //const catLabel = document.getElementById("category-label");
  const leftEl = document.getElementById("category-left");
  const rightEl = document.getElementById("category-right");

  if (!trialScreen || !imgElement || !leftEl || !rightEl) return;

  // Aggiorna barra di avanzamento globale
  updateProgress(
    IAT_STATE.completedTrials,
    IAT_STATE.totalTrialsCount || 110
  );

  // Etichetta fissa per blocco (se definita), altrimenti categoria
  const label = IAT_CONFIG.blockLabels[trial.block] || "";
  // Atteso formato tipo: "Conflitto = A    Neutre = L"
  const parts = label.split(/\s{2,}|\t+/); // spezza su spazi multipli o tab
  const left = parts[0] || "";
  const right = parts[1] || "";

  if (leftEl) leftEl.innerHTML = left;
  if (rightEl) rightEl.innerHTML = right;

  const isLongBlock = (trial.block === 3 || trial.block === 5);
  [leftEl, rightEl].forEach((el) => {
    if (!el) return;
    el.classList.toggle("compact", isLongBlock);
    el.classList.toggle("centered", isLongBlock);
  });

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

    // IAT_STATE.hideTimeoutId = setTimeout(() => {
    //   imgElement.style.visibility = "hidden"; // nasconde ma non comprime layout
    //   IAT_STATE.hideTimeoutId = null;
    // }, IAT_CONFIG.stimDurationMs);
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

  const blockTrials = getCurrentBlockTrials();
  const trial = blockTrials[IAT_STATE.currentTrialIndex];
  const rispostaCorretta = trial.correct || "";

  // Risposta errata: mostra X e aspetta il tasto corretto
  if (key.toUpperCase() !== rispostaCorretta) {
    IAT_STATE.trialHasError = true;
    const feedback = document.getElementById("error-feedback");
    if (feedback) feedback.classList.remove("hidden");
    return;
  }

  const rt = Math.round(performance.now() - IAT_STATE.trialStartTime);
  const rispostaData = key.toUpperCase();
  const corretto = IAT_STATE.trialHasError ? 0 : 1;

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
      codice_partecipante: IAT_STATE.participantCode,
      run_id: IAT_STATE.runId,
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
  IAT_STATE.trialHasError = false;

  // Nascondi immagine e feedback errore (ITI: schermo blank)
  const imgEl = document.getElementById("stimulus-image");
  const feedback = document.getElementById("error-feedback");
  if (imgEl) imgEl.style.visibility = "hidden";
  if (feedback) feedback.classList.add("hidden");

  // ITI: 250ms blank prima del trial successivo
  setTimeout(showNextTrial, 250);
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
  IAT_STATE.endTimestamp = Date.now();

  const startIso = new Date(IAT_STATE.startTimestamp).toISOString();
  const endIso = new Date(IAT_STATE.endTimestamp).toISOString();

  const durationSec = Math.round((IAT_STATE.endTimestamp - IAT_STATE.startTimestamp) / 1000);
  const durationMin = Math.round((durationSec / 60) * 100) / 100; // 2 decimali

  IAT_STATE.sessionSummary = {
    codice_partecipante: IAT_STATE.participantCode,
    run_id: IAT_STATE.runId,
    timestamp_start: startIso,
    timestamp_end: endIso,
    durata_min: durationMin,
    trials_salvati: IAT_STATE.results.length
  };

  console.log(
    "Esperimento finito. Trial salvati (blocchi configurati):",
    IAT_STATE.results.length
  );

  // porta progress bar al 100%
  updateProgress(
    IAT_STATE.totalTrialsCount,
    IAT_STATE.totalTrialsCount || 110
  );

  // Mostra schermata salvataggio
  const saving = document.getElementById("saving-screen");
  if (saving) saving.classList.remove("hidden");

  sendResultsToSheets();

}

// ==========================
// UTILITY
// ==========================

function hideAllScreens() {
  const ids = ["prestart-screen", "start-screen", "instruction-screen", "trial-screen", "saving-screen", "end-screen"];
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
function downloadTrialsCSV() {
  if (!IAT_STATE.results.length) return;

  const sep = ";";

  const headers = [
    "Codice_partecipante",
    "Run_id",
    "Immagine",
    "Tipo_immagine",
    "Risposta_data",
    "RispostaCorretta",
    "Correttezza",
    "RT_ms",
    "Blocco"
  ];

  const rows = IAT_STATE.results.map((r) => [
    r.codice_partecipante,
    r.run_id,
    r.immagine,
    r.tipo_immagine,
    r.risposta_data,
    r.risposta_corretta,
    r.correttezza,
    r.rt_ms,
    r.blocco
  ]);

  let csvContent = headers.join(sep) + "\n";
  rows.forEach((row) => (csvContent += row.join(sep) + "\n"));

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const safeRun = (IAT_STATE.runId || "run").slice(0, 8);
  a.download = `IAT_trials_${IAT_STATE.participantCode}_${safeRun}.csv`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadSessionCSV() {
  if (!IAT_STATE.sessionSummary) return;

  const sep = ";";
  const s = IAT_STATE.sessionSummary;

  const headers = [
    "Codice_partecipante",
    "Run_id",
    "Timestamp_start",
    "Timestamp_end",
    "Durata_min",
    "Trials_salvati"
  ];

  const row = [
    s.codice_partecipante,
    s.run_id,
    s.timestamp_start,
    s.timestamp_end,
    s.durata_min,
    s.trials_salvati
  ];

  let csvContent = headers.join(sep) + "\n" + row.join(sep) + "\n";

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const safeRun = (IAT_STATE.runId || "run").slice(0, 8);
  a.download = `IAT_session_${IAT_STATE.participantCode}_${safeRun}.csv`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function preloadImages(trials) {
  // Precarica in parallelo, ma evita duplicati
  const uniqueSrc = new Set();

  for (const t of trials) {
    const folder = IAT_CONFIG.stimFolders[t.folder] || "";
    uniqueSrc.add(folder + t.image);
  }

  const promises = [];
  for (const src of uniqueSrc) {
    promises.push(new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ src, ok: true });
      img.onerror = () => resolve({ src, ok: false });
      img.src = src;
    }));
  }
  return Promise.all(promises);
}

async function sendResultsToSheets() {
  const ENDPOINT_URL = IAT_CONFIG.sheetsEndpointUrl;

  const payload = {
    session: IAT_STATE.sessionSummary,
    trials: IAT_STATE.results
  };

  const savingText = document.getElementById("saving-text");
  const savingHint = document.getElementById("saving-hint");

  if (savingText) savingText.textContent = "Non chiudere questa pagina.";
  if (savingHint) savingHint.textContent = "Se la connessione è lenta, potrebbero volerci alcuni secondi.";

  try {
    const res = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    // Leggi UNA SOLA VOLTA
    const text = await res.text();

    // Debug (puoi toglierlo quando sei tranquillo)
    console.log("STATUS", res.status);
    console.log("BODY", text);

    // Parse robusto
    let data = {};
    try { data = JSON.parse(text); } catch (_) {}

    if (!res.ok || data.ok !== true) {
      if (savingText) savingText.textContent = "Errore nel salvataggio.";
      if (savingHint) savingHint.textContent = "Non chiudere la pagina. Contatta il ricercatore.";
      console.error("Sheets upload failed:", res.status, data, text);
      return;
    }

    // OK -> mostra end-screen
    hideAllScreens();
    const endScreen = document.getElementById("end-screen");
    const endText = document.getElementById("end-text");
    if (endText && IAT_CONFIG.endScreenHtml) endText.innerHTML = IAT_CONFIG.endScreenHtml;
    if (endScreen) endScreen.classList.remove("hidden");

  } catch (err) {
    if (savingText) savingText.textContent = "Errore di rete nel salvataggio.";
    if (savingHint) savingHint.textContent = "Non chiudere la pagina. Riprova o contatta il ricercatore.";
    console.error("Sheets upload error:", err);
  }
}

function showEndStatusMessage(msg) {
  // se hai un elemento sullo schermo finale, usalo; altrimenti console
  const el = document.getElementById("end-status");
  if (el) el.textContent = msg;
}