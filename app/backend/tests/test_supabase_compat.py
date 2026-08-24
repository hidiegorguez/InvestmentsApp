import io

import main
from fastapi import HTTPException

from csv_handler import (
    build_currency_lookup,
    build_labels_lookup,
    normalize_user_settings,
    resolve_user_currency_names,
    build_wallet_records,
    build_in_memory_png,
)


def test_resolve_user_currency_names_from_relations():
    settings = {"id": "u1", "holdings_currency": 2, "values_currency": 1}
    currencies = [
        {"id": 1, "name": "EUR", "code": "€"},
        {"id": 2, "name": "USD", "code": "$"},
    ]

    result = resolve_user_currency_names(settings, currencies)

    assert result == {"holdings_currency": "USD", "values_currency": "EUR"}


def test_normalize_user_settings_uses_error_email_alias():
    settings = {
        "id": "u1",
        "email": "demo@example.com",
        "email_error": "broken@example.com",
        "show_holdings": "true",
    }

    normalized = normalize_user_settings(settings)

    assert normalized["error_email"] == "broken@example.com"
    assert normalized["show_holdings"] is True


def test_build_labels_lookup_and_wallet_records():
    labels = [
        {"symbol": "BTC", "color": "#E3AA2F"},
        {"symbol": "ETH", "color": "#3838FB"},
    ]
    wallet_rows = [
        {"date": "2024-01-01", "symbol": "BTC", "holding": 1.5, "invested": 100.0},
        {"date": "2024-01-01", "symbol": "ETH", "holding": 2.0, "invested": 150.0},
    ]

    labels_lookup = build_labels_lookup(labels)
    wallet = build_wallet_records(wallet_rows, labels_lookup, "USD")

    assert labels_lookup["BTC"] == "#E3AA2F"
    assert wallet[0]["assets"][0]["symbol"] == "BTC"
    assert wallet[0]["assets"][0]["color"] == "#E3AA2F"
    assert wallet[0]["assets"][0]["currency"] == "USD"


def test_build_currency_lookup_and_png_are_memory_only():
    currencies = [
        {"id": 1, "name": "EUR", "code": "€"},
        {"id": 2, "name": "USD", "code": "$"},
    ]
    lookup = build_currency_lookup(currencies)
    png = build_in_memory_png(data=[1, 2, 3])

    assert lookup[2] == {"id": 2, "name": "USD", "code": "$"}
    assert isinstance(png, bytes)
    assert png.startswith(b"\x89PNG")

    class FakeBlobClient:
        def upload_blob_from_path(self, *args, **kwargs):
            raise AssertionError("Azure Blob upload should not be used for generated PNGs")

    png_2 = build_in_memory_png(data=[1, 2, 3], blob_client=FakeBlobClient())
    assert isinstance(png_2, bytes)


def test_login_returns_401_on_invalid_bcrypt_hash():
    original_client = main.db_client
    original_get_user = main.csv_handler.get_user

    main.db_client = object()
    main.csv_handler.get_user = lambda *args, **kwargs: {"id": "u1", "password_hash": "not-a-valid-bcrypt-hash"}

    try:
        try:
            main.login(main.LoginRequest(userId="u1", password="secret"))
            raise AssertionError("Expected HTTPException with 401")
        except HTTPException as exc:
            assert exc.status_code == 401
            assert exc.detail == "Usuario o contraseña incorrectos"
    finally:
        main.db_client = original_client
        main.csv_handler.get_user = original_get_user
