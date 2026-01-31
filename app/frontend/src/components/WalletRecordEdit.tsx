import React, { useState, useEffect } from 'react';
import { WalletRecord } from '../types/types';
import { saveWalletRecord } from '../api/api';

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
          total_holding: String(item.total_holding),
          invested: String(item.invested),
        };
      });
      return initial;
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sincronizar el estado inicial con los valores actuales de stock
  useEffect(() => {
    setEditDate(date);
    const initial: Record<string, { total_holding: string; invested: string }> = {};
    stock.forEach((item) => {
      initial[item.symbol] = {
        total_holding: String(item.total_holding),
        invested: String(item.invested),
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={editDate}
            onChange={handleDateChange}
            className="w-full p-3 sm:p-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Assets</h3>
          <div className="space-y-3">
            {stock.map((item) => (
              <div key={item.symbol} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="font-semibold block mb-3 text-gray-900">{item.symbol}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Holdings</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editStock[item.symbol]?.total_holding ?? ''}
                      onChange={(e) => handleStockChange(item.symbol, 'total_holding', e.target.value)}
                      className="w-full p-3 sm:p-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Invested (€)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editStock[item.symbol]?.invested ?? ''}
                      onChange={(e) => handleStockChange(item.symbol, 'invested', e.target.value)}
                      className="w-full p-3 sm:p-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
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
                <button
                  onClick={onCancel}
                  className="px-4 py-3 sm:py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg order-2 sm:order-1 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className={`px-4 py-3 sm:py-2.5 rounded-lg text-white order-1 sm:order-2 font-medium transition-colors ${loading ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'}`}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
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
