# Hakanai Petals

Blog statico poetico, accessibile e pronto per Cloudflare Pages.

## Struttura

- `index.html`: homepage principale pubblicabile.
- `blog.html`: indice delle sezioni del blog.
- `about.html`: profilo autore con ritratto.
- `contact.html`: pagina contatti.
- `styles.css`: stile responsive e accessibile.
- `music.js`: ambienti sonori originali generati dal browser, diversi per pagina.
- `sito.html`: vecchio ingresso che rimanda alla homepage.
- `posts/`: pagine statiche per sezioni e articoli.
- `immagini /`: asset visuali usati come riferimento grafico e favicon. Attenzione: il nome cartella contiene uno spazio finale.
- `autore/`: foto autore usata nella sezione About.

## Deploy su Cloudflare Pages

1. Crea un repository GitHub e carica questi file.
2. Accedi a Cloudflare, apri **Workers & Pages** e scegli **Create application**.
3. Seleziona **Pages** e collega il repository.
4. Imposta:
   - Build command: lascia vuoto.
   - Build output directory: `/`.
5. Pubblica il progetto.

Cloudflare generera' un URL gratuito simile a `hakanai-petals.pages.dev`.

## Aggiungere un articolo

Duplica un file dentro `posts/`, cambia titolo e contenuto, poi collega la pagina dalla home o dalla sezione corretta.

## Prima del deploy finale

- Sostituisci `mailto:` in `contact.html` con l'indirizzo email reale se vuoi rendere operativo il form contatti.
- Se possibile, rinomina `immagini ` in `immagini` e aggiorna i percorsi, cosi' eviti ambiguita' dovute allo spazio finale.
- Gli ambienti sonori non partono automaticamente: l'utente deve attivarli con il pulsante, scelta migliore per accessibilita' e browser moderni.

## Checklist qualita'

- Testare navigazione da tastiera con il tasto Tab.
- Controllare layout mobile e desktop.
- Eseguire Lighthouse e puntare a 95+ in Accessibilita'.
- Validare l'HTML con W3C Validator prima della pubblicazione finale.
