# Il progetto: perché esiste Cancellamy

## Perché è nato

Il GDPR dà a chiunque il diritto di chiedere la cancellazione dei propri dati (art. 17) e di opporsi al loro
trattamento (art. 21). In pratica quasi nessuno lo esercita, perché farlo a mano verso decine di soggetti è faticoso:
bisogna scoprire chi ha i tuoi dati, trovare il recapito giusto, scrivere una richiesta valida, ricordarsi la scadenza
dei 30 giorni, sollecitare e, se nessuno risponde, rivolgersi al Garante.

I servizi commerciali che automatizzano questo lavoro sono a pagamento, chiusi e in generale non pensati per il contesto
italiano (Garante, PEC, Registro Pubblico delle Opposizioni, banche dati camerali e di sales intelligence).
Cancellamy nasce per colmare questo vuoto ed è:

- **gratuito**: esercitare un diritto non dovrebbe costare un abbonamento;
- **open source** (codice AGPL-3.0, registry CC BY-SA 4.0): si può leggere cosa fa e chiunque può ospitarlo in proprio;
- **italiano**: interfaccia, testi legali, registry e documentazione sono pensati per chi vive in Italia.

## Cos'è questo repository

Questo è il **frontend**: l'applicazione web a pagina singola (React 19, TypeScript strict, Vite, Tailwind CSS 4,
TanStack Query) con cui l'utente:

- crea l'account e uno o più profili (anche per la famiglia) e firma la delega;
- sfoglia il catalogo dei broker e avvia le richieste di cancellazione e opposizione;
- segue lo stato di ogni richiesta, le scadenze, i solleciti e le risposte ricevute;
- prepara il reclamo al Garante quando un broker non risponde;
- usa le funzioni avanzate: invio dalla propria casella, dossier probatorio, "Cosa sai di me", controllo violazioni dei
  dati, deindicizzazione, difesa dal telemarketing.

Tutti i testi dell'interfaccia sono in italiano e stanno in `src/i18n/it.ts`; codice, identificatori e commenti sono in
inglese. L'app non chiama altro che l'API: nessuna CDN, font esterni o analytics.

La logica di business (invio delle richieste, scadenze, registry, cifratura dei dati) vive nel backend.

## Dove trovare il progetto

| Cosa | Dove |
|---|---|
| **Frontend** (questo repository): React, Vite, Tailwind | <https://github.com/bagleyspot/cancellamy-frontend> |
| **Backend** (API, motore delle richieste, registry, documentazione, self-hosting): NestJS, TypeScript, MongoDB | <https://github.com/bagleyspot/cancellamy-backend> |
| **Demo online** del frontend | <https://cancellamy-frontend.vercel.app/> |

La documentazione di prodotto (in italiano) è nel backend: [docs/README.md](https://github.com/bagleyspot/cancellamy-backend/blob/main/docs/README.md).
Il contratto tra frontend e backend è `docs/API-CONTRACT.md` + `docs/api-types.ts` del backend (copiato in
`src/api/types.ts`).

I due repository vanno clonati affiancati nella stessa cartella: vedi la sezione "Running against the backend" del
[README](../README.md).

> La demo online mostra l'interfaccia web. Per usare il servizio da capo a fondo serve un backend raggiungibile: si
> avvia in locale o con lo stack di self-hosting descritto nel backend (`selfhost/README.md`).

## Come partecipare

- Sviluppo: [CONTRIBUTING.md](../CONTRIBUTING.md) e [FRONTEND-NOTES.md](./FRONTEND-NOTES.md).
- Vulnerabilità: [SECURITY.md](../SECURITY.md).
- Registry dei broker (il contributo più prezioso): nel repository backend, `docs/04-registry.md`.

> Cancellamy non è uno studio legale e non fornisce consulenza legale.
