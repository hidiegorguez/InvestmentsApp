export interface WalletRecord {
    userId: string;
    asset: string;
    index: number;
    date: string;
    stock: stockItem[];
}

export interface stockItem {
    symbol: string;
    total_holding: number;
    invested: number;
}