import pandas as pd
import tempfile
import os
import json
from typing import Dict, Any

import models

# default color when symbol not found in data/symbol_colors.json
DEFAULT_COLOR = "#808080"


def get_wallet(blob_client, container: str, asset_type: str, user_id: str) -> Dict[str, Any]:
    blob_name = f"wallets/{asset_type}/{user_id}_wallet.csv"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
    tmp.close()
    try:
        blob_client.download_blob_to_path(container, blob_name, tmp.name)
        df = pd.read_csv(tmp.name)

        invested_suffix = "_invested_EUR"
        invested_cols = [c for c in df.columns if c.endswith(invested_suffix)]
        if not invested_cols:
            return df.to_dict(orient="records")

        bases = sorted({c[: -len(invested_suffix)] for c in invested_cols})

        # load symbol colors mapping if available
        colors = {}
        try:
            tmp_colors = tempfile.NamedTemporaryFile(delete=False, suffix=".json")
            tmp_colors.close()
            try:
                blob_client.download_blob_to_path(container, "data/symbol_colors.json", tmp_colors.name)
                with open(tmp_colors.name, "r", encoding="utf-8") as f:
                    colors = json.load(f)
            finally:
                try:
                    os.unlink(tmp_colors.name)
                except Exception:
                    pass
        except Exception:
            colors = {}

        records = []
        for _, row in df.iterrows():
            date_val = row.get("date") if "date" in df.columns else None
            assets = []
            for base in bases:
                qty = row.get(base) if base in df.columns else None
                invested = row.get(f"{base}{invested_suffix}")
                try:
                    qty_val = float(qty) if pd.notna(qty) else None
                except Exception:
                    qty_val = None
                try:
                    invested_val = float(invested) if pd.notna(invested) else None
                except Exception:
                    invested_val = None

                if qty_val is None and invested_val is None:
                    continue

                color = colors.get(base) or colors.get(base.upper()) or DEFAULT_COLOR
                assets.append({
                    "symbol": base,
                    "total_holding": qty_val,
                    "invested_EUR": invested_val,
                    "color": color,
                })

            records.append({"date": date_val, "assets": assets})

        return records
    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass

def get_user_settings(blob_client, container: str, user_id: str, asset_type: str):
    blob_name = f"data/user_settings_{asset_type}.csv"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
    tmp.close()
    try:
        blob_client.download_blob_to_path(container, blob_name, tmp.name)
        df = pd.read_csv(tmp.name, dtype=str)
        if "id" not in df.columns:
            raise ValueError(f"CSV {blob_name} does not contain 'id' column")
        matched = df[df["id"] == str(user_id)].copy()
        if "show_holdings" in matched.columns:
            def _to_bool(v):
                if pd.isna(v):
                    return None
                s = str(v).strip().lower()
                if s in ("1", "true", "t", "yes", "y"):
                    return True
                if s in ("0", "false", "f", "no", "n"):
                    return False
                try:
                    return bool(int(float(s)))
                except Exception:
                    return None

            matched["show_holdings"] = matched["show_holdings"].apply(_to_bool)
        records = matched.to_dict(orient="records")
        return records
    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass

def edit_wallet_record(blob_client, container: str, asset_type: str, record: models.WalletRecord) -> str:
    blob_name = f"wallets/{asset_type}/{record.userId}_wallet.csv"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
    tmp.close()
    try:
        blob_client.download_blob_to_path(container, blob_name, tmp.name)
        df = pd.read_csv(tmp.name)

        date_val = record.date
        
        if date_val is None:
            raise ValueError("Record must contain 'date' field")
        
        if date_val in df["date"].values and False:  # Second condition if add new record only
            raise ValueError(f"Record with date '{date_val}' already exists. Use index to update existing record.")

        # Prepare a dict for the new row
        new_row = {"date": date_val}
        for stock in record.stock:
            symbol = stock.symbol
            holding = stock.total_holding
            invested = stock.invested  # Adjusted to match frontend
            if symbol is None:
                continue
            new_row[symbol] = holding
            new_row[f"{symbol}_invested_EUR"] = invested

        # Check by index if it's a new row or an update
        if record.index is not None and 0 <= record.index < len(df):
            # Update existing row
            for key, value in new_row.items():
                df.at[record.index, key] = value
        else:
            # Append new row
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

        # Save back to CSV
        df.to_csv(tmp.name, index=False)
        blob_client.upload_blob_from_path(container, blob_name, tmp.name, overwrite=True)

        return f"Record for date '{date_val}' added/updated successfully."
    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass

def delete_wallet_record(blob_client, container: str, asset_type: str, user_id: str, date: str) -> str:
    blob_name = f"wallets/{asset_type}/wallet.csv"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
    tmp.close()
    try:
        blob_client.download_blob_to_path(container, blob_name, tmp.name)
        df = pd.read_csv(tmp.name)

        if date not in df["date"].values:
            raise ValueError(f"No record found with date '{date}' to delete.")

        # Delete the row with the matching date
        df = df[df["date"] != date]

        # Save back to CSV
        df.to_csv(tmp.name, index=False)
        blob_client.upload_blob_from_path(container, blob_name, tmp.name, overwrite=True)

        return f"Record with date '{date}' deleted successfully."
    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass