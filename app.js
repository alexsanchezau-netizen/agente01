const messagesEl = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

const API_KEY = 'TU_API_KEY_AQUI';
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbycV8bGipX61oz53FMOraxeXBRDHG_YdF-myhyMv2v7NDkAsXViKyybZfrrIQrWpVvR/exec';

const history = [];
let leadGuardado = false;

const SYSTEM = `Eres Paula, asistente de IA de Premier Real Estate, especializada exclusivamente en propiedades en Sídney, Australia. Atiendes leads interesados en comprar, vender o alquilar propiedades en Sídney y sus alrededores (Eastern Suburbs, North Shore, Inner West, CBD, Western Sydney, etc.). Eres amable, profesional y completamente natural — nunca suenas robótica ni generas listas largas. Respondes en español, de forma breve y conversacional (máximo 2-3 oraciones).

Tu objetivo es calificar al lead de forma natural recopilando esta información en el flujo de la conversación:
1) Nombre del cliente
2) Tipo de operación (comprar, vender o alquilar)
3) Zona preferida en Sídney
4) Presupuesto aproximado en AUD
5) Email o teléfono de contacto

Cuando tengas nombre + operación + zona + presupuesto + contacto, incluí al final de tu mensaje este bloque exacto sin explicarlo:
LEAD_DATA:{"nombre":"valor","email":"valor","telefono":"valor","operacion":"valor","presupuesto":"valor","zona":"valor"}

Si alguien pregunta por propiedades fuera de Sídney, amablemente explicá que solo operás en el mercado de Sídney. Habla como una persona real, cálida y experta en el mercado inmobiliario de Sídney.`;

function addMsg(role, text) {
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  if (role === 'bot') {
    div.innerHTML = `<div class="msg-avatar">P</div><div class="msg-bubble">${text}</div>`;
  } else {
    div.innerHTML = `<div class="msg-bubble">${text}</div>`;
  }
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'typing-wrap';
  div.id = 'typing-indicator';
  div.innerHTML = `<div class="msg-avatar">P</div><div class="typing"><span></span><span></span><span></span></div>`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing-indicator');
  if (t) t.remove();
}

function extractAndSaveLead(text) {
  if (leadGuardado) return text;
  const match = text.match(/LEAD_DATA:(\{.*?\})/);
  if (match) {
    try {
      const data = JSON.parse(match[1]);
      fetch(SHEETS_URL, {
        method: 'POST',
        body: JSON.stringify(data)
      }).catch(() => {});
      leadGuardado = true;
    } catch(e) {}
    return text.replace(/LEAD_DATA:\{.*?\}/, '').trim();
  }
  return text;
}


async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = '';
  sendBtn.disabled = true;
  userInput.disabled = true;
  addMsg('user', text);
  history.push({ role: 'user', content: text });
  showTyping();
  try {
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: SYSTEM,
        messages: history
      })
    });
    const data = await res.json();
    let reply = data.content?.[0]?.text || 'Un momento, déjame verificar esa información.';
    reply = extractAndSaveLead(reply);
    removeTyping();
    addMsg('bot', reply);
    history.push({ role: 'assistant', content: reply });
  } catch(e) {
    removeTyping();
    addMsg('bot', 'Hubo un problema de conexión. Por favor intenta de nuevo.');
  }
  sendBtn.disabled = false;
  userInput.disabled = false;
  userInput.focus();
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

setTimeout(() => {
  const welcome = '¡Hola! Soy Paula de Premier Real Estate 👋 ¿Estás buscando comprar, vender o alquilar una propiedad en Sídney?';
  addMsg('bot', welcome);
  history.push({ role: 'assistant', content: welcome });
}, 800);
