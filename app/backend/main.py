from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
import models
from azure_blob import AzureBlobClient
import csv_handler
import re

load_dotenv()

app = FastAPI(title="Investments Backend")

try:
    blob_client = AzureBlobClient.from_env()
except Exception:
    blob_client = None

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
def get_wallet(user_id: str = None, asset_type: str = None):
    """Return wallet CSV (as JSON records) for a given `user_id` and `asset_type`.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    try:
        if not asset_type or not user_id:
            raise HTTPException(status_code=400, detail="asset_type and user_id are required")
        return csv_handler.get_wallet(blob_client, "investmentscontainer", asset_type, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/settings", response_model=Dict[str, Any])
def get_settings(user_id: str = None, asset_type: str = None):
    """
    Returns a dict of settings for a given `user_id` and `asset_type`.
    """
    if blob_client is None:
        raise HTTPException(status_code=500, detail="Azure Blob client not configured")
    
    try:
        if not asset_type or not user_id:
            raise HTTPException(status_code=400, detail="asset_type and user_id are required")
        records = csv_handler.get_user_settings(blob_client, "investmentscontainer", user_id, asset_type)
        return records[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))