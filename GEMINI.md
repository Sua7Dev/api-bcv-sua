# Contexto del Proyecto: API SUA-BCV

Este archivo contiene las instrucciones críticas para el desarrollo y mantenimiento de este repositorio. Gemini debe seguir estas directrices en cada interacción.

## 1. Objetivo de Transformación
- **De EsJs a JavaScript:** El proyecto base es un fork escrito en EsJs. El objetivo principal es migrar toda la lógica, sintaxis y extensiones de archivo a JavaScript estándar (Node.js/ESModules).
- **Runtime:** Se utiliza **Bun** exclusivamente. No usar `npm` ni `yarn`.

## 2. Stack Tecnológico y Comandos
- **Runtime & Package Manager:** Bun (`bun install`, `bun dev`, `bun add`).
- **Despliegue:** Vercel (Configurado para manejar funciones serverless con el runtime de Bun).
- **Base de Datos/Entorno:** Analizar siempre el archivo `.env`.

## 3. Estructura de Endpoints
Todas las rutas de la API deben seguir estrictamente el siguiente formato:
- `https://api-sua-bcv/v1/:moneda`
- Ejemplo: `https://api-sua-bcv/v1/usd` o `https://api-sua-bcv/v1/eur`.

## 4. Tareas Obligatorias por Prompt
Cada vez que realices un cambio en la lógica, archivos o dependencias, debes:
1. **Analizar el `.env`:** Identificar qué variables faltan, explicar para qué sirven y de dónde obtener las credenciales (ej. scrapers, providers de divisas, etc.).
2. **Actualizar README.md:** Mantener la documentación al día. El README debe reflejar los cambios en los endpoints, las nuevas dependencias instaladas y cualquier ajuste en el flujo de despliegue.

## 5. Instrucciones de Código
- Priorizar el uso de `fetch` nativo de Bun.
- Usar sintaxis de módulos de ES (import/export).
- Mantener el código optimizado para el despliegue en Vercel Edge Functions o Serverless Functions.