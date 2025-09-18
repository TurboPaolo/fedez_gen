// server.js
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// semplice rate-limit in memoria (demo)
const requests = new Map();
function tooMany(ip){
  const now = Date.now();
  const windowMs = 15 * 1000; // 15s window for demo
  const limit = 10;
  const entry = requests.get(ip) || [];
  const filtered = entry.filter(t => now - t < windowMs);
  filtered.push(now);
  requests.set(ip, filtered);
  return filtered.length > limit;
}

app.post('/generate', async (req, res) => {
  const ip = req.ip;
  if (tooMany(ip)) return res.status(429).send('Troppe richieste, riprova tra poco.');

  const {
    topic = 'vita in città',
    mood = 'energetic',
    length = 'medium',
    hook = true,
    explicit = false,
    forceShock = true
  } = req.body;

  const systemPrompt = `Sei un assistente creativo per generare testi rap/urban in italiano. Produci SOLO testi originali. Non imitare esattamente la voce o riprodurre testi esistenti di alcun artista. Mantieni il testo coerente, con rime, ritmo, e un hook se richiesto. Usa linguaggio esplicito solo se esplicitamente permesso.`;

  // se l'utente ha attivato il toggle, imponi regole vincolanti nel prompt
  const additionalRules = forceShock ? `
REGOLE OBBLIGATORIE (DA RISPETTARE):
1) Inserisci sempre almeno UN riferimento a un personaggio famoso (cantante, politico, influencer, calciatore...). Il riferimento deve essere chiaro ma NON offensivo.
2) Almeno una rima deve essere una "rima shock": una punchline sorprendente, ironica o molto forte che colpisca il lettore.
3) Il testo deve restare ORIGINALE: non ripetere frasi o rime tratte da brani esistenti.

SEGUI QUESTE REGOLE IN MODO FORTE: ASSICURATI CHE SIANO PRESENTI NEL TESTO GENERATO.
  ` : '';

  const userPrompt = `
Crea un testo rap in italiano ispirato alle caratteristiche generali dello stile di Fedez: frasi dirette, hook orecchiabile, uso di riferimenti urbani e ironia. 
Parametri:
- Argomento: ${topic}
- Mood: ${mood}
- Lunghezza: ${length}
- Includi hook: ${hook}
- Linguaggio esplicito consentito: ${explicit}

${additionalRules}

Istruzioni:
- Genera strofe e un hook (se richiesto).
- Mantieni il testo originale, non usare frasi o rime prese da brani esistenti.
- Fornisci una struttura chiara (es. Strofa 1 / Hook / Strofa 2 / Hook / Outro).
- Rispondi in italiano.
- Non aggiungere spiegazioni extra: SOLO il testo.
  `;

  try{
    const apiKey = process.env.OPENAI_API_KEY;
    if(!apiKey) return res.status(500).send('Server non configurato: mancante OPENAI_API_KEY');

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 700,
        temperature: 0.8
      })
    });

    if(!openaiRes.ok){
      const errTxt = await openaiRes.text();
      console.error('OpenAI error', errTxt);
      return res.status(502).send('Errore generazione: ' + errTxt);
    }

    const payload = await openaiRes.json();
    const text = payload?.choices?.[0]?.message?.content || 'Nessun testo restituito.';

    res.json({ text });

  }catch(err){
    console.error(err);
    res.status(500).send('Errore interno server: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server avviato su http://localhost:${PORT}`));