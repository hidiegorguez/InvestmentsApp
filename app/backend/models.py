from pydantic import BaseModel
from typing import Optional, List, Any, Dict


class UserSettings(BaseModel):
    id: Optional[str] = None
    start_date: Optional[str] = None
    email: Optional[str] = None
    error_email: Optional[str] = None
    email_error: Optional[str] = None
    show_holdings: Optional[bool] = None
    holdings_currency: Optional[int] = None
    values_currency: Optional[int] = None

    class Config:
        from_attributes = True


class Currency(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    code: Optional[str] = None


class Labels(BaseModel):
    symbol: Optional[str] = None
    color: Optional[str] = None


class AssetPosition(BaseModel):
    symbol: str
    total_holding: Optional[float] = None
    invested_EUR: Optional[float] = None
    invested: Optional[float] = None
    color: Optional[str] = None
    currency: Optional[str] = None


class WalletDay(BaseModel):
    date: Optional[str] = None
    assets: List[AssetPosition] = []

    class Config:
        from_attributes = True


class StockItem(BaseModel):
    symbol: str
    total_holding: float
    invested: float


class WalletRecord(BaseModel):
    userId: str
    asset: str
    index: int
    date: str
    stock: List[StockItem]


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    assets: List[str] = []


class SettingsResponse(BaseModel):
    id: Optional[str] = None
    start_date: Optional[str] = None
    email: Optional[str] = None
    error_email: Optional[str] = None
    show_holdings: Optional[bool] = None
    holdings_currency: Optional[str] = None
    values_currency: Optional[str] = None
    currency_lookup: Dict[str, Any] = {}
    labels: Dict[str, str] = {}
