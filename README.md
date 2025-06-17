# PassInterview.AI

Un'applicazione AI avanzata per la preparazione ai colloqui di lavoro che analizza il tuo CV reale e utilizza la tua cronologia di carriera autentica per rispondere alle domande dei colloqui.

## 🚀 Funzionalità Principali

- **Analisi CV Reale**: Estrae automaticamente la cronologia lavorativa, competenze e achievements dal tuo CV
- **Assistant AI Personale**: Risponde alle domande del colloquio utilizzando la tua vera esperienza professionale
- **Supporto Multilingue**: Funziona in italiano, inglese e altre lingue
- **Riconoscimento Vocale**: Trascrivi le domande parlate in tempo reale
- **Timeline Cronologica**: Visualizza la tua carriera professionale in ordine cronologico

## 📋 Prerequisiti

- Node.js 18+ 
- Chiave API OpenAI
- Account Stripe (opzionale, per funzionalità premium)

## ⚙️ Configurazione

### 1. Clona il repository
```bash
git clone <repository-url>
cd passinterview-ai
```

### 2. Installa le dipendenze
```bash
npm install
```

### 3. Configura le variabili d'ambiente

Copia il file `.env.example` in `.env.local`:
```bash
cp .env.example .env.local
```

Modifica `.env.local` con le tue credenziali:

```env
# ⚠️ OBBLIGATORIO: Chiave API OpenAI
OPENAI_API_KEY=sk-your_openai_api_key_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_long_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# Stripe Configuration (opzionale)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# Database Configuration (se necessario)
DATABASE_URL=your_database_url_here

# Environment
NODE_ENV=development
```

### 4. Ottieni una Chiave API OpenAI

1. Vai su [OpenAI Platform](https://platform.openai.com/api-keys)
2. Crea un nuovo account o accedi
3. Naviga su "API Keys"
4. Clicca "Create new secret key"
5. Copia la chiave e incollala nel file `.env.local`

**⚠️ IMPORTANTE**: Senza la chiave API OpenAI, l'applicazione non funzionerà correttamente!

### 5. Genera un Secret per NextAuth

Genera un secret casuale per NextAuth:
```bash
openssl rand -base64 32
```

Copia il risultato nel campo `NEXTAUTH_SECRET` del file `.env.local`.

## 🏃‍♂️ Avvio dell'Applicazione

```bash
npm run dev
```

L'applicazione sarà disponibile su [http://localhost:3000](http://localhost:3000)

## 📁 Formati File Supportati

- **PDF**: File CV e documenti (.pdf)
- **Word**: Documenti Word (.docx, .doc)
- **Testo**: File di testo (.txt)

## 🔧 Risoluzione Problemi

### Errore "OpenAI API key not configured"

**Soluzione**: Assicurati di aver:
1. Creato il file `.env.local` nella root del progetto
2. Aggiunto una chiave API OpenAI valida
3. Riavviato il server di sviluppo dopo aver modificato le variabili d'ambiente

### Errore "AI service temporarily unavailable"

**Possibili cause**:
- Chiave API OpenAI mancante o non valida
- Crediti OpenAI esauriti
- Problemi di connessione di rete

**Soluzione**: Verifica le tue credenziali OpenAI e il saldo del tuo account.

### Estrazione testo da PDF fallita

**Soluzione**: 
- Assicurati che il PDF contenga testo selezionabile
- Prova a convertire il PDF in un formato più standard
- Usa un file Word (.docx) come alternativa

## 🌍 Supporto Lingue

L'applicazione supporta:
- 🇮🇹 Italiano
- 🇬🇧 Inglese  
- 🇪🇸 Spagnolo
- 🇫🇷 Francese
- 🇩🇪 Tedesco
- E altre lingue

## 📞 Supporto

Per problemi o domande:
1. Controlla prima questa guida
2. Verifica che tutte le variabili d'ambiente siano configurate correttamente
3. Consulta i log del browser/server per errori specifici

## 🔒 Sicurezza

- Non committare mai il file `.env.local` nel repository
- Mantieni le tue chiavi API private e sicure
- Rigenera le chiavi se sospetti una compromissione

## 🚀 Deploy in Produzione

Per il deploy in produzione:
1. Configura le variabili d'ambiente nella tua piattaforma di hosting
2. Aggiorna `NEXTAUTH_URL` con il tuo dominio di produzione
3. Usa chiavi API di produzione invece di quelle di test