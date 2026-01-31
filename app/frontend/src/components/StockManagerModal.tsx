import { useState } from 'react';

interface StockManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: string[];
  onAddStock: (stockName: string) => Promise<void>;
  onRenameStock: (oldName: string, newName: string) => Promise<void>;
  onDeleteStock: (stockName: string) => Promise<void>;
}

export default function StockManagerModal({
  isOpen,
  onClose,
  stocks,
  onAddStock,
  onRenameStock,
  onDeleteStock,
}: StockManagerModalProps) {
  const [newStockName, setNewStockName] = useState('');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [deletingStock, setDeletingStock] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateName = (name: string): string | null => {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed) return 'El nombre es requerido';
    if (trimmed.length > 10) return 'Máximo 10 caracteres';
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return 'Solo letras y números';
    return null;
  };

  const handleAddStock = async () => {
    const trimmed = newStockName.trim().toUpperCase();
    const validationError = validateName(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (stocks.includes(trimmed)) {
      setError('Este stock ya existe');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onAddStock(trimmed);
      setNewStockName('');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al añadir');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (stock: string) => {
    setEditingStock(stock);
    setEditedName(stock);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingStock(null);
    setEditedName('');
    setError('');
  };

  const handleSaveEdit = async () => {
    if (!editingStock) return;

    const trimmed = editedName.trim().toUpperCase();
    const validationError = validateName(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (trimmed === editingStock) {
      handleCancelEdit();
      return;
    }

    if (stocks.includes(trimmed)) {
      setError('Este nombre ya existe');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onRenameStock(editingStock, trimmed);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al renombrar');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (stock: string) => {
    setDeletingStock(stock);
    setError('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingStock) return;

    setLoading(true);
    try {
      await onDeleteStock(deletingStock);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setLoading(false);
      setDeletingStock(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingStock(null);
  };

  const handleClose = () => {
    setNewStockName('');
    setEditingStock(null);
    setEditedName('');
    setDeletingStock(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
      <div className="bg-white p-4 sm:p-6 rounded-md shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Gestionar Stocks</h2>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Confirmation dialog for delete */}
        {deletingStock && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm mb-3">
              ¿Eliminar <strong>{deletingStock}</strong>? Se perderán todos los datos de este stock.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancelDelete}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 rounded text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}

        {/* Stock list */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">Stocks actuales</label>
          {stocks.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No hay stocks</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stocks.map((stock) => (
                <div
                  key={stock}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                >
                  {editingStock === stock ? (
                    <>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value.toUpperCase().slice(0, 10))}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={10}
                        disabled={loading}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Guardar"
                      >
                        <i className="fi fi-sr-check text-lg"></i>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Cancelar"
                      >
                        <i className="fi fi-sr-cross-small text-lg"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium text-sm">{stock}</span>
                      <button
                        onClick={() => handleStartEdit(stock)}
                        disabled={loading || deletingStock !== null}
                        className="p-1 text-green-500 hover:text-green-700 disabled:opacity-50"
                        title="Editar nombre"
                      >
                        <i className="fi fi-sr-customize text-base"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(stock)}
                        disabled={loading || deletingStock !== null}
                        className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                        title="Eliminar"
                      >
                        <i className="fi fi-sr-trash text-base"></i>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new stock */}
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <label className="block text-sm text-gray-600 mb-2">Añadir nuevo stock</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newStockName}
              onChange={(e) => setNewStockName(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="Ej: BTC, ETH, AAPL"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              maxLength={10}
              disabled={loading || editingStock !== null || deletingStock !== null}
            />
            <button
              onClick={handleAddStock}
              disabled={loading || !newStockName.trim() || editingStock !== null || deletingStock !== null}
              className={`px-4 py-2 rounded-md text-white text-sm ${
                loading || !newStockName.trim() || editingStock !== null || deletingStock !== null
                  ? 'bg-gray-400'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? '...' : 'Añadir'}
            </button>
          </div>
          <div className="text-right mt-1">
            <span className="text-xs text-gray-400">{newStockName.length}/10</span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="w-full px-4 py-3 sm:py-2 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 rounded-md"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
