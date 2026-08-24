import React, { useState, useEffect } from 'react';
import { WalletRecord } from '../types/types';
import { saveWalletRecord } from '../api/api';
import { Button, Input } from './ui';

interface WalletRecordEditProps extends WalletRecord {
  onSave: (record: WalletRecord) => void;
  onCancel: () => void;
}

const WalletRecordEdit: React.FC<WalletRecordEditProps> = ({ userId, asset, index, date, stock, onSave, onCancel }) => {
  const [editDate, setEditDate] = useState(date);
  const [editStock, setEditStock] = useState<Record<string, { total_holding: string; invested: string }>>(
    () => {
      const initial: Record<string, { total_holding: string; invested: string }> = {};
      stock.forEach((item) => {
        initial[item.symbol] = {
          total_holding: String(item.total_holding ?? 0),
          invested: String(item.invested ?? 0),
        };
      });
      return initial;
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setEditDate(date);
    const initial: Record<string, { total_holding: string; invested: string }> = {};
    stock.forEach((item) => {
      initial[item.symbol] = {
        total_holding: String(item.total_holding ?? 0),
        invested: String(item.invested ?? 0),
      };
    });
    setEditStock(initial);
  }, [date, stock]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditDate(e.target.value);
  };

  const handleStockChange = (symbol: string, field: 'total_holding' | 'invested', value: string) => {
    setEditStock((prev) => ({
      ...prev,
      [symbol]: { ...prev[symbol], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    const updatedStock = stock.map((item) => ({
      symbol: item.symbol,
      total_holding: parseFloat(editStock[item.symbol]?.total_holding) || 0,
      invested: parseFloat(editStock[item.symbol]?.invested) || 0,
    }));

    const updatedRecord: WalletRecord = {
      userId,
      asset,
      index,
      date: editDate,
      stock: updatedStock,
    };

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await saveWalletRecord(updatedRecord.asset, updatedRecord);
      setSuccessMessage('Changes saved successfully.');
      
      setTimeout(() => {
        onSave(updatedRecord);
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      setError(`Failed to save: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="max-h-[70vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Edit Record</h2>
        <div className="mb-4">
          <Input
            type="date"
            label="Date"
            value={editDate}
            onChange={handleDateChange}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Assets</h3>
          <div className="space-y-3">
            {stock.map((item) => (
              <div key={item.symbol} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="font-semibold block mb-3 text-gray-900">{item.symbol}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Holdings"
                    type="text"
                    inputMode="decimal"
                    value={editStock[item.symbol]?.total_holding ?? ''}
                    onChange={(e) => handleStockChange(item.symbol, 'total_holding', e.target.value)}
                  />
                  <Input
                    label="Invested (€)"
                    type="text"
                    inputMode="decimal"
                    value={editStock[item.symbol]?.invested ?? ''}
                    onChange={(e) => handleStockChange(item.symbol, 'invested', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-end mt-5 pt-4 border-t border-gray-100">
        {successMessage ? (
          <div className="text-center text-emerald-600 py-2">
            {successMessage}
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={onCancel}
                disabled={loading}
                className="order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={loading}
                className="order-1 sm:order-2"
              >
                Save Changes
              </Button>
            </div>
            {error && (
              <div className="mt-4 text-center text-red-600 text-sm">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WalletRecordEdit;
