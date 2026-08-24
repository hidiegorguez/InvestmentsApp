from csv_handler import (
    build_currency_lookup,
    build_labels_lookup,
    normalize_user_settings,
    resolve_user_currency_names,
    build_wallet_records,
    build_in_memory_png,
)

settings = {"id": "u1", "holdings_currency": 2, "values_currency": 1}
currencies = [
    {"id": 1, "name": "EUR", "code": "€"},
    {"id": 2, "name": "USD", "code": "$"},
]
assert resolve_user_currency_names(settings, currencies) == {
    "holdings_currency": "USD",
    "values_currency": "EUR",
}

settings2 = {
    "id": "u1",
    "email": "demo@example.com",
    "email_error": "broken@example.com",
    "show_holdings": "true",
}
normalized = normalize_user_settings(settings2)
assert normalized["error_email"] == "broken@example.com"
assert normalized["show_holdings"] is True

labels = [
    {"symbol": "BTC", "color": "#E3AA2F"},
    {"symbol": "ETH", "color": "#3838FB"},
]
wallet_rows = [
    {"date": "2024-01-01", "symbol": "BTC", "holding": 1.5, "invested": 100.0},
    {"date": "2024-01-01", "symbol": "ETH", "holding": 2.0, "invested": 150.0},
]
lookup = build_labels_lookup(labels)
wallet = build_wallet_records(wallet_rows, lookup, "USD")
assert lookup["BTC"] == "#E3AA2F"
assert wallet[0]["assets"][0]["symbol"] == "BTC"
assert wallet[0]["assets"][0]["currency"] == "USD"

assert build_currency_lookup(currencies)[2]["name"] == "USD"
png = build_in_memory_png(data=[1, 2, 3])
assert isinstance(png, bytes)
assert png.startswith(b"\x89PNG")
print("verification: OK")
