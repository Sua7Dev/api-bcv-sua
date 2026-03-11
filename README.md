# API SUA-BCV 🚀

API oficial de SUA para la consulta de tipos de cambio (BCV, Paralelo, etc.) en Venezuela y otras regiones. Migrada de EsJs a JavaScript puro para máxima compatibilidad con Bun y Vercel.

## 🛠️ Stack Tecnológico
- **Runtime:** [Bun](https://bun.sh/) (Exclusivo)
- **Framework:** [Hono](https://hono.dev/)
- **Observabilidad:** [Axiom](https://axiom.co/) (Logs estructurados)
- **Base de Datos:** SQLite via `better-sqlite3`
- **Despliegue:** [Vercel](https://vercel.com/) (Edge/Serverless Functions)

## 📡 Estructura de Endpoints
Todas las rutas de la API siguen el formato:
- `https://api-sua-bcv/v1/:moneda`

### Ejemplos:
- `/v1/usd`: Cotización del Dólar (BCV y Paralelo).
- `/v1/eur`: Cotización del Euro.

## 💻 Desarrollo y Despliegue

### Requisitos
- Tener instalado **Bun**.

### Instalación
```bash
bun install
```

### Entorno (.env)
Configura las siguientes variables:
- `VITE_API_KEY`: Tu clave secreta para proteger la API (obligatoria en producción).
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Para el Rate Limiting.
- `VITE_GITHUB_TOKEN`: Acceso a GitHub API para crons.
- `VITE_AXIOM_TOKEN`, `VITE_AXIOM_ORG_ID`, `VITE_AXIOM_DATASET`: Credenciales de Axiom.

## 🚀 Despliegue en Vercel

1. **Instalar Vercel CLI** (opcional):
   ```bash
   bun add -g vercel
   ```

2. **Configurar Variables de Entorno**:
   Ve al dashboard de Vercel > Settings > Environment Variables y añade todas las variables del `.env`.

3. **Desplegar**:
   ```bash
   vercel
   ```
   O simplemente conecta tu repositorio de GitHub a Vercel. El archivo `vercel.json` ya está configurado para manejar el ruteo y las funciones.

## 🔒 Seguridad
- **Rate Limiting**: 60 peticiones por minuto por IP (vía Upstash).
- **API Key**: Las peticiones deben incluir el header `x-api-key: tu_clave_secreta`.
- **Embudo**: Procesamiento secuencial para evitar picos de CPU.

## 📝 Notas de Versión
- Migración completa de EsJs a JavaScript estándar.
- Implementación de seguridad avanzada y rate limiting.
- Optimizado para Bun Runtime y Vercel Edge Functions.
