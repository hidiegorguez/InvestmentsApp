import React, { useState, useEffect } from 'react';
import { WalletRecord } from '../types/types';
import { saveWalletRecord } from '../api/api';

interface WalletRecordEditProps extends WalletRecord {
  onSave: (record: WalletRecord) => void;
  onCancel: () => void;
}

const WalletRecordEdit: React.FC<WalletRecordEditProps> = ({ userId, asset, index, date, stock, onSave, onCancel }) => {
  const [editDate, setEditDate] = useState(date);
  const [editStock, setEditStock] = useState(stock);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sincronizar el estado inicial con los valores actuales de stock
  useEffect(() => {
    setEditDate(date);
    setEditStock(stock);
  }, [date, stock]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditDate(e.target.value);
  };

  const handleStockChange = (symbol: string, field: 'total_holding' | 'invested', value: number) => {
    setEditStock((prevStock) =>
      prevStock.map((item) =>
        item.symbol === symbol ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async () => {
    const updatedRecord: WalletRecord = {
      userId,
      asset,
      index,
      date: editDate,
      stock: editStock,
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
            {editStock.map((asset) => (
              <li key={asset.symbol} className="mb-4">
                <span className="font-bold block mb-1">{asset.symbol}</span>
                <label className="block text-sm font-medium mb-1">Holding:</label>
                <input
                  type="number"
                  value={asset.total_holding}
                  onChange={(e) =>
                    handleStockChange(asset.symbol, 'total_holding', parseFloat(e.target.value))
                  }
                  className="w-full p-2 border rounded-md mb-2"
                />
                <label className="block text-sm font-medium mb-1">Invested (EUR):</label>
                <input
                  type="number"
                  value={asset.invested}
                  onChange={(e) =>
                    handleStockChange(asset.symbol, 'invested', parseFloat(e.target.value))
                  }
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
