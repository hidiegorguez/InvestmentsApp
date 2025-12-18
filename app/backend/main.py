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


ASSET_TYPES = ["crypto", "etf", "stock"]

@app.get("/settings", response_model=Dict[str, Any])
def settings_route(container: str = "investmentscontainer", user_id: str = None):
    """Validate user_id by checking for associated wallet files and return user settings if found.
    Returns a dict of `UserSettings` records (may be empty) or a 404 if user not found.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    user_found = False
    for asset_type in ASSET_TYPES:
        blob_name_prefix = f"wallets/{asset_type}/{user_id}_wallet.csv"
        if blob_client.list_blobs(container, prefix=blob_name_prefix):
            user_found = True
            break

    if not user_found:
        raise HTTPException(status_code=404, detail="User not found")

    # If user is found, proceed to get settings. The frontend will call this endpoint
    # to validate the user, and then proceed to asset selection.
    # For simplicity, we'll return an empty dict for settings here, 
    # as the prompt only asked for login validation.
    return {"status": "User validated"}