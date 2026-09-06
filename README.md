# 💳 MiniPay — Web Application (Frontend)

> **[Español](#-español)** | **[English](#-english)**

---

## 🇪🇸 Español

Aplicación web moderna y de calidad fintech para la plataforma de billetera digital **MiniPay**, desarrollada con **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Lucide Icons** y **Recharts**.

El frontend ofrece una experiencia de usuario inmersiva (*Dark Mode First*) con gestión de sesiones en tiempo real, auto-renovación silenciosa de tokens JWT, visualización interactiva de gastos, transferencias atómicas con protección de idempotencia, escaneo y generación de cobros QR con cámara web/móvil, y descarga directa de comprobantes oficiales en PDF.

---

### 🚀 Stack Tecnológico

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Renderizado híbrido optimizado con Turbopack |
| **Librería UI** | [React 19](https://react.dev/) | Componentes interactivos y gestión de estado reactiva |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) | Tipado estricto en tiempo de compilación |
| **Estilos** | [Tailwind CSS](https://tailwindcss.com/) | Diseño responsivo, Dark Mode y efectos Glassmorphism |
| **Iconos** | [Lucide React](https://lucide.dev/) | Iconografía minimalista y moderna |
| **Gráficos** | [Recharts](https://recharts.org/) | Gráfico de dona interactivo para analítica de gastos |
| **Lector QR** | `@yudiel/react-qr-scanner` | Escaneo en vivo con la cámara del dispositivo móvil / web |
| **Generador QR** | `qrcode.react` | Renderizado de códigos QR dinámicos vectoriales |
| **Animaciones** | `framer-motion` | Micro-animaciones, transiciones fluidas y modales |
| **Cliente HTTP** | `axios` | Cliente con interceptores de autenticación y auto-refresh de JWT |
| **Notificaciones** | `sonner` | Toasts elegantes y alertas no bloqueantes |
| **Gestor de Paquetes** | [pnpm](https://pnpm.io/) | Rápido y eficiente en espacio de disco |

---

### ✨ Funcionalidades Principales

#### 1. Autenticación y Gestión de Sesión
- Pantallas de **Inicio de Sesión** y **Registro** con diseño *Glassmorphism*.
- Botones de acceso rápido con **Credenciales de Prueba** precargadas para evaluación ágil.
- **Interceptor de Auto-Refresh (RFC 7519):** Si el *Access Token* (15 min) expira, Axios renueva automáticamente la sesión en segundo plano utilizando el *Refresh Token* (7 días) sin interrumpir al usuario.
- **Rutas Protegidas (`AuthGuard`):** Redirección automática de usuarios no autenticados hacia `/login`.

#### 2. Dashboard Financiero (`/dashboard`)
- **Tarjeta de Billetera:** Saldo formateado en ARS con botón de privacidad (mostrar/ocultar saldo `••••••`).
- **Copiado Rápido:** Copia el CVU de 22 dígitos o el Alias en un clic con confirmación visual (*toast*).
- **Widget de Cuenta Remunerada (35% TNA):** Visualización en vivo del rendimiento ganado hoy, proyecciones mensuales y botón para simular la acreditación diaria (`POST /wallet/simulate-yield`).
- **Gráfico de Analítica Financiera:** Gráfico de dona interactivo que muestra el desglose porcentual de egresos por categoría (`FOOD`, `SERVICES`, `ENTERTAINMENT`, etc.).
- **Accesos Rápidos:** Botones de acción directa para Transferir, Depositar, Pagar con QR y Cobrar con QR.

#### 3. Transferencias de Dinero con Idempotencia (`/transfers`)
- Selector con dos pestañas: **Transferencia Manual** (por CVU, Alias o Email con validación automática) o **Desde la Agenda** (selección directa de contactos guardados).
- Chips de acceso rápido de montos ($1.000, $5.000, $10.000, Todo mi saldo) y selector de categoría del gasto.
- **Idempotencia Automática:** Genera dinámicamente un UUID (`Idempotency-Key: crypto.randomUUID()`) en cada envío para evitar transferencias duplicadas ante reintentos.
- Pantalla de éxito con botón para **Descargar Comprobante PDF** inmediatamente.

#### 4. Hub de Cobros y Pagos QR (`/qr`)
- **Pagar con QR:** Escanea códigos con la cámara del dispositivo o permite pegar el payload; decodifica el cobro, muestra los datos del destinatario y procesa el pago con verificación HMAC y prevención de *Replay Attacks* (`409 Conflict`).
- **Cobrar con QR:** Generador dinámico de código QR firmado digitalmente con monto y descripción, acompañado de un reloj con cuenta regresiva de 15 minutos (TTL).

#### 5. Historial de Actividad & Descarga de PDF (`/activity`)
- Listado paginado de movimientos con filtros interactivos por tipo de transacción (*Depósitos*, *Envíos*, *Recepciones*, *Rendimientos*) y por categoría.
- Modal de detalle de transacción con descarga directa del **Comprobante Oficial en PDF con Sello SHA-256** generado en streaming.

#### 6. Agenda de Contactos & Perfil (`/contacts`, `/profile`)
- **Agenda:** Búsqueda en tiempo real por nombre/alias, modal para agregar destinatarios con apodo personalizado y botón para transferir en un clic.
- **Perfil:** Visualización y edición de foto de perfil (URL HTTPS o reseteo a `null`) y cambio seguro de contraseña con advertencia de revocación de sesiones.

---

### 📂 Estructura del Proyecto

```text
src/
├── app/
│   ├── (auth)/                       # Rutas públicas
│   │   ├── login/page.tsx            # Inicio de sesión
│   │   └── register/page.tsx         # Registro de usuario
│   ├── (dashboard)/                  # Rutas protegidas
│   │   ├── layout.tsx                # Layout principal con Sidebar y Bottom Nav
│   │   ├── dashboard/page.tsx        # Dashboard principal con métricas y saldo
│   │   ├── transfers/page.tsx        # Módulo de transferencias
│   │   ├── qr/page.tsx               # Hub de Pagos y Cobros QR
│   │   ├── activity/page.tsx         # Historial de transacciones y descarga PDF
│   │   ├── contacts/page.tsx         # Agenda de contactos frecuentes
│   │   └── profile/page.tsx          # Perfil, avatar y seguridad
│   ├── layout.tsx                    # Root Layout con fuentes y Sonner Toaster
│   └── page.tsx                      # Redirección inteligente según autenticación
├── context/
│   └── AuthContext.tsx               # Estado global de autenticación y billetera
├── services/
│   └── api.ts                        # Cliente Axios con interceptor de auto-refresh
└── types/
    └── api.ts                        # Interfaces TypeScript del contrato del backend
```

---

### 🛠️ Instalación y Puesta en Marcha

```bash
# 1. Instalar dependencias
pnpm install

# 2. Iniciar servidor de desarrollo en el puerto 3001
pnpm dev
```

- **URL de la Aplicación:** `http://localhost:3001`
- **Backend Requerido:** Debe estar corriendo en `http://localhost:3000` ([Repositorio Backend](https://github.com/Calegaris/proyecto-4-minipay)).

#### 🔑 Credenciales de Prueba Precargadas
- **Lucas Dev:** `lucas@minipay.com` / `Password123!` (Saldo: $20.000 ARS)
- **Juan Perez:** `juan@minipay.com` / `Password123!` (Saldo: $15.000 ARS)
- **Maria Gomez:** `maria@minipay.com` / `Password123!` (Saldo: $5.000 ARS)

---

<br>

---

## 🇺🇸 English

Modern, fintech-grade web application for the **MiniPay Virtual Wallet** platform, built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, and **Recharts**.

The application delivers an immersive, *Dark Mode First* user experience featuring real-time session management, silent JWT auto-refresh rotation, financial analytics, atomic transfers with idempotency protection, dynamic QR code payments via camera, and in-memory streaming PDF receipts.

---

### 🚀 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Hybrid rendering powered by Turbopack |
| **UI Library** | [React 19](https://react.dev/) | Interactive components and reactive state management |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict compile-time type safety |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Responsive design, Dark Mode, and Glassmorphism effects |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, minimalist iconography |
| **Charts** | [Recharts](https://recharts.org/) | Interactive donut chart for expense categorization |
| **QR Scanner** | `@yudiel/react-qr-scanner` | Real-time camera scanning for mobile and desktop |
| **QR Generator** | `qrcode.react` | Dynamic vector QR code generation |
| **Animations** | `framer-motion` | Micro-interactions, smooth page transitions, and modals |
| **HTTP Client** | `axios` | Configured with authentication and JWT auto-refresh interceptors |
| **Toasts** | `sonner` | Sleek, non-blocking toast notifications |
| **Package Manager** | [pnpm](https://pnpm.io/) | Fast, disk space efficient package manager |

---

### ✨ Key Features

#### 1. Authentication & Session Management
- **Login & Register** interfaces with Glassmorphism cards and real-time validation.
- **Quick Demo Credentials** buttons for seamless evaluators walkthrough.
- **Silent JWT Auto-Refresh (RFC 7519):** Axios interceptor automatically renews expired access tokens (15m) using refresh tokens (7d) without user interruption.
- **Protected Routes (`AuthGuard`):** Automatic redirection to `/login` for unauthenticated sessions.

#### 2. Financial Dashboard (`/dashboard`)
- **Balance Card:** Formatted ARS balance with privacy toggle (`$ ••••••`).
- **1-Click Copy:** Copies 22-digit CVU or Alias to clipboard with toast confirmation.
- **Remunerated Account (35% APR / TNA):** Live tracking of daily earned interest, monthly projections, and on-demand yield simulation trigger (`POST /wallet/simulate-yield`).
- **Expense Analytics:** Interactive donut chart displaying monthly expense distribution by category (`FOOD`, `SERVICES`, `HOUSING`, `ENTERTAINMENT`, etc.).
- **Quick Actions:** Instant shortcuts to Transfer, Deposit, Pay with QR, and Charge with QR.

#### 3. Idempotent Money Transfers (`/transfers`)
- Dual-tab workflow: **Manual Transfer** (via CVU, Alias, or Email with live lookup) or **Contacts Picker** (one-click selection from address book).
- Quick amount chips ($1,000, $5,000, $10,000, Max Balance) and category selector.
- **Automatic Idempotency:** Injects a dynamic UUID `Idempotency-Key` on every request to prevent double debits on network retries.
- Success confirmation screen with immediate **PDF Receipt Download** button.

#### 4. QR Payments & Dynamic Invoicing (`/qr`)
- **Pay with QR:** Camera-based scanner with manual paste fallback; decodes HMAC-SHA256 payloads, displays merchant preview, and executes payment with Replay Attack (`409 Conflict`) protection.
- **Charge with QR:** Dynamic vector QR generator with custom amount, description, and live 15-minute countdown expiration timer.

#### 5. Activity Ledger & Official PDF Receipts (`/activity`)
- Paginated transaction history with filters by transaction type (`DEPOSIT`, `TRANSFER_SENT`, `TRANSFER_RECEIVED`, `YIELD`) and category.
- Transaction detail modal with direct download of official **SHA-256 sealed PDF receipts**.

#### 6. Contacts Directory & User Profile (`/contacts`, `/profile`)
- **Contacts Book:** Real-time search by name/alias, custom nickname assignment, and one-click transfer actions.
- **Profile Customization:** Profile avatar management (HTTPS URL validation or null reset) and secure password updates with cascade session revocation alert.

---

### 🛠️ Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Start local development server on port 3001
pnpm dev
```

- **App URL:** `http://localhost:3001`
- **Backend API:** Expected at `http://localhost:3000` ([Backend Repository](https://github.com/Calegaris/proyecto-4-minipay)).

#### 🔑 Preloaded Test Credentials
- **Lucas Dev:** `lucas@minipay.com` / `Password123!` (Balance: $20,000 ARS)
- **Juan Perez:** `juan@minipay.com` / `Password123!` (Balance: $15,000 ARS)
- **Maria Gomez:** `maria@minipay.com` / `Password123!` (Balance: $5,000 ARS)
