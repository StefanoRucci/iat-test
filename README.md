# IAT — Implicit Association Test

Strumento web per la somministrazione di un Implicit Association Test (IAT) basato su immagini, sviluppato nell'ambito di una ricerca sperimentale sul conflitto israeliano-palestinese.

## Descrizione

Il test misura le associazioni implicite tra immagini relative al conflitto israeliano-palestinese e valenze emotive (piacevole/spiacevole), adattando il protocollo classico di Greenwald et al. (1998) a un paradigma visivo per richiamare l'esperienza di fruizione dei social media.

## Struttura del test

Il test è composto da **5 blocchi**:

| Blocco | Compito | Dati salvati |
|--------|---------|--------------|
| 1 | Conflitto → A / Neutre → L | No |
| 2 | Spiacevoli → A / Piacevoli → L | No |
| 3 | Conflitto o Spiacevole → A / Neutre o Piacevole → L | **Sì** |
| 4 | Neutre → A / Conflitto → L | No |
| 5 | Neutre o Spiacevole → A / Conflitto o Piacevole → L | **Sì** |

Solo i blocchi 3 e 5 (combinati) vengono salvati ai fini dell'analisi.

## Caratteristiche tecniche

- Stimoli visivi ottimizzati in formato WebP
- Codice identificativo anonimo (2 lettere madre + 2 lettere padre + giorno di nascita)
- Feedback immediato sull'errore (X rossa) con obbligo di correzione
- Inter-trial interval di 250ms
- Salvataggio automatico su Google Sheets via Vercel

## Dati raccolti

Per ogni trial dei blocchi critici vengono registrati:
- Codice partecipante
- Immagine presentata e categoria
- Risposta fornita e risposta corretta
- Correttezza (1 = corretto al primo tentativo, 0 = errore)
- Tempo di risposta in ms (RT, misurato fino alla risposta corretta)
- Numero di blocco

## Requisiti per la partecipazione

- Computer con tastiera (non compatibile con dispositivi mobile)
- Connessione internet stabile
- Ambiente tranquillo, senza distrazioni
- Sessione unica senza interruzioni
