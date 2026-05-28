## Resumen del repo origen

`Moises2711/Ia_ensayos` es un fork de un proyecto Lovable construido con **exactamente el mismo stack** que este proyecto (TanStack Start, React 19, Tailwind v4, shadcn/ui, Supabase). Eso facilita mucho la portabilidad.

Contiene:

- **10 rutas** en `src/routes/` (login, register, index, ensayos, ensayo, configuracion, configuracion-ensayo, libretos, finalizado, __root) — una app en español para gestionar ensayos teatrales con teleprompter.
- **Componentes propios**: `AppShell`, `AuthShell`, `Sidebar`, `TopBar`, `AppLogo` + toda la librería `components/ui` de shadcn (ya presente aquí).
- **Integración Supabase** completa (`client.ts`, `client.server.ts`, `auth-middleware.ts`, `types.ts`) + auth Lovable Cloud.
- **7 migraciones SQL** en `supabase/migrations/` (perfiles, obras, ensayos, líneas, papelera, etc.).
- **Backend Python (FastAPI + Whisper)** en `src/teleprompter/` que el frontend consume vía `src/lib/teleprompter-api.ts` apuntando a `http://127.0.0.1:8000`.
- Logo: `src/assets/cine-estrella-logo.png`.

## Qué portar y cómo

### 1. Activar Lovable Cloud
La app depende de Supabase (auth + datos). Hay que habilitar Lovable Cloud antes de copiar nada, así se inyectan `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` y se pueden correr las migraciones. No reusaremos el proyecto Supabase original (`kyhmbmnxfexuszroufej`), se crea uno nuevo gestionado por Lovable.

### 2. Copiar el código fuente
- Reemplazar `src/routes/index.tsx` y añadir las otras 9 rutas.
- Copiar `src/components/{AppShell,AuthShell,Sidebar,TopBar,AppLogo}.tsx`.
- Copiar `src/lib/{rehearsal-data,teleprompter-api}.ts`.
- Copiar `src/assets/cine-estrella-logo.png`.
- **No** copiar `src/integrations/supabase/*` ni `src/integrations/lovable/*`: esos archivos ya los regenera Lovable Cloud al activarse (sobreescribirlos rompería la conexión nueva).
- **No** copiar `src/routeTree.gen.ts` — se autogenera.

### 3. Aplicar el esquema de base de datos
Crear una migración nueva en este proyecto consolidando las 7 migraciones del repo origen (tablas + RLS + GRANTs + triggers de perfil). Las migraciones del origen referencian usuarios del Supabase viejo, así que las adapto para que funcionen con `auth.users` del nuevo proyecto.

### 4. Backend Python — no portable
El teleprompter usa FastAPI + Whisper + grabación de audio local (WebSocket en `localhost:8000`). **No puede correr en el runtime de Cloudflare Workers** que usa este stack (sin Python, sin native binaries, sin filesystem persistente). Opciones:

- **(A) Stub temporal**: dejo `teleprompter-api.ts` apuntando a `VITE_TELEPROMPTER_API_URL` (configurable). La UI funciona pero las funciones de grabación/Whisper fallan hasta que tú levantes el backend Python en otro lado (Render/Fly/tu PC) y configures la URL.
- **(B) Reescribir en TypeScript** dentro de server functions, usando un servicio externo de speech-to-text (OpenAI Whisper API / Lovable AI Gateway). Trabajo grande, no trivial.

Propongo **(A)** por defecto: te dejo la app funcional (auth, libretos, ensayos, configuración, persistencia) y un aviso claro en la UI cuando el backend de Whisper no esté disponible. Si luego quieres (B), lo hacemos en un paso aparte.

### 5. Logo / branding
El logo `cine-estrella-logo.png` y el nombre "Cine Estrella" se mantienen tal cual del original.

## Cosas que **no** voy a hacer
- No copiar `package.json` ni `vite.config.ts` del origen — el de aquí ya tiene las mismas deps.
- No copiar `.env` con secretos del Supabase del autor original.
- No copiar `wrangler.jsonc` ni `bun.lock`.
- No subir el directorio `src/teleprompter/` al repo (es código Python que no corre aquí; te lo dejo aparte si quieres referencia).

## Pregunta pendiente
Confirma la opción para el backend Whisper:
- **A** (recomendado): port "as-is", backend Python queda externo y configurable por env var.
- **B**: reescribir transcripción en server functions con un proveedor externo (más tiempo, costo de tokens).
