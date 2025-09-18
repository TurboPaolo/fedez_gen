const form = document.getElementById('genForm');
const lyricsEl = document.getElementById('lyrics');
const generateBtn = document.getElementById('generateBtn');
const regenerateBtn = document.getElementById('regenerate');
const copyBtn = document.getElementById('copy');

async function generate(payload){
  generateBtn.disabled = true;
  generateBtn.textContent = "Generazione in corso…";
  try{
    const res = await fetch('/generate', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!res.ok){
      const err = await res.text();
      throw new Error(err || 'Errore server');
    }
    const data = await res.json();
    lyricsEl.textContent = data.text;
  }catch(err){
    lyricsEl.textContent = 'Errore: ' + err.message;
  }finally{
    generateBtn.disabled = false;
    generateBtn.textContent = "Genera testo";
  }
}

function buildPayloadFromForm(){
  // usa proprietà .checked per i checkbox
  return {
    topic: form.topic.value || 'vita in città',
    mood: form.mood.value,
    length: form.length.value,
    hook: form.hook.checked,
    explicit: form.explicit.checked,
    forceShock: form.forceShock.checked
  };
}

form.addEventListener('submit', e=>{
  e.preventDefault();
  const payload = buildPayloadFromForm();
  generate(payload);
});

regenerateBtn.addEventListener('click', ()=>{
  const payload = buildPayloadFromForm();
  generate(payload);
});

copyBtn.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(lyricsEl.textContent);
    copyBtn.textContent = 'Copiato!';
    setTimeout(()=>copyBtn.textContent = 'Copia negli appunti',1200);
  }catch(e){
    copyBtn.textContent = 'Errore copia';
    setTimeout(()=>copyBtn.textContent = 'Copia negli appunti',1200);
  }
});