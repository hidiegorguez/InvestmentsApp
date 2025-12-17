from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List

import models

from azure_blob import AzureBlobClient
import csv_handler

load_dotenv()

app = FastAPI(title="Investments Backend")

try:
    blob_client = AzureBlobClient.from_env()
except Exception:
    blob_client = None

@app.get("/wallet", response_model=List[models.WalletDay])
def wallet_route(container: str = "investmentscontainer", asset_type: str = None, user_id: str = None):
    """Return wallet CSV (as JSON records) for a given `asset_type` and `user_id`.

    Example path in blob: `wallets/crypto/GPLKoW6RfaE_wallet.csv`
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    try:
        if not asset_type or not user_id:
            raise HTTPException(status_code=400, detail="asset_type and user_id are required")
        return csv_handler.get_wallet(blob_client, container, asset_type, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings", response_model=List[models.UserSettings])
def settings_route(container: str = "investmentscontainer", asset_type: str = None, user_id: str = None):
    """Return user settings from data/user_settings_{asset_type}.csv filtered by `id` (user_id).

    Returns a list of `UserSettings` records (may be empty).
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    if not asset_type or not user_id:
        raise HTTPException(status_code=400, detail="asset_type and user_id are required")
    try:
        return csv_handler.get_user_settings(blob_client, container, asset_type, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))