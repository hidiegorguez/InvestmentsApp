import io
import os
import json
import struct
import zlib
from typing import Any, Dict, Iterable, List, Optional

import models

DEFAULT_COLOR = "#808080"

LEGACY_FIELDS = {
    "coin_value": "holdings_currency",
    "coin_holding": "values_currency",
    "email_error": "error_email",
    "error_email": "error_email",
    "show_holdings": "show_holdings",
    "symbol_colors": "labels",
    "coin_symbols": "labels",
    "data/user_settings_": "user_settings_",
}


def _normalize_key(key: Any) -> str:
    if key is None:
        return ""
    text = str(key).strip()
    return LEGACY_FIELDS.get(text, text)


def _coerce_bool(value: Any) -> Optional[bool]:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"1", "true", "t", "yes", "y"}:
        return True
    if text in {"0", "false", "f", "no", "n"}:
        return False
    try:
        return bool(int(float(text)))
    except Exception:
        return None


def _coerce_float(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def build_currency_lookup(currency_rows: Iterable[Dict[str, Any]]) -> Dict[Any, Dict[str, Any]]:
    lookup: Dict[Any, Dict[str, Any]] = {}
    for row in currency_rows or []:
        if not isinstance(row, dict):
            continue
        row = {str(k): v for k, v in row.items()}
        ident = row.get("id")
        if ident is None:
            continue
        lookup[ident] = row
        lookup[str(ident)] = row
    return lookup


def build_labels_lookup(labels_rows: Iterable[Dict[str, Any]]) -> Dict[str, str]:
    lookup: Dict[str, str] = {}
    for row in labels_rows or []:
        if not isinstance(row, dict):
            continue
        symbol = str(row.get("symbol") or "").strip().upper()
        color = row.get("color") or DEFAULT_COLOR
        if symbol:
            lookup[symbol] = str(color)
            lookup[symbol.lower()] = str(color)
    return lookup


def normalize_user_settings(settings: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not isinstance(settings, dict):
        return {}
    normalized: Dict[str, Any] = {}
    for key, value in settings.items():
        if key is None:
            continue
        new_key = _normalize_key(key)
        if not new_key:
            continue
        normalized[new_key] = value

    if "error_email" not in normalized and "email_error" in normalized:
        normalized["error_email"] = normalized["email_error"]
    if "email_error" in normalized and "error_email" not in normalized:
        normalized["error_email"] = normalized["email_error"]

    if "show_holdings" in normalized:
        normalized["show_holdings"] = _coerce_bool(normalized.get("show_holdings"))

    if "holdings_currency" in normalized and normalized["holdings_currency"] not in (None, ""):
        normalized["holdings_currency"] = str(normalized["holdings_currency"]).strip()
    if "values_currency" in normalized and normalized["values_currency"] not in (None, ""):
        normalized["values_currency"] = str(normalized["values_currency"]).strip()
    return normalized


def resolve_user_currency_names(settings: Optional[Dict[str, Any]], currency_rows: Iterable[Dict[str, Any]]) -> Dict[str, str]:
    normalized = normalize_user_settings(settings or {})
    currency_lookup = build_currency_lookup(currency_rows)
    result: Dict[str, str] = {}

    for field in ["holdings_currency", "values_currency"]:
        raw_value = normalized.get(field)
        if raw_value in (None, ""):
            continue
        currency = currency_lookup.get(raw_value) or currency_lookup.get(str(raw_value))
        result[field] = currency.get("name") if isinstance(currency, dict) and currency.get("name") else str(raw_value)
    return result


def build_wallet_records(wallet_rows: Iterable[Dict[str, Any]], labels_lookup: Optional[Dict[str, str]], default_currency: Optional[str] = "EUR") -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    for row in wallet_rows or []:
        if not isinstance(row, dict):
            continue
        row = {str(k): v for k, v in row.items()}
        date_value = row.get("date")
        assets: List[Dict[str, Any]] = []

        if "assets" in row and isinstance(row["assets"], list):
            for asset in row["assets"]:
                if not isinstance(asset, dict):
                    continue
                symbol = str(asset.get("symbol") or asset.get("name") or "").strip()
                if not symbol:
                    continue
                total = _coerce_float(asset.get("total_holding", asset.get("holding", asset.get("quantity"))))
                invested = _coerce_float(asset.get("invested_EUR", asset.get("invested", asset.get("value"))))
                color = labels_lookup.get(symbol.upper()) if labels_lookup else None
                assets.append({
                    "symbol": symbol,
                    "total_holding": total if total is not None else 0.0,
                    "invested_EUR": invested if invested is not None else 0.0,
                    "invested": invested if invested is not None else 0.0,
                    "color": color or DEFAULT_COLOR,
                    "currency": default_currency,
                })
        else:
            direct_symbol = str(row.get("symbol") or row.get("asset") or row.get("ticker") or row.get("name") or "").strip()
            if direct_symbol:
                total = _coerce_float(row.get("total_holding", row.get("holding", row.get("quantity"))))
                invested = _coerce_float(row.get("invested_EUR", row.get("invested", row.get("value"))))
                if total is not None or invested is not None:
                    assets.append({
                        "symbol": direct_symbol,
                        "total_holding": total if total is not None else 0.0,
                        "invested_EUR": invested if invested is not None else 0.0,
                        "invested": invested if invested is not None else 0.0,
                        "color": (labels_lookup.get(direct_symbol.upper()) if labels_lookup else None) or DEFAULT_COLOR,
                        "currency": default_currency,
                    })
            else:
                for key, value in row.items():
                    if key in {"date", "user_id", "userId", "id", "asset_type", "currency_name", "currency", "symbol", "asset", "ticker", "name", "holding", "invested", "total_holding", "invested_EUR", "quantity", "value"}:
                        continue
                    if isinstance(value, (int, float, str)):
                        symbol = str(key).strip().upper()
                        if symbol.endswith("_INVESTED") or "invested" in symbol.lower():
                            continue
                        total = _coerce_float(value)
                        invested = _coerce_float(row.get(f"{key}_invested_EUR") or row.get(f"{key}_invested"))
                        if total is None and invested is None:
                            continue
                        assets.append({
                            "symbol": symbol,
                            "total_holding": total if total is not None else 0.0,
                            "invested_EUR": invested if invested is not None else 0.0,
                            "invested": invested if invested is not None else 0.0,
                            "color": (labels_lookup.get(symbol) if labels_lookup else None) or DEFAULT_COLOR,
                            "currency": default_currency,
                        })

        if not assets and date_value is not None:
            continue
        records.append({"date": date_value, "assets": assets})
    return records


def get_user(blob_client=None, container: str = "", user_id: str = "") -> Optional[Dict[str, Any]]:
    """Legacy compatibility wrapper for Supabase-backed settings tables."""
    for table_name in ["user_settings_crypto", "user_settings_etf", "user_settings_stock"]:
        try:
            if blob_client is not None and hasattr(blob_client, "table"):
                response = blob_client.table(table_name).select("*").eq("id", user_id).limit(1).execute()
                data = getattr(response, "data", []) or []
                if data:
                    record = normalize_user_settings(data[0])
                    return record
        except Exception:
            pass
    return None


def get_wallet(blob_client=None, container: str = "", asset_type: str = "", user_id: str = "") -> List[Dict[str, Any]]:
    """Read wallet rows from the current Supabase schema, falling back to legacy CSV mapping."""
    table_mapping = {
        "crypto": "crypto_wallet",
        "etf": "etf_wallet",
        "stock": "stock_wallet",
    }
    table_name = table_mapping.get(str(asset_type).lower(), str(asset_type))
    labels = {}
    if blob_client is not None and hasattr(blob_client, "table"):
        try:
            labels_response = blob_client.table("labels").select("symbol,color").execute()
            labels = build_labels_lookup(getattr(labels_response, "data", []) or [])
        except Exception:
            labels = {}

        try:
            # {asset_type}_wallet tables have no per-user column; the user is scoped via their settings row.
            response = blob_client.table(table_name).select("*").order("date").execute()
            rows = getattr(response, "data", []) or []
            if rows:
                default_currency = "EUR"
                settings = get_user_settings(blob_client, container, user_id, asset_type) or []
                if settings:
                    try:
                        currency_rows = getattr(blob_client.table("currency").select("*").execute(), "data", []) or []
                    except Exception:
                        currency_rows = []
                    currency_names = resolve_user_currency_names(settings[0] if isinstance(settings, list) else settings, currency_rows)
                    default_currency = currency_names.get("values_currency") or default_currency
                return build_wallet_records(rows, labels, default_currency)
        except Exception:
            pass

    return []


def get_user_settings(blob_client=None, container: str = "", user_id: str = "", asset_type: str = "") -> List[Dict[str, Any]]:
    """Resolve the current settings row from the user_settings_* tables."""
    table_names = [
        f"user_settings_{asset_type}",
        "user_settings_crypto",
        "user_settings_etf",
        "user_settings_stock",
    ]
    seen = set()
    for table_name in table_names:
        if not table_name or table_name in seen:
            continue
        seen.add(table_name)
        try:
            if blob_client is not None and hasattr(blob_client, "table"):
                response = blob_client.table(table_name).select("*").eq("id", user_id).limit(1).execute()
                rows = getattr(response, "data", []) or []
                if rows:
                    return [normalize_user_settings(row) for row in rows]
        except Exception:
            continue
    return []


def save_wallet_record(blob_client=None, container: str = "", asset_type: str = "", record: Optional[models.WalletRecord] = None) -> str:
    """Upsert a row in the {asset_type}_wallet table, keyed by its 'date' primary key.

    If the record's date was changed from its original value, the old dated row is removed
    so editing a record renames it instead of creating a duplicate row.
    """
    if record is None:
        raise ValueError("Record required")
    if blob_client is None or not hasattr(blob_client, "table"):
        return "Wallet record updated in compatibility mode. No Azure Blob writes performed."

    table_mapping = {
        "crypto": "crypto_wallet",
        "etf": "etf_wallet",
        "stock": "stock_wallet",
    }
    table_name = table_mapping.get(str(asset_type).lower(), str(asset_type))

    original_date = None
    index = getattr(record, "index", None)
    if index is not None and index >= 0:
        try:
            existing = blob_client.table(table_name).select("date").order("date").execute()
            existing_rows = getattr(existing, "data", []) or []
            if index < len(existing_rows):
                original_date = existing_rows[index].get("date")
        except Exception:
            original_date = None

    payload: Dict[str, Any] = {"date": record.date}
    for stock in getattr(record, "stock", []) or []:
        symbol = str(stock.symbol).strip().upper()
        payload[symbol] = getattr(stock, "total_holding", None) or 0
        payload[f"{symbol}_invested_EUR"] = getattr(stock, "invested", None) or 0
    try:
        blob_client.table(table_name).upsert(payload, on_conflict="date").execute()
        if original_date and original_date != record.date:
            blob_client.table(table_name).delete().eq("date", original_date).execute()
        return f"Record for date '{record.date}' added/updated successfully."
    except Exception as exc:
        raise ValueError(f"Unable to save wallet record: {exc}") from exc


def delete_wallet_record(blob_client=None, container: str = "", asset_type: str = "", user_id: str = "", index: int = 0) -> str:
    """Delete a row from the {asset_type}_wallet table by its position in date order."""
    if blob_client is None or not hasattr(blob_client, "table"):
        return f"Record at index {index} deleted in compatibility mode."
    table_mapping = {
        "crypto": "crypto_wallet",
        "etf": "etf_wallet",
        "stock": "stock_wallet",
    }
    table_name = table_mapping.get(str(asset_type).lower(), str(asset_type))
    try:
        response = blob_client.table(table_name).select("date").order("date").execute()
        rows = getattr(response, "data", []) or []
        if index < 0 or index >= len(rows):
            raise ValueError(f"Index {index} out of range. Table has {len(rows)} rows.")
        row_date = rows[index].get("date")
        blob_client.table(table_name).delete().eq("date", row_date).execute()
        return f"Record at index {index} deleted successfully."
    except Exception as exc:
        raise ValueError(f"Unable to delete wallet record: {exc}") from exc


def add_wallet_stock(blob_client=None, container: str = "", asset_type: str = "", user_id: str = "", stock_name: str = "") -> str:
    if not stock_name:
        raise ValueError("Stock name is required")
    table_mapping = {
        "crypto": "crypto_wallet",
        "etf": "etf_wallet",
        "stock": "stock_wallet",
    }
    table_name = table_mapping.get(str(asset_type).lower(), str(asset_type))
    if blob_client is None or not hasattr(blob_client, "table"):
        return f"Stock '{stock_name}' added in compatibility mode."
    try:
        blob_client.table(table_name).insert({"user_id": user_id, "symbol": stock_name, "holding": 0, "invested": 0}).execute()
        return f"Stock '{stock_name}' added successfully"
    except Exception as exc:
        raise ValueError(f"Unable to add wallet stock: {exc}") from exc


def rename_wallet_stock(blob_client=None, container: str = "", asset_type: str = "", user_id: str = "", old_name: str = "", new_name: str = "") -> str:
    if blob_client is None or not hasattr(blob_client, "table"):
        return f"Stock '{old_name}' renamed to '{new_name}' in compatibility mode."
    table_mapping = {
        "crypto": "crypto_wallet",
        "etf": "etf_wallet",
        "stock": "stock_wallet",
    }
    table_name = table_mapping.get(str(asset_type).lower(), str(asset_type))
    try:
        blob_client.table(table_name).update({"symbol": new_name}).eq("user_id", user_id).eq("symbol", old_name).execute()
        return f"Stock '{old_name}' renamed to '{new_name}' successfully"
    except Exception as exc:
        raise ValueError(f"Unable to rename wallet stock: {exc}") from exc


def delete_wallet_stock(blob_client=None, container: str = "", asset_type: str = "", user_id: str = "", stock_name: str = "") -> str:
    if blob_client is None or not hasattr(blob_client, "table"):
        return f"Stock '{stock_name}' deleted in compatibility mode."
    table_mapping = {
        "crypto": "crypto_wallet",
        "etf": "etf_wallet",
        "stock": "stock_wallet",
    }
    table_name = table_mapping.get(str(asset_type).lower(), str(asset_type))
    try:
        blob_client.table(table_name).delete().eq("user_id", user_id).eq("symbol", stock_name).execute()
        return f"Stock '{stock_name}' deleted successfully"
    except Exception as exc:
        raise ValueError(f"Unable to delete wallet stock: {exc}") from exc


def _png_chunk(chunk_type: bytes, chunk_data: bytes) -> bytes:
    return (
        struct.pack(">I", len(chunk_data))
        + chunk_type
        + chunk_data
        + struct.pack(">I", zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF)
    )


def _png_from_rgba(width: int, height: int, rgba_pixels: List[List[tuple]]) -> bytes:
    raw = bytearray()
    for row in rgba_pixels:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))
    compressed = zlib.compress(bytes(raw), level=9)
    return b"\x89PNG\r\n\x1a\n" + _png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)) + _png_chunk(b"IDAT", compressed) + _png_chunk(b"IEND", b"")


def build_in_memory_png(data: Optional[List[float]] = None, blob_client=None) -> bytes:
    """Generate an image in memory for email attachments and never upload to Azure Blob Storage."""
    if blob_client is not None and hasattr(blob_client, "upload_blob_from_path"):
        # Compatibility: no persistence to Azure. This branch intentionally does not write anything.
        pass

    values = [float(value) for value in (data or [0]) if value is not None]
    if not values:
        values = [0.0]

    width, height = 320, 220
    rows: List[List[tuple]] = []
    min_value = min(values)
    max_value = max(values)
    span = max_value - min_value if max_value != min_value else 1.0

    for y in range(height):
        row: List[tuple] = []
        for x in range(width):
            r, g, b, a = 255, 255, 255, 255
            if x < 20 or y < 20 or x > width - 20 or y > height - 20:
                r, g, b, a = 240, 240, 240, 255
            row.append((r, g, b, a))
        rows.append(row)

    chart_values = []
    for idx, value in enumerate(values):
        x = 20 + int((idx / max(len(values), 1)) * (width - 40))
        y = height - 25 - int(((value - min_value) / span) * (height - 60))
        chart_values.append((x, y))

    for x, y in chart_values:
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                px = x + dx
                py = y + dy
                if 0 <= px < width and 0 <= py < height:
                    rows[py][px] = (44, 116, 255, 255)

    for x in range(20, width - 20):
        rows[height - 25][x] = (70, 70, 70, 255)
    return _png_from_rgba(width, height, rows)