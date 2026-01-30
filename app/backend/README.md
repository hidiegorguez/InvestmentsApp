# Investments Backend

API REST construida con FastAPI para gestionar carteras de inversiones almacenadas en Azure Blob Storage.

## 🚀 Ejecución Local

```bash
cd app/backend
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## 📝 Variables de Entorno

Crear archivo `.env` en este directorio:

```env
# Azure Blob Storage (una de las dos opciones)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...

# O alternativamente:
# AZURE_STORAGE_ACCOUNT=nombre_cuenta
# AZURE_STORAGE_KEY=clave_de_acceso

# JWT para autenticación (generar con: python -c "import secrets; print(secrets.token_hex(32))")
JWT_SECRET_KEY=tu_clave_secreta_muy_larga_y_aleatoria
```

## 📁 Estructura de Archivos

```
backend/
├── main.py           # Endpoints FastAPI y configuración JWT
├── models.py         # Modelos Pydantic (WalletRecord, UserSettings, etc.)
├── csv_handler.py    # Lógica de lectura/escritura de CSVs desde Azure Blob
├── azure_blob.py     # Cliente Azure Blob Storage
├── requirements.txt  # Dependencias Python
├── Dockerfile        # Para despliegue en contenedores
└── .env              # Variables de entorno (NO commitear)
```

## 🔐 Sistema de Autenticación

### Flujo de Login

1. Usuario envía `POST /auth/login` con `{ "userId": "...", "password": "..." }`
2. Backend busca usuario en `data/users.csv` del blob storage
3. Verifica contraseña con bcrypt
4. Genera JWT con `sub: userId` y expiración de 24 horas
5. Devuelve `{ "access_token": "...", "token_type": "bearer", "assets": [...] }`

### Protección de Endpoints

Los endpoints protegidos usan `Depends(verify_token)`:
- Extraen el token del header `Authorization: Bearer <token>`
- Verifican firma y expiración
- Retornan el `user_id` del token para usar en la lógica

```python
@app.get("/wallet")
def get_wallet(asset_type: str, current_user: str = Depends(verify_token)):
    # current_user contiene el userId del token verificado
    return csv_handler.get_wallet(blob_client, container, asset_type, current_user)
```

## 🔗 API Endpoints

### Autenticación

#### `POST /auth/login`
Autentica usuario y devuelve JWT.

**Request:**
```json
{
  "userId": "mi_usuario",
  "password": "mi_contraseña"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "assets": ["crypto", "etf", "stock"]
}
```

**Response (401):** Usuario o contraseña incorrectos

---

### Cartera

#### `GET /wallet?asset_type={asset}`
Obtiene todos los registros de la cartera del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "date": "2024-01-15",
    "assets": [
      {"symbol": "BTC", "total_holding": 0.5, "invested_EUR": 15000, "color": "#F7931A"},
      {"symbol": "ETH", "total_holding": 2.0, "invested_EUR": 4000, "color": "#627EEA"}
    ]
  }
]
```

---

#### `POST /wallet/record?asset_type={asset}`
Crea o actualiza un registro de cartera.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "userId": "mi_usuario",
  "asset": "crypto",
  "index": 0,
  "date": "2024-01-15",
  "stock": [
    {"symbol": "BTC", "total_holding": 0.5, "invested": 15000},
    {"symbol": "ETH", "total_holding": 2.0, "invested": 4000}
  ]
}
```

- Si `index` corresponde a una fila existente → **actualiza**
- Si `index` es mayor que el número de filas → **crea nuevo**

---

#### `DELETE /wallet/record?asset_type={asset}&index={n}`
Elimina un registro por su índice (posición en el CSV, 0-based).

**Headers:** `Authorization: Bearer <token>`

---

### Configuración

#### `GET /settings?asset_type={asset}`
Obtiene configuración del usuario para un tipo de activo.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "mi_usuario",
  "start_date": "2020-01-01",
  "email": "usuario@example.com",
  "show_holdings": true
}
```

---

### Legacy

#### `GET /user/assets?user_id={userId}`
Lista los tipos de activos que tiene un usuario. **No requiere autenticación** (legacy, usar `/auth/login` en su lugar).

## 📊 Estructura de Datos en Azure Blob

### `data/users.csv`
```csv
id,password_hash
mi_usuario,$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### `wallets/{asset_type}/{userId}_wallet.csv`
```csv
date,BTC,BTC_invested_EUR,ETH,ETH_invested_EUR
2024-01-15,0.5,15000,2.0,4000
2024-02-01,0.6,18000,2.5,5000
```

### `data/user_settings_{asset_type}.csv`
```csv
id,start_date,email,email_error,show_holdings
mi_usuario,2020-01-01,email@example.com,,true
```

### `data/symbol_colors.json`
```json
{
  "BTC": "#F7931A",
  "ETH": "#627EEA",
  "IAUP.L": "#F3BA2F"
}
```

## 🛠️ Módulos Principales

### `csv_handler.py`

| Función | Descripción |
|---------|-------------|
| `get_user(blob_client, container, user_id)` | Busca usuario en `data/users.csv`, retorna dict con `id` y `password_hash` |
| `get_wallet(blob_client, container, asset_type, user_id)` | Lee CSV de cartera y lo transforma a formato JSON con colores |
| `save_wallet_record(blob_client, container, asset_type, record)` | Guarda o actualiza un registro en el CSV |
| `delete_wallet_record(blob_client, container, asset_type, user_id, index)` | Elimina un registro por índice |
| `get_user_settings(blob_client, container, user_id, asset_type)` | Lee configuración del usuario |

### `azure_blob.py`

| Método | Descripción |
|--------|-------------|
| `from_env()` | Crea cliente desde variables de entorno |
| `list_blobs(container)` | Lista blobs en un contenedor |
| `download_blob_to_path(container, blob_name, path)` | Descarga blob a archivo local |
| `upload_blob_from_path(container, blob_name, path)` | Sube archivo local a blob |

### `models.py`

| Modelo | Campos |
|--------|--------|
| `WalletRecord` | userId, asset, index, date, stock: List[StockItem] |
| `StockItem` | symbol, total_holding, invested |
| `WalletDay` | date, assets: List[AssetPosition] |
| `AssetPosition` | symbol, total_holding, invested_EUR, color |
| `UserSettings` | id, start_date, email, email_error, show_holdings |

## 🚢 Despliegue

### Docker

```bash
docker build -t investments-backend .
docker run -p 8000:8000 --env-file .env investments-backend
```

### Fly.io

```bash
fly launch
fly secrets set AZURE_STORAGE_CONNECTION_STRING="..." JWT_SECRET_KEY="..."
fly deploy
```

## ⚠️ Notas Importantes

1. **El archivo `.env` NO debe commitearse** - está en `.gitignore`
2. **Los CSVs se descargan a archivos temporales** para procesarlos con Pandas
3. **El color por defecto** para símbolos no encontrados es `#808080`
4. **El token JWT expira en 24 horas** - el frontend redirige a login automáticamente
5. **La eliminación es por índice**, no por fecha (permite múltiples registros con misma fecha)
