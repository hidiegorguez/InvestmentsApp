from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
import os
import models
from azure_blob import AzureBlobClient
import csv_handler
import re

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tu_clave_secreta_muy_segura_cambiar_en_produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

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

try:
    blob_client = AzureBlobClient.from_env()
except Exception:
    blob_client = None


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


@app.post("/auth/login")
def login(request: LoginRequest):
    """
    Autentica un usuario y devuelve un token JWT junto con sus assets.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    
    # Buscar usuario
    user = csv_handler.get_user(blob_client, "investmentscontainer", request.userId)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    # Verificar contraseña
    password_hash = user.get("password_hash", "")
    if not bcrypt.checkpw(request.password.encode(), password_hash.encode()):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    # Obtener assets del usuario
    assets = set()
    blobs = blob_client.list_blobs("investmentscontainer")
    pattern = re.compile(f"wallets/([^/]+)/{request.userId}_wallet\\.csv")
    for blob in blobs:
        match = pattern.match(blob)
        if match:
            assets.add(match.group(1))
    
    # Crear token
    access_token = create_access_token(data={"sub": request.userId})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "assets": list(assets)
    }


@app.get("/user/assets")
def get_assets(user_id: str = None):
    """
    Returns a list of asset types the user has, or an error if the user doesn't exist.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    assets = set()
    blobs = blob_client.list_blobs("investmentscontainer")
    pattern = re.compile(f"wallets/([^/]+)/{user_id}_wallet\.csv")

    for blob in blobs:
        match = pattern.match(blob)
        if match:
            assets.add(match.group(1))

    if not assets:
        raise HTTPException(status_code=404, detail="User not found")

    return list(assets)


@app.get("/wallet", response_model=List[models.WalletDay])
def get_wallet(asset_type: str = None, current_user: str = Depends(verify_token)):
    """Return wallet CSV (as JSON records) for the authenticated user.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    try:
        if not asset_type:
            raise HTTPException(status_code=400, detail="asset_type is required")
        return csv_handler.get_wallet(blob_client, "investmentscontainer", asset_type, current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/settings", response_model=Dict[str, Any])
def get_settings(asset_type: str = None, current_user: str = Depends(verify_token)):
    """
    Returns a dict of settings for the authenticated user.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    
    try:
        if not asset_type:
            raise HTTPException(status_code=400, detail="asset_type is required")
        records = csv_handler.get_user_settings(blob_client, "investmentscontainer", current_user, asset_type)
        return records[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/wallet/record")
def save_wallet_record(asset_type: str = None, record: models.WalletRecord = None, current_user: str = Depends(verify_token)):
    """
    Save (create or update) a wallet record for the authenticated user.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    
    try:
        if not asset_type or not record:
            raise HTTPException(status_code=400, detail="asset_type and record are required")
        # Asegurar que el record pertenece al usuario autenticado
        if record.userId != current_user:
            raise HTTPException(status_code=403, detail="No puedes modificar datos de otro usuario")
        result = csv_handler.save_wallet_record(blob_client, "investmentscontainer", asset_type, record)
        return {"message": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/wallet/record")
def delete_wallet_record(asset_type: str = None, index: int = None, current_user: str = Depends(verify_token)):
    """
    Delete a wallet record by index for the authenticated user.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    
    try:
        if not asset_type or index is None:
            raise HTTPException(status_code=400, detail="asset_type and index are required")
        result = csv_handler.delete_wallet_record(blob_client, "investmentscontainer", asset_type, current_user, index)
        return {"message": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/wallet/stock")
def add_wallet_stock(asset_type: str = None, request: AddStockRequest = None, current_user: str = Depends(verify_token)):
    """
    Add a new stock/symbol (two columns: invested + holding) to the user's wallet CSV.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    
    try:
        if not asset_type or not request:
            raise HTTPException(status_code=400, detail="asset_type and stock_name are required")
        
        # Validar nombre del stock (máximo 10 caracteres, alfanumérico)
        stock_name = request.stock_name.strip().upper()
        if not stock_name or len(stock_name) > 10:
            raise HTTPException(status_code=400, detail="Stock name must be 1-10 characters")
        if not re.match(r'^[a-zA-Z0-9]+$', stock_name):
            raise HTTPException(status_code=400, detail="Stock name must be alphanumeric only")
        
        result = csv_handler.add_wallet_stock(blob_client, "investmentscontainer", asset_type, current_user, stock_name)
        return {"message": result, "stock_name": stock_name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/wallet/stock")
def rename_wallet_stock(asset_type: str = None, request: RenameStockRequest = None, current_user: str = Depends(verify_token)):
    """
    Rename a stock/symbol in the user's wallet CSV.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    
    try:
        if not asset_type or not request:
            raise HTTPException(status_code=400, detail="asset_type, old_name and new_name are required")
        
        old_name = request.old_name.strip().upper()
        new_name = request.new_name.strip().upper()
        
        if not new_name or len(new_name) > 10:
            raise HTTPException(status_code=400, detail="New name must be 1-10 characters")
        if not re.match(r'^[a-zA-Z0-9]+$', new_name):
            raise HTTPException(status_code=400, detail="New name must be alphanumeric only")
        
        result = csv_handler.rename_wallet_stock(blob_client, "investmentscontainer", asset_type, current_user, old_name, new_name)
        return {"message": result, "old_name": old_name, "new_name": new_name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/wallet/stock")
def delete_wallet_stock(asset_type: str = None, stock_name: str = None, current_user: str = Depends(verify_token)):
    """
    Delete a stock/symbol from the user's wallet CSV.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    
    try:
        if not asset_type or not stock_name:
            raise HTTPException(status_code=400, detail="asset_type and stock_name are required")
        
        stock_name = stock_name.strip().upper()
        result = csv_handler.delete_wallet_stock(blob_client, "investmentscontainer", asset_type, current_user, stock_name)
        return {"message": result, "stock_name": stock_name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))