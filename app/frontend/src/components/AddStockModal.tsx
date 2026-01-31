import { useState } from 'react';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stockName: string) => Promise<void>;
  isLoading?: boolean;
}

export default function AddStockModal({ isOpen, onClose, onSave, isLoading }: AddStockModalProps) {
  const [stockName, setStockName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmed = stockName.trim().toUpperCase();
    
    if (!trimmed) {
      setError('El nombre es requerido');
      return;
    }
    if (trimmed.length > 10) {
      setError('Máximo 10 caracteres');
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
      setError('Solo letras y números');
      return;
    }

    setError('');
    try {
      await onSave(trimmed);
      setStockName('');
      // Reload después de guardar exitosamente
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleClose = () => {
    setStockName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
      <div className="bg-white p-4 sm:p-6 rounded-md shadow-md w-full max-w-sm">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Añadir Stock</h2>
        
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">
            Símbolo del activo (máx. 10 caracteres)
          </label>
          <input
            type="text"
            value={stockName}
            onChange={(e) => setStockName(e.target.value.toUpperCase().slice(0, 10))}
            placeholder="Ej: BTC, ETH, AAPL"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={10}
            disabled={isLoading}
            autoFocus
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-red-500">{error}</span>
            <span className="text-xs text-gray-400">{stockName.length}/10</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 sm:py-2 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 rounded-md order-2 sm:order-1"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !stockName.trim()}
            className={`flex-1 px-4 py-3 sm:py-2 rounded-md text-white order-1 sm:order-2 ${
              isLoading || !stockName.trim() 
                ? 'bg-gray-400' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
