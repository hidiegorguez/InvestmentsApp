from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
import os
import re

import models
import csv_handler

try:
    from supabase import create_client
except Exception:  # pragma: no cover
    create_client = None

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tu_clave_secreta_muy_segura_cambiar_en_produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 5

security = HTTPBearer()
app = FastAPI(title="Investments Backend")

origins = [
    "http://localhost:5173",
    "https://investments-app-ashy.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_supabase_client():
    """Create a Supabase client using the current env. Legacy Azure Blob is intentionally not used."""
    if create_client is None:
        return None

    url = (os.getenv("SUPABASE_URL") or "").strip()
    key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    print(f'url: {url}', f'key: {key}')
    if not url or not key:
        return None

    return create_client(url, key)


db_client = create_supabase_client()


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verifica el token JWT y retorna el user_id."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


class LoginRequest(models.BaseModel):
    userId: str
    password: str


class AddStockRequest(models.BaseModel):
    stock_name: str


class RenameStockRequest(models.BaseModel):
    old_name: str
    new_name: str


class DeleteStockRequest(models.BaseModel):
    stock_name: str


def _list_user_assets(user_id: str):
    """An asset is available for the user if their id has a row in the corresponding settings table."""
    if db_client is None:
        return []
    asset_names = []
    for asset_type, table_name in {
        "crypto": "user_settings_crypto",
        "etf": "user_settings_etf",
        "stock": "user_settings_stock",
    }.items():
        try:
            response = db_client.table(table_name).select("id").eq("id", user_id).limit(1).execute()
            rows = getattr(response, "data", []) or []
            if rows:
                asset_names.append(asset_type)
        except Exception:
            continue
    return asset_names


@app.post("/auth/login")
def login(request: LoginRequest):
    """Autentica usando la configuración del usuario y reconoce la estructura actual de Supabase."""
    if db_client is None:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    user = csv_handler.get_user(db_client, "", request.userId)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    password_hash = user.get("password_hash") or user.get("passwordHash")
    if password_hash:
        try:
            password_bytes = str(request.password).encode()
            hash_bytes = str(password_hash).encode()
            if not bcrypt.checkpw(password_bytes, hash_bytes):
                raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
        except (TypeError, ValueError):
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    elif request.password is None or not str(request.password).strip():
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    assets = _list_user_assets(request.userId)
    access_token = create_access_token(data={"sub": request.userId})
    return {"access_token": access_token, "token_type": "bearer", "assets": assets}


@app.get("/user/assets")
def get_assets(user_id: str = None):
    """Returns a list of asset types the user has, or an error if the user doesn't exist."""
    if db_client is None:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    assets = _list_user_assets(user_id)
    if not assets:
        raise HTTPException(status_code=404, detail="User not found")
    return assets


@app.get("/wallet", response_model=List[models.WalletDay])
def get_wallet(asset_type: str = None, current_user: str = Depends(verify_token)):
    """Retorna la cartera usando la nueva estructura de Supabase."""
    if db_client is None:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
    try:
        if not asset_type:
            raise HTTPException(status_code=400, detail="asset_type is required")
        return csv_handler.get_wallet(db_client, "", asset_type, current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings", response_model=Dict[str, Any])
def get_settings(asset_type: str = None, current_user: str = Depends(verify_token)):
    """Returns a dict of settings for the authenticated user, resolving currency IDs through currency table."""
    if db_client is None:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    try:
        if not asset_type:
            raise HTTPException(status_code=400, detail="asset_type is required")
        records = csv_handler.get_user_settings(db_client, "", current_user, asset_type)
        if not records:
            return {}
        return records[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/wallet/record")
def save_wallet_record(asset_type: str = None, record: models.WalletRecord = None, current_user: str = Depends(verify_token)):
    """Save (create or update) a wallet record for the authenticated user."""
    if db_client is None:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    try:
        if not asset_type or not record:
            raise HTTPException(status_code=400, detail="asset_type and record are required")
        if record.userId != current_user:
            raise HTTPException(status_code=403, detail="No puedes modificar datos de otro usuario")
        result = csv_handler.save_wallet_record(db_client, "", asset_type, record)
        return {"message": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/wallet/record")
def delete_wallet_record(asset_type: str = None, index: int = None, current_user: str = Depends(verify_token)):
    """Delete a wallet record by index for the authenticated user."""
    if db_client is None:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    try:
        if not asset_type or index is None:
            raise HTTPException(status_code=400, detail="asset_type and index are required")
        result = csv_handler.delete_wallet_record(db_client, "", asset_type, current_user, index)
        return {"message": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/wallet/stock")
def add_wallet_stock(asset_type: str = None, request: AddStockRequest = None, current_user: str = Depends(verify_token)):
    """Add a new stock/symbol to the real wallet table in Supabase."""
    if db_client is None:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    try:
        if not asset_type or not request:
            raise HTTPException(status_code=400, detail="asset_type and stock_name are required")
        stock_name = request.stock_name.strip().upper()
        if not stock_name or len(stock_name) > 10:
            raise HTTPException(status_code=400, detail="Stock name must be 1-10 characters")
        if not re.match(r'^[a-zA-Z0-9]+$', stock_name):
            raise HTTPException(status_code=400, detail="Stock name must be alphanumeric only")

        result = csv_handler.add_wallet_stock(db_client, "", asset_type, current_user, stock_name)
        return {"message": result, "stock_name": stock_name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/wallet/stock")
def rename_wallet_stock(asset_type: str = None, request: RenameStockRequest = None, current_user: str = Depends(verify_token)):
    """Rename a stock/symbol in the wallet table."""
    if db_client is None:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    try:
        if not asset_type or not request:
            raise HTTPException(status_code=400, detail="asset_type, old_name and new_name are required")

        old_name = request.old_name.strip().upper()
        new_name = request.new_name.strip().upper()

        if not new_name or len(new_name) > 10:
            raise HTTPException(status_code=400, detail="New name must be 1-10 characters")
        if not re.match(r'^[a-zA-Z0-9]+$', new_name):
            raise HTTPException(status_code=400, detail="New name must be alphanumeric only")

        result = csv_handler.rename_wallet_stock(db_client, "", asset_type, current_user, old_name, new_name)
        return {"message": result, "old_name": old_name, "new_name": new_name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/wallet/stock")
def delete_wallet_stock(asset_type: str = None, stock_name: str = None, current_user: str = Depends(verify_token)):
    """Delete a stock/symbol from the wallet table."""
    if db_client is None:
        raise HTTPException(status_code=500, detail="Supabase client not configured")

    try:
        if not asset_type or not stock_name:
            raise HTTPException(status_code=400, detail="asset_type and stock_name are required")

        stock_name = stock_name.strip().upper()
        result = csv_handler.delete_wallet_stock(db_client, "", asset_type, current_user, stock_name)
        return {"message": result, "stock_name": stock_name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))