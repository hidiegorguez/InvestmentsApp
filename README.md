# InvestmentsApp

Aplicación web para la gestión de carteras de inversiones personales. Permite visualizar, crear, editar y eliminar registros de inversiones en diferentes tipos de activos (crypto, ETFs, acciones).

## 🏗️ Arquitectura

```
InvestmentsApp/
├── app/
│   ├── backend/          # API FastAPI (Python)
│   └── frontend/         # SPA React + TypeScript + Vite
├── extension/            # Extensión VS Code (en desarrollo)
└── README.md
```

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | FastAPI, Python 3.11+, Pandas |
| Almacenamiento | Azure Blob Storage (CSVs y JSONs) |
| Autenticación | JWT (python-jose) + bcrypt |

## 🔐 Sistema de Autenticación

La aplicación implementa autenticación basada en JWT:

1. **Login**: El usuario envía `userId` + `password` a `POST /auth/login`
2. **Verificación**: El backend compara el hash bcrypt contra `data/users.csv`
3. **Token**: Se devuelve un JWT válido por 24 horas
4. **Protección**: Todos los endpoints sensibles requieren `Authorization: Bearer <token>`
5. **Frontend**: El token se almacena en `localStorage` y se envía automáticamente

### Estructura de usuarios en Azure Blob

```
data/users.csv
├── id              # ID único del usuario
└── password_hash   # Hash bcrypt de la contraseña
```

## 📁 Estructura de Datos en Azure Blob Storage

```
investmentscontainer/
├── data/
│   ├── users.csv                    # Usuarios y contraseñas (hash)
│   ├── symbol_colors.json           # Colores para cada símbolo
│   ├── user_settings_crypto.csv     # Config por usuario/asset
│   ├── user_settings_etf.csv
│   └── user_settings_stock.csv
├── wallets/
│   ├── crypto/{userId}_wallet.csv   # Cartera crypto del usuario
│   ├── etf/{userId}_wallet.csv      # Cartera ETF del usuario
│   └── stock/{userId}_wallet.csv    # Cartera acciones del usuario
└── graphs/
    └── crypto/{userId}_*.png        # Gráficos generados
```

### Formato de wallet CSV

```csv
date,BTC,BTC_invested_EUR,ETH,ETH_invested_EUR,...
2024-01-15,0.5,15000,2.0,4000,...
2024-02-01,0.6,18000,2.5,5000,...
```

## 🚀 Ejecución Local

### Backend

```bash
cd app/backend
pip install -r requirements.txt
# Configurar .env (ver app/backend/README.md)
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd app/frontend
npm install
npm run dev
# Abre http://localhost:5173
```

## 🔗 API Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/login` | ❌ | Login con userId + password, devuelve JWT + assets |
| GET | `/user/assets` | ❌ | Lista assets de un usuario (legacy) |
| GET | `/wallet` | ✅ | Obtiene la cartera del usuario autenticado |
| GET | `/settings` | ✅ | Obtiene configuración del usuario |
| POST | `/wallet/record` | ✅ | Crea o actualiza un registro de cartera |
| DELETE | `/wallet/record` | ✅ | Elimina un registro por índice |

## 🎨 Frontend - Componentes Principales

```
src/
├── api/api.tsx              # Funciones de llamada a la API
├── context/AuthContext.tsx  # Contexto de autenticación global
├── components/
│   ├── Login.tsx            # Formulario login con contraseña
│   ├── AssetSelectionPanel.tsx  # Selector de tipo de activo
│   └── WalletRecordEdit.tsx # Modal edición/creación de registro
├── pages/
│   └── Wallet.tsx           # Página principal de cartera
└── App.tsx                  # Router con rutas protegidas
```

## 🛡️ Seguridad

- **Contraseñas**: Hasheadas con bcrypt (nunca en texto plano)
- **JWT**: Firmado con clave secreta en variable de entorno
- **Rutas protegidas**: El frontend redirige a login si no hay token
- **Validación de usuario**: El backend verifica que el userId del token coincida con los datos solicitados
- **CORS**: Configurado solo para orígenes permitidos

## 📝 Variables de Entorno

### Backend (`app/backend/.env`)

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
JWT_SECRET_KEY=tu_clave_secreta_muy_larga_generada_con_secrets.token_hex(32)
```

## 🚢 Despliegue

- **Frontend**: Vercel (root: `app/frontend`)
- **Backend**: Fly.io, Azure Container Apps, o cualquier host Docker

## 📚 Documentación Adicional

- [Backend README](app/backend/README.md) - Detalles de la API y endpoints
- [Frontend README](app/frontend/README.md) - Estructura de componentes y estado

---

*Proyecto desarrollado con asistencia de IA (GitHub Copilot).*

