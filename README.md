# PlaylistMigrator 🎮

Aplicación web con estética **Cartoony / Game GUI** que permite conectar tus cuentas de **Spotify** y **YouTube Music** para migrar tus playlists de forma intuitiva, visual y divertida.

## Funcionalidades

- **Conexión OAuth** con Spotify y YouTube Music (flujo OAuth 2.0 con callback al frontend).
- **Selección de playlists** de Spotify con su portada, número de canciones, propietario y estado de migrabilidad.
- **Migración de playlists** de Spotify → YouTube Music, con búsqueda de vídeo por `canción + artista` y barra de progreso en vivo.
- **UI Kit Cartoony** reutilizable: botones 3D, tarjetas, modales, badges, barras de progreso y spinner.
- **Tema claro/oscuro** con alternancia persistente.
- Guard de rutas que obliga a conectar ambas plataformas antes de migrar.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Angular 20, TypeScript estricto, Tailwind CSS v4, Angular Signals + RxJS |
| Backend | FastAPI (Python 3), Uvicorn, httpx, python-dotenv, sse-starlette |
| Estilos | CSS Custom Properties (bordes 3D, sombras offset `box-shadow: 0 6px 0 #000`, degradados) |
| Iconos y fuentes | Lucide + Google Fonts ('Luckiest Guy', 'Fredoka') |

## Estructura del proyecto

```
.
├── src/                          # Frontend Angular
│   └── app/
│       ├── core/                 # Servicios de auth, modelos, guards e interceptores HTTP
│       │   ├── guards/           # require-connections.guard
│       │   ├── http/             # Interceptor de credenciales y base URL del backend
│       │   ├── models/           # Connection, Platform, Playlist, Transfer
│       │   └── services/         # Auth (Spotify/YouTube), connection-manager, transfer, theme
│       ├── features/             # Páginas de la app
│       │   ├── connect/          # Conexión de cuentas
│       │   ├── playlist-selection/  # Selección de playlists de Spotify
│       │   ├── transfer/         # Estado de la migración
│       │   └── ui-kit-demo/      # Demo del kit de diseño
│       └── shared/components/    # UI Kit Cartoony (botones, cards, modales, badges...)
│
├── backend/                      # Backend FastAPI
│   ├── main.py                   # App FastAPI con CORS y routers
│   └── app/
│       ├── api/routes/           # auth.py, playlists.py, transfer.py
│       ├── core/                 # session_store.py, state_store.py (sesiones en memoria)
│       └── services/             # base.py, spotify.py, youtube.py (integración OAuth/API)

```

## Requisitos previos

- Node.js (≥ 20) y npm.
- Python 3.11+ y `pip`.
- Aplicación registrada en [Spotify for Developers](https://developer.spotify.com/dashboard).
- Credenciales OAuth 2.0 de Google Cloud para la **YouTube Data API v3** ([console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)).

## Configuración

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # completa tus credenciales
```

Variables de entorno más importantes:

| Variable | Descripción |
| --- | --- |
| `REDIRECT_URI_BASE` | Base de la URI de redirección OAuth (el backend añade `/platform/callback`). |
| `FRONTEND_BASE_URL` | URL del frontend al que se redirige tras el login. Debe compartir host con `REDIRECT_URI_BASE` para la cookie de sesión. |
| `CORS_ORIGINS` | Orígenes permitidos para las llamadas desde el navegador. |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Credenciales de la app de Spotify. |
| `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` | Credenciales OAuth de Google Cloud. |
| `SESSION_TTL_SECONDS` | Tiempo de vida de la sesión en memoria (por defecto 7 días). |

### 2. Frontend

```bash
npm install
```

## Ejecución local

```bash
# Terminal 1 — Backend (puerto 8000)
cd backend
.venv\Scripts\activate
uvicorn main:app --reload

# Terminal 2 — Frontend (puerto 4200)
npm start
```

Abre `http://localhost:4200/`. El flujo típico: conectar Spotify y YouTube Music → seleccionar playlists → migrar.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm start` / `ng serve` | Servidor de desarrollo en `http://127.0.0.1/:4200`. |
| `npm run build` / `ng build` | Compila la aplicación para producción en `dist/`. |
| `npm run test` / `ng test` | Ejecuta los tests unitarios (Karma/Jasmine). |
| `npm run lint` / `ng lint` | Revisa el estilo de código con ESLint. |

## API Backend

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado de la API. |
| GET | `/api/auth/{platform}/login` | Inicia el flujo OAuth (Spotify/YouTube). |
| GET | `/api/auth/{platform}/callback` | Callback OAuth; guarda el token y redirige al frontend. |
| GET | `/api/auth/me` | Plataformas conectadas en la sesión actual. |
| POST | `/api/auth/{platform}/disconnect` | Desconecta una plataforma. |
| GET | `/api/spotify/playlists` | Lista las playlists del usuario de Spotify. |
| GET | `/api/spotify/playlists/{id}/tracks` | Canciones de una playlist. |
| POST | `/api/transfer` | Migra las playlists seleccionadas (máx. 3 por migración). |
| GET | `/api/transfer/progress` | Progreso de la migración en curso. |

La sesión se mantiene mediante la cookie `plm_session` (almacenamiento en memoria, pensado para desarrollo).

## Diseño

- Bordes oscuros gruesos (`border-4 border-black`), sombras planas sin blur y esquinas redondeadas.
- Transiciones de pulsación (`active:translate-y-1`).
- Lógica de negocio siempre dentro de servicios inyectables; los componentes solo manejan presentación con Signals.
- Nada de librerías de UI pesadas (Bootstrap, Angular Material) que rompan la identidad visual.

## Documentación externa

- [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api)
- [YouTube Data API v3 Reference](https://developers.google.com/youtube/v3)
