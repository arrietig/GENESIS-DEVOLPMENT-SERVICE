# 🤖 Génesis WhatsApp Bot — Guía de Setup

Stack: **n8n Cloud + WhatsApp Cloud API (Meta) + DeepSeek AI**

---

## PASO 1 — Cuenta de DeepSeek

1. Entrá a https://platform.deepseek.com
2. Registrate y creá una API Key
3. Guardá la key: `sk-xxxxxxxxxxxxxxxx`
4. Recargá créditos (muy baratos, ~$0.001 por mensaje)

---

## PASO 2 — WhatsApp Cloud API (Meta)

1. Entrá a https://developers.facebook.com
2. Creá una app → tipo **Business**
3. Agregá el producto **WhatsApp**
4. En "Getting Started" vas a ver:
   - **Phone Number ID** → guardalo
   - **Temporary Access Token** → guardalo (luego generás uno permanente)
5. En **Webhooks** → configurá:
   - URL: `https://TU-N8N.app.n8n.cloud/webhook/genesis-whatsapp`
   - Verify Token: `genesis2025` (o el que quieras, tiene que coincidir)
   - Suscribite a: `messages`

---

## PASO 3 — n8n Cloud

1. Creá cuenta en https://cloud.n8n.io (plan gratuito disponible)
2. Una vez dentro → **Import Workflow**
3. Subí el archivo `n8n-workflow.json` de esta carpeta
4. Configurá las **Variables de entorno** en n8n:
   - `WHATSAPP_PHONE_ID` → el Phone Number ID del paso 2
   - `WHATSAPP_TOKEN` → el Access Token del paso 2
5. Creá una credencial HTTP Header:
   - Header name: `Authorization`
   - Value: `Bearer sk-TU-DEEPSEEK-KEY`
   - Asignala al nodo **DeepSeek AI**
6. **Activá** el workflow (toggle ON)
7. Copiá la URL del webhook y pegala en Meta Developers

---

## PASO 4 — Probar

1. En Meta Developers → WhatsApp → Send Test Message
2. Mandá "Hola" al número de test
3. El bot debería responder en segundos con una respuesta de Génesis

---

## VARIABLES NECESARIAS

| Variable | Dónde conseguirla |
|---|---|
| `WHATSAPP_PHONE_ID` | Meta Developers → WhatsApp → Getting Started |
| `WHATSAPP_TOKEN` | Meta Developers → WhatsApp → Getting Started |
| `DEEPSEEK_API_KEY` | platform.deepseek.com → API Keys |

---

## FLUJO DEL BOT

```
Cliente escribe → WhatsApp Cloud API → n8n Webhook
       → Extraer texto del mensaje
       → DeepSeek AI (con contexto de Génesis)
       → Respuesta generada
       → WhatsApp Cloud API → Cliente recibe respuesta
```

---

## COSTOS ESTIMADOS

| Servicio | Costo |
|---|---|
| n8n Cloud | Gratis (hasta 5 workflows activos) |
| WhatsApp Cloud API | Gratis (primeras 1,000 conversaciones/mes) |
| DeepSeek AI | ~$0.001 por mensaje (~$1 cada 1,000 mensajes) |
| **TOTAL** | **Prácticamente $0 para empezar** |
