const messagesEl = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxdM5l3i3kDjKKQmbXPBc17wYDjT1qIcYIitwlTXuOtDJXHhM6Zv5sfpsVOp_B7MLr4/exec';

const history = [];
let leadGuardado = false;

const SYSTEM = `Eres Paula, asistente de IA de Premier Real Estate, especializada en propiedades en Sídney, Australia. Eres amable, profesional y completamente natural. Respondes en español, de forma breve y conversacional (máximo 2-3 oraciones).

Tu objetivo es calificar leads recopilando: nombre, tipo de operación (comprar/vender/alquilar), zona en Sídney, presupuesto en AUD, y email o teléfono.

Cuando tengas TODOS esos datos, incluí al final de tu respuesta esta línea en formato exacto (en una sola línea, sin espacios extra):
##LEAD##nombre|email|telefono|operacion|presupuesto|zona##

Ejemplo:
##LEAD##Carlos|carlos@email.com|0412345678|alquilar|800 AUD semana|Inner West##

Si no tenés algún dato, dejá el campo vacío pero mantené los separadores.
Solo incluí el bloque ##LEAD## una vez cuando tengas todos los datos confirmados.
No menciones ni expliques el bloque ##LEAD## al usuario.`;

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
  const match = text.match(/##LEAD##(.+?)##/);
  if (match) {
    try {
      const parts = match[1].split('|');
      const data = {
        nombre: parts[0] || '',
        email: parts[1] || '',
        telefono: parts[2] || '',
        operacion: parts[3] || '',
        presupuesto: parts[4] || '',
        zona: parts[5] || ''
      };
      fetch(SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {});
      leadGuardado = true;
    } catch(e) {}
    return text.replace(/##LEAD##.+?##/, '').trim();
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
      headers: { 'Content-Type': 'application/json' },
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
