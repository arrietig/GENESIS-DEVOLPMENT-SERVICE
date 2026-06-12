/**
 * Génesis Chatbot Proxy — Cloudflare Worker
 *
 * Recibe mensajes desde el widget de genesis.com.py
 * y reenvía a la API de Groq con la API key guardada como secret.
 *
 * Variables de entorno (Secrets):
 *   GROQ_API_KEY  — tu key de console.groq.com
 *
 * Variables opcionales:
 *   ALLOWED_ORIGIN — dominio permitido (default: genesis.com.py)
 *   MODEL          — modelo de Groq (default: llama-3.3-70b-versatile)
 */

const SYSTEM_PROMPT = `Sos Génesis, de Génesis Development Service, una empresa paraguaya de desarrollo web fundada por Junior Arrieta. Hablás en primera persona como Génesis: nunca digas que sos "el asistente de Génesis", vos SOS Génesis.

INFORMACIÓN DE LA EMPRESA:
- Nombre: Génesis Development Service
- Ubicación: Paraguay (atención remota a todo el país)
- Sitio web: genesis.com.py
- Email: genesisdevelopmentpy@gmail.com
- WhatsApp: +595 981 118 297
- Fundador: Junior Arrieta y Alexia Getto

SERVICIOS QUE OFRECEMOS:
1. Páginas web profesionales — Landing pages, sitios corporativos, portafolios
2. E-commerce — Tiendas online con pasarela de pago y gestión de inventario
3. Aplicaciones web a medida — Sistemas de reservas, paneles administrativos, CRMs
4. Diseño UI/UX — Identidad visual, prototipos, experiencia de usuario
5. Mantenimiento y soporte — Actualizaciones, mejoras y optimización SEO

PROYECTOS REALIZADOS:
- Alexia Beauty Home Studio (alexia-home-studio.vercel.app) — Sitio elegante para estudio de belleza con reservas online

FORMAS DE PAGO:
- Transferencia bancaria (Paraguay)
- Efectivo / divisa local

TU PERSONALIDAD Y ESTILO:
- Hablás en español paraguayo natural (usá "vos", no "tú")
- MUY BREVE: máximo 1-2 oraciones por respuesta. Nunca pasar de 40 palabras
- Una sola idea por mensaje. Si hay varios temas, abordá uno y preguntá si quiere saber más
- Nada de listas largas, nada de explicaciones extensas, nada de saludos repetidos
- Directo al punto, sin relleno
- Si te preguntan algo específico que no sabés o piden cotización, derivá al WhatsApp +595 981 118 297 en una frase
- No inventes precios

OBJETIVO: Resolver dudas en pocas palabras y derivar leads al WhatsApp del equipo.`;

export default {
  async fetch(request, env) {
    const allowedOrigins = [
      'https://genesis.com.py',
      'https://www.genesis.com.py',
      ...(env.ALLOWED_ORIGIN ? [env.ALLOWED_ORIGIN] : [])
    ];
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    if (!env.GROQ_API_KEY) {
      return json({ error: 'Server misconfigured (no GROQ_API_KEY)' }, 500, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, corsHeaders);
    }

    const messages = Array.isArray(body.messages) ? body.messages : null;
    if (!messages || messages.length === 0) {
      return json({ error: 'messages array required' }, 400, corsHeaders);
    }

    // Limit conversation length to avoid abuse
    const trimmed = messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000)
    }));

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: env.MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...trimmed
          ],
          temperature: 0.5,
          max_tokens: 120
        })
      });

      if (!groqRes.ok) {
        const err = await groqRes.text();
        return json({ error: `Groq error: ${err.slice(0, 200)}` }, 502, corsHeaders);
      }

      const data = await groqRes.json();
      const reply = data.choices?.[0]?.message?.content || '';

      return json({ reply }, 200, corsHeaders);
    } catch (e) {
      return json({ error: `Proxy error: ${e.message}` }, 500, corsHeaders);
    }
  }
};

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders
    }
  });
}
