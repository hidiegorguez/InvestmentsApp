# Investments Frontend

Aplicación SPA (Single Page Application) para visualizar y gestionar carteras de inversiones personales.

## 🚀 Ejecución Local

```bash
cd app/frontend
npm install
npm run dev
# Abre http://localhost:5173
```

## 🛠️ Stack Tecnológico

- **React 18** - Librería UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilos utility-first
- **React Router** - Navegación SPA

## 📁 Estructura del Proyecto

```
frontend/
├── index.html              # Entry point HTML
├── package.json            # Dependencias npm
├── vite.config.ts          # Configuración Vite
├── tailwind.config.cjs     # Configuración Tailwind
├── tsconfig.json           # Configuración TypeScript
└── src/
    ├── main.tsx            # Entry point React
    ├── App.tsx             # Router principal con rutas protegidas
    ├── styles.css          # Estilos globales + Tailwind imports
    ├── api/
    │   └── api.tsx         # Funciones de llamada al backend
    ├── context/
    │   └── AuthContext.tsx # Contexto global de autenticación
    ├── components/
    │   ├── Login.tsx       # Formulario de login
    │   ├── AssetSelectionPanel.tsx  # Selector de tipo de activo
    │   └── WalletRecordEdit.tsx     # Modal edición/creación de registro
    ├── pages/
    │   └── Wallet.tsx      # Página principal de cartera
    ├── types/
    │   └── types.tsx       # Tipos TypeScript compartidos
    └── public/
        └── flaticon.png    # Favicon de la aplicación
```

## 🔐 Sistema de Autenticación

### AuthContext (`src/context/AuthContext.tsx`)

Provee estado global de autenticación a toda la aplicación:

```typescript
interface AuthContextType {
  token: string | null;      // JWT token
  userId: string | null;     // ID del usuario logueado
  assets: string[];          // Assets disponibles (crypto, etf, stock)
  login: (token, userId, assets) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
```

**Persistencia:** Los datos se guardan en `localStorage`:
- `auth_token` - JWT token
- `auth_userId` - ID del usuario
- `auth_assets` - Lista de assets (JSON)

### Rutas Protegidas (`src/App.tsx`)

```tsx
<AuthProvider>
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/wallet/:userId/:asset" element={<WalletRoute />} />
    </Routes>
  </Router>
</AuthProvider>
```

El componente `ProtectedRoute`:
1. Verifica si `isAuthenticated` es true
2. Verifica que el `userId` de la URL coincida con el usuario logueado
3. Redirige a `/` si no cumple las condiciones

## 📡 API (`src/api/api.tsx`)

### Funciones Disponibles

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `logIn(userId, password)` | POST /auth/login | Login, retorna token + assets |
| `getWallet(userId, asset)` | GET /wallet | Obtiene cartera |
| `saveWalletRecord(assetType, record)` | POST /wallet/record | Guarda registro |
| `deleteWalletRecord(assetType, userId, index)` | DELETE /wallet/record | Elimina registro |
| `getAssets(userId)` | GET /user/assets | Lista assets (legacy) |

### Manejo de Autenticación

Todas las funciones (excepto login) incluyen automáticamente el token:

```typescript
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
```

Si el backend devuelve **401**, se limpia el localStorage y redirige a login.

## 🧩 Componentes

### Login (`src/components/Login.tsx`)

Formulario de autenticación con:
- Inputs para usuario y contraseña
- Spinner de carga durante la petición
- Mensajes de error específicos:
  - "Usuario o contraseña incorrectos" (401)
  - "Usuario no existente" (404)
  - "Error de conexión" (otros errores)
- Tras login exitoso, muestra `AssetSelectionPanel`

### AssetSelectionPanel (`src/components/AssetSelectionPanel.tsx`)

Selector de tipo de activo:
- Muestra botones para cada asset (crypto, etf, stock)
- Al seleccionar, navega a `/wallet/{userId}/{asset}`
- Iconos y colores distintivos por tipo

### Wallet (`src/pages/Wallet.tsx`)

Página principal con tabla de cartera:
- **Skeleton loader** mientras carga datos
- Tabla con fecha, símbolos, holdings e inversión
- Botón para editar cada registro
- Botón para crear nuevo registro
- **Modal de eliminación** con confirmación
- Mensaje de éxito tras eliminar

### WalletRecordEdit (`src/components/WalletRecordEdit.tsx`)

Modal para editar/crear registros:
- Formulario con campos para fecha y cada posición
- **Inputs de texto** para decimales (permite escribir "0.15" sin problemas)
- Conversión a números al guardar
- Mensaje de éxito tras guardar
- Botones ocultos tras operación exitosa

## 🎨 Estilos

### Tailwind CSS

Configurado con colores personalizados en `tailwind.config.cjs`:
- Paleta orange para botones primarios
- Sombras y bordes redondeados consistentes

### Clases Comunes

```css
/* Botón primario */
.bg-orange-600.text-white.py-2.rounded

/* Input */
.border.border-gray-300.rounded.px-3.py-2.focus:ring-2.focus:ring-orange-600

/* Card/Modal */
.bg-white.p-6.rounded-md.shadow-xl
```

## 🔄 Flujo de Usuario

```
1. Usuario abre la app → ve Login
2. Introduce usuario + contraseña → POST /auth/login
3. Login exitoso → se guarda token, muestra AssetSelectionPanel
4. Selecciona asset (ej: crypto) → navega a /wallet/{userId}/crypto
5. Wallet carga datos → GET /wallet?asset_type=crypto (con token)
6. Usuario puede:
   - Ver tabla de registros
   - Editar registro → modal → POST /wallet/record
   - Crear registro → modal → POST /wallet/record
   - Eliminar registro → modal confirmación → DELETE /wallet/record
7. Si cierra pestaña y vuelve → token persiste en localStorage
8. Si token expira → 401 → redirige a login
```

## 🚢 Despliegue

### Vercel

1. Conectar repositorio a Vercel
2. Configurar:
   - **Root Directory:** `app/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Variables de entorno (si usas `API_URL` dinámico):
   - `VITE_API_URL=https://tu-backend.fly.dev`

### Build Manual

```bash
npm run build
# Los archivos estáticos se generan en dist/
```

## ⚠️ Notas Importantes

1. **El backend debe correr en `http://127.0.0.1:8000`** para desarrollo local
2. **Los decimales se manejan como strings** en los inputs para permitir escribir "0.15"
3. **El índice de registros es 0-based** y corresponde a la posición en el CSV
4. **El token expira en 24 horas** - después hay que volver a hacer login
5. **Los colores de assets** vienen del backend (`data/symbol_colors.json`)

## 🧪 Desarrollo

### Scripts NPM

```bash
npm run dev      # Dev server con hot reload
npm run build    # Build para producción
npm run preview  # Preview del build de producción
npm run lint     # Linter
```

### Añadir Nuevos Componentes

1. Crear archivo en `src/components/NuevoComponente.tsx`
2. Usar `useAuth()` si necesita datos de autenticación
3. Usar funciones de `src/api/api.tsx` para llamadas al backend
4. Añadir tipos en `src/types/types.tsx` si es necesario
