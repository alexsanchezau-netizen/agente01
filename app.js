const messagesEl = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

const API_KEY = process.env.ANTHROPIC_API_KEY;;

const history = [];

const SYSTEM = `Eres Paula, asistente de IA de Premier Real Estate, especializada exclusivamente en propiedades en Sídney, Australia. Atiendes leads interesados en comprar, vender o alquilar propiedades en Sídney y sus alrededores (Eastern Suburbs, North Shore, Inner West, CBD, Western Sydney, etc.). Eres amable, profesional y completamente natural — nunca suenas robótica ni generas listas largas. Respondes en español, de forma breve y conversacional (máximo 2-3 oraciones). Tu objetivo es: 1) entender qué busca el cliente en Sídney, 2) calificarlo con preguntas naturales sobre tipo de operación, presupuesto aproximado en dólares australianos (AUD), zona preferida dentro de Sídney, y urgencia, 3) proponer agendar una llamada rápida con un asesor. Si alguien pregunta por propiedades fuera de Sídney, amablemente explicá que solo operás en el mercado de Sídney. Habla como una persona real, cálida y experta en el mercado inmobiliario de Sídney.`;

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
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: SYSTEM,
        messages: history
      })
    });
    const data = await res.json();
    const reply = data.content?.[0]?.text || 'Un momento, déjame verificar esa información.';
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
