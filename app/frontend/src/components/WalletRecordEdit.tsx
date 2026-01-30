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
      setSuccessMessage('Operación realizada con éxito.');
      
      // Esperar antes de cerrar y recargar
      setTimeout(() => {
        onSave(updatedRecord);
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      setError(`Error al guardar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-xl bg-blue p-6 rounded-md shadow-xl">
        <h2 className="text-2xl font-semibold mb-4">Edit operation</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Date:</label>
          <input
            type="date"
            value={editDate}
            onChange={handleDateChange}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Assets</h3>
          <ul>
            {stock.map((item) => (
              <li key={item.symbol} className="mb-4">
                <span className="font-bold block mb-1">{item.symbol}</span>
                <label className="block text-sm font-medium mb-1">Holding:</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editStock[item.symbol]?.total_holding ?? ''}
                  onChange={(e) => handleStockChange(item.symbol, 'total_holding', e.target.value)}
                  className="w-full p-2 border rounded-md mb-2"
                />
                <label className="block text-sm font-medium mb-1">Invested (EUR):</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editStock[item.symbol]?.invested ?? ''}
                  onChange={(e) => handleStockChange(item.symbol, 'invested', e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-end mt-4">
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md mr-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'}`}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {successMessage && (
            <div className="mt-4 text-center text-green-500">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mt-4 text-center text-red-500">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletRecordEdit;
