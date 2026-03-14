# API SUA-BCV 🚀

API oficial de SUA para la consulta de tipos de cambio (BCV, Paralelo, etc.) en Venezuela. Migrada de EsJs a JavaScript puro con Edge Runtime en Vercel.

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| [Bun](https://bun.sh/) | Runtime y gestor de paquetes (exclusivo) |
| [Hono](https://hono.dev/) | Framework HTTP (Edge-compatible) |
| [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) | Despliegue en el Edge global |
| [Upstash Redis](https://upstash.com/) | Rate Limiting (60 req/min por IP) |
| [Axiom](https://axiom.co/) | Observabilidad y logs estructurados |
| [GitHub Actions](https://github.com/features/actions) | Cron jobs automáticos cada 30 minutos |

---

## 📡 Endpoints

**Base URL:** `https://api-bcv-sua.vercel.app`

> ⚠️ Todas las rutas `/v1/*` requieren el header `x-api-key: TU_CLAVE`.

### Diagnóstico

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/ping` | Health check. Devuelve `{"status":"ok"}` si la API está activa. |

### Venezuela — Cotizaciones en tiempo real

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/v1/usd` | Cotización del Dólar (BCV Oficial + Paralelo/Yadio) |
| `GET` | `/v1/eur` | Cotización del Euro (BCV Oficial + Paralelo) |
| `GET` | `/v1/cotizaciones` | Todas las cotizaciones disponibles (USD + EUR) en un solo objeto |

---

## 🔒 Seguridad

- **API Key Dinámica:** Todas las rutas `/v1/*` requieren el header `x-api-key`. Las llaves se validan contra una base de datos en **Turso**, permitiendo gestionar fechas de expiración y revocación.
- **Gestión de Claves:** Puedes generar nuevas claves usando el script CLI incluido:
  ```bash
  bun run scripts/generar-api-key.js --name "Cliente X" --days 30
  ```
- **Filtro de Fin de Semana:** La API mantiene la tasa del viernes durante el sábado y domingo para evitar discrepancias en cierre bancario.

### ⚠️ Códigos de Error de Autenticación

Todas las respuestas de error de autenticación siguen el formato:
```json
{
  "status": "error",
  "error": {
    "code": "EL_CODIGO",
    "mensaje": "Descripción...",
    "doc_url": "https://api-sua-bcv.vercel.app/docs/auth#EL_CODIGO"
  }
}
```

| Código | Status | Descripción |
|---|---|---|
| `api_key_missing` | 401 | No se proporcionó la clave en los headers. |
| `api_key_invalid` | 401 | La clave no existe o es incorrecta. |
| `api_key_expired` | 403 | La clave ha superado su fecha de vencimiento. |
| `api_key_revoked` | 403 | La clave ha sido desactivada por el administrador. |

---

## 💻 Desarrollo Local

### Requisitos
- [Bun](https://bun.sh/) instalado

### Instalación
```bash
bun install
```

### Variables de entorno (`.env`)

Copia `.env.example` a `.env` y completa:

```env
# API Key para proteger los endpoints
VITE_API_KEY="tu_clave_secreta"

# Redis para Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# GitHub — Para trigger de crons
VITE_GITHUB_TOKEN="ghp_..."

# Axiom — Observabilidad
VITE_AXIOM_TOKEN="xaat-..."
VITE_AXIOM_ORG_ID="..."
VITE_AXIOM_DATASET="..."
```

### Comandos

```bash
bun dev           # Servidor de desarrollo en localhost:5173
bun run build     # Build completo (docs + API)
bun run cron:run  # Ejecutar scrapers manualmente
```

### Prueba de la API

```bash
bun run tests/test.api.js
```

### Prueba de la API en local

#### Inicia el servidor en una terminal.

```bash
bun dev
```
#### En otra terminal ejecuta.

```bash
bun run tests/test.local.js
```

---

## 🚀 Despliegue en Vercel

1. Conecta el repositorio en [vercel.com/new](https://vercel.com/new).
2. En **Settings → Environment Variables**, añade todas las variables del `.env`.
3. Haz `git push` — Vercel despliega automáticamente.

---

## ⚙️ Automatización (GitHub Actions)

El workflow `.github/workflows/cron.yml` se ejecuta automáticamente **cada 30 minutos** para actualizar los precios desde BCV y Yadio. También puede ejecutarse manualmente desde la pestaña **Actions** de GitHub.

Requiere los siguientes **Secrets** en el repositorio:
`VITE_API_KEY`, `VITE_GITHUB_TOKEN`, `VITE_AXIOM_TOKEN`, `VITE_AXIOM_ORG_ID`, `VITE_AXIOM_DATASET`

---

## 📝 Ejemplo de Uso

```js
const respuesta = await fetch('https://api-bcv-sua.vercel.app/v1/usd', {
  headers: { 'x-api-key': 'TU_CLAVE_SECRETA' }
})
const datos = await respuesta.json()
/*
[
  {
    "fuente": "oficial",
    "nombre": "Oficial",
    "valor": 445.20,
    "fechaActualizacion": "...",
    "valorAnterior": 443.10,
    "fechaAnterior": "..."
  }
]
*/
```

---

## 📅 Lógica de Fin de Semana

Para garantizar la estabilidad en la facturación y consultas durante el cierre bancario:
- **Sábados y Domingos:** La API ignora tasas publicadas para el lunes siguiente y continúa mostrando la tasa del **viernes** como el valor actual.
- **Días Laborales:** Muestra siempre el último valor publicado.
