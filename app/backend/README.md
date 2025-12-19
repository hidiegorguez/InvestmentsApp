# Investments Backend

Minimal FastAPI backend to expose CSV portfolios stored in Azure Blob Storage and allow appending movements.

Environment variables (one of the authentication methods):

- `AZURE_STORAGE_CONNECTION_STRING`
- or `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_KEY`

Run locally (recommended to use a virtualenv):

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Example requests:

List CSV portfolios in a container:

```bash
curl 'http://127.0.0.1:8000/portfolio?container=my-container'
```

**New Endpoint: /user/assets**

This endpoint allows you to check which assets a user has. It receives a `user_id` as a parameter and returns a list of asset types for which the user has a wallet file. If the user is not found, it returns a 404 error.

Example:

```bash
curl 'http://127.0.0.1:8000/user/assets?user_id=some_user_id'
```

Notes:
- The service downloads CSVs to a temporary file and uses `pandas` to read them.
- Appending or updating CSVs is intentionally not exposed via a public endpoint yet — implement a secured POST if you want frontend write access.
- This is a minimal scaffold to integrate with your existing projects (`investments` front-end and the Python email/dashboard tool). Adjust schemas and CSV formats as needed.

Blob structure
:
The backend assumes the following conventions in your container (example):

```
data/coin_symbols.json
data/symbol_colors.json
data/user_settings_crypto.csv
data/user_settings_etf.csv
data/user_settings_stock.csv
graphs/crypto/<id>_line_graph.png
graphs/crypto/<id>_pie_chart.png
wallets/crypto/<id>_wallet.csv
wallets/etf/<id>_wallet.csv
wallets/stock/<id>_wallet.csv
```

Use the `GET /wallet?container=<container>&asset_type=<crypto|stock|etf>&user_id=<id>` endpoint to fetch a wallet as JSON records.

The wallet response now includes a `color` field on each asset taken from `data/symbol_colors.json` when available. Example asset entry:

```
{"symbol":"IAUP.L","total_holding":61.71,"invested_EUR":1000,"color":"#F3BA2F"}
```

Get user settings for an asset type (filters `data/user_settings_{asset}.csv` by `id` column):

```
curl "http://127.0.0.1:8000/settings?asset_type=crypto&user_id=GPLKoW6RfaE"
```

If you need programmatic access from other scripts, use the `csv_handler` helpers directly (`get_wallet`, `get_user_settings`).

Default asset color
:
When a symbol is not present in `data/symbol_colors.json`, the backend attaches a default color `#808080` to the asset in the wallet response. Update `data/symbol_colors.json` in your blob container to customize colors.
```

WRITE_FILE: app/backend/README.md
```
# Investments Backend

Minimal FastAPI backend to expose CSV portfolios stored in Azure Blob Storage and allow appending movements.

Environment variables (one of the authentication methods):

- `AZURE_STORAGE_CONNECTION_STRING`
- or `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_KEY`

Run locally (recommended to use a virtualenv):

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Example requests:

List CSV portfolios in a container:

```bash
curl 'http://127.0.0.1:8000/portfolio?container=my-container'
```

**New Endpoint: /user/assets**

This endpoint allows you to check which assets a user has. It receives a `user_id` as a parameter and returns a list of asset types for which the user has a wallet file. If the user is not found, it returns a 404 error.

Example:

```bash
curl 'http://127.0.0.1:8000/user/assets?user_id=some_user_id'
```

Notes:
- The service downloads CSVs to a temporary file and uses `pandas` to read them.
- Appending or updating CSVs is intentionally not exposed via a public endpoint yet — implement a secured POST if you want frontend write access.
- This is a minimal scaffold to integrate with your existing projects (`investments` front-end and the Python email/dashboard tool). Adjust schemas and CSV formats as needed.

Blob structure
:
The backend assumes the following conventions in your container (example):

```
data/coin_symbols.json
data/symbol_colors.json
data/user_settings_crypto.csv
data/user_settings_etf.csv
data/user_settings_stock.csv
graphs/crypto/<id>_line_graph.png
graphs/crypto/<id>_pie_chart.png
wallets/crypto/<id>_wallet.csv
wallets/etf/<id>_wallet.csv
wallets/stock/<id>_wallet.csv
```

Use the `GET /wallet?container=<container>&asset_type=<crypto|stock|etf>&user_id=<id>` endpoint to fetch a wallet as JSON records.

The wallet response now includes a `color` field on each asset taken from `data/symbol_colors.json` when available. Example asset entry:

```
{"symbol":"","total_holding":0,"invested_EUR":0,"color":"#000000"}
```

Get user settings for an asset type (filters `data/user_settings_{asset}.csv` by `id` column):

```
curl "http://127.0.0.1:8000/settings?asset_type=crypto&user_id={user_id}"
```

If you need programmatic access from other scripts, use the `csv_handler` helpers directly (`get_wallet`, `get_user_settings`).

Default asset color
:
When a symbol is not present in `data/symbol_colors.json`, the backend attaches a default color `#808080` to the asset in the wallet response. Update `data/symbol_colors.json` in your blob container to customize colors.
```