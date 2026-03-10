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
- `VITE_GITHUB_TOKEN`: Acceso a GitHub API para crons.
- `VITE_AXIOM_TOKEN`, `VITE_AXIOM_ORG_ID`, `VITE_AXIOM_DATASET`: Credenciales de Axiom.
- `VITE_DATABASE_URL`, `VITE_DATABASE_AUTH_TOKEN`: (Opcional) Para sincronización externa.

### Comandos
- `bun dev`: Inicia el servidor de desarrollo.
- `bun run build`: Compila la API y la documentación.
- `bun run cron:run`: Ejecuta los scrapers manuales.

## 📝 Notas de Versión
- Graduación de EsJs a JavaScript estándar (ESModules).
- Eliminación de dependencias de EsJs (`esjs-loader`, `@es-js/*`).
- Integración nativa con Axiom usando `fetch` de Bun.
- Optimizado para Vercel Edge.
