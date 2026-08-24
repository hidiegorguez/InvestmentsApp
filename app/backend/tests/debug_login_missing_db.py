from fastapi import HTTPException
import main

try:
    main.login(main.LoginRequest(userId="demo", password="demo"))
    print("unexpected-success")
except HTTPException as exc:
    print(f"status={exc.status_code}")
    print(exc.detail)
