from pydantic import BaseModel
from typing import Optional
from typing import List


class UserSettings(BaseModel):
    id: str
    start_date: Optional[str] = None
    email: Optional[str] = None
    email_error: Optional[str] = None
    show_holdings: Optional[bool] = None

    class Config:
        orm_mode = True


class AssetPosition(BaseModel):
    symbol: str
    total_holding: Optional[float] = None
    invested_EUR: Optional[float] = None
    color: Optional[str] = None


class WalletDay(BaseModel):
    date: Optional[str] = None
    assets: List[AssetPosition] = []

    class Config:
        orm_mode = True
        
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
