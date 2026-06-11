# Deployar el Worker del Chatbot

## Pasos (5 minutos)

### 1. Crear el Worker en Cloudflare

1. Entrá a [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Compute → Workers & Pages → + Create**
3. Elegí **Workers → Hello World**
4. Nombre: `genesis-chat`
5. Click **Deploy** (con el código por defecto, ya lo reemplazás en el paso 2)

### 2. Pegar el código

1. En el Worker recién creado → **Edit code**
2. Borrá todo el contenido y pegá el código de `worker.js`
3. Click **Deploy**

### 3. Agregar la API Key como Secret

1. En el Worker → **Settings → Variables and Secrets**
2. Click **+ Add**
3. **Type:** `Secret`
4. **Variable name:** `GROQ_API_KEY`
5. **Value:** tu API key de Groq (la misma que usaste en el test)
6. Click **Deploy**

### 4. Copiar la URL del Worker

En el dashboard del Worker vas a ver la URL pública, algo como:

```
https://genesis-chat.smrcartes.workers.dev
```

Copiala — la necesitamos para configurar el widget en el sitio principal.

---

## Variables opcionales

| Nombre | Default | Uso |
|--------|---------|-----|
| `GROQ_API_KEY` | (obligatorio) | Tu key de Groq |
| `MODEL` | `llama-3.3-70b-versatile` | Modelo a usar |
| `ALLOWED_ORIGIN` | `https://genesis.com.py` | Origen permitido (CORS) |

---

## Probar que funciona

Desde la terminal:

```bash
curl -X POST https://genesis-chat.smrcartes.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hola"}]}'
```

Debería responder algo como:
```json
{"reply":"¡Hola! ¿En qué te ayudo?"}
```
