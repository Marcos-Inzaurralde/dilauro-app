# ⚡ AION — AI Business Operating System

<p align="center">
  <strong>Tu co-piloto de negocios impulsado por IA</strong><br>
  Estrategia · Desarrollo · Marketing · Monetización · Planeación · Creación
</p>

---

## 🧠 ¿Qué es AION?

AION es un **Sistema Operativo de Negocios con IA** — una plataforma web que integra un co-piloto inteligente con 6 modos especializados, gestión de proyectos, sala de estrategia y hub de integraciones.

### Características principales

- 🧠 **AI Co-Pilot** — 6 modos especializados (Estrategia, Desarrollo, Marketing, Monetización, Planeación, Creación) con streaming en tiempo real
- 🚀 **Project Intelligence** — Gestión de proyectos con roadmap generado por IA
- ♟️ **Strategy Room** — FODA, Business Canvas, Go-to-Market, Pricing, OKRs, TAM/SAM/SOM
- 🔗 **Integrations Hub** — Notion, Gmail, Calendar, Vercel, Figma, Canva, Gamma (vía MCP)
- ⚡ **Command Center** — Dashboard con vista general de proyectos y acceso rápido
- 🔐 **Autenticación** — Login/Registro/Reset via Supabase Auth

## 🏗️ Arquitectura

```
aion/
├── api/
│   └── ai.ts               # Vercel Edge Function → OpenRouter proxy
├── public/
│   └── favicon.svg          # AION favicon
├── src/
│   ├── App.tsx              # Root component (auth gate + routing)
│   ├── types.ts             # TypeScript interfaces
│   ├── config/
│   │   ├── constants.ts     # Modos IA, MCP, navegación
│   │   ├── theme.ts         # Design tokens (glassmorphism)
│   │   ├── api.ts           # callAI + callAIStream (SSE)
│   │   └── supabase.ts      # Supabase client
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth state (Supabase)
│   ├── hooks/
│   │   ├── useStorage.ts    # localStorage persistente
│   │   ├── useToast.tsx     # Notificaciones
│   │   └── useMobile.ts    # Detección responsive
│   ├── pages/
│   │   └── AuthPage.tsx     # Login / Registro / Reset
│   └── components/
│       ├── ErrorBoundary.tsx # Crash recovery
│       ├── Dashboard.tsx    # Command Center
│       ├── CoPilot.tsx      # Chat con IA (streaming)
│       ├── Projects.tsx     # Gestión de proyectos
│       ├── StrategyRoom.tsx # Sesiones estratégicas
│       ├── IntegrationsHub.tsx # MCP integrations
│       ├── Sidebar.tsx      # Navegación lateral
│       └── TopBar.tsx       # Barra móvil
├── vercel.json              # Vercel config
└── .env.example             # Variables de entorno
```

## 🚀 Setup

### Requisitos
- Node.js 18+
- Cuenta de [OpenRouter](https://openrouter.ai/) (API key — modelos gratuitos disponibles)
- Cuenta de [Supabase](https://supabase.com/) (auth + DB)
- Cuenta de [Vercel](https://vercel.com/) (deploy)

### Desarrollo local

```bash
# Clonar el repo
git clone https://github.com/marcosinzaurralde95/dilauro-app.git
cd dilauro-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus claves

# Iniciar dev server
npm run dev
```

### Deploy en Vercel

1. Conecta este repo en [Vercel](https://vercel.com/new)
2. Framework: **Vite**
3. Configura las variables de entorno en **Settings → Environment Variables**:
   - `OPENROUTER_API_KEY` — tu API key de OpenRouter
   - `VITE_SUPABASE_URL` — URL de tu proyecto Supabase
   - `VITE_SUPABASE_ANON_KEY` — anon key de Supabase
   - `AION_APP_TOKEN` — token secreto para el proxy de IA (opcional)
   - `VITE_APP_TOKEN` — mismo valor que `AION_APP_TOKEN` (opcional)

## 🔐 Seguridad

- ✅ API key de OpenRouter nunca se expone al frontend
- ✅ Edge Function valida Bearer token en cada request (si `AION_APP_TOKEN` está seteado)
- ✅ CORS restringido al dominio de la app
- ✅ Rate limiting por IP (30 req/min)
- ✅ Validación de body (mensajes, roles, max_tokens)
- ✅ Autenticación via Supabase Auth
- ✅ Error Boundary para recuperación de crashes

## 🤖 Modelos IA

AION usa una cadena de fallback de modelos gratuitos vía OpenRouter:

1. `deepseek-v4-flash:free`
2. `gpt-oss-120b:free`
3. `nemotron-3-super-120b:free`
4. `llama-3.3-70b:free`
5. `gemma-4-31b:free`

Si un modelo no responde, automáticamente prueba el siguiente.

## 📄 Licencia

MIT — Dilauro / INZATECH © 2026
