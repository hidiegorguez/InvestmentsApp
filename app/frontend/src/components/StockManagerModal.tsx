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
    if (!trimmed) return 'Name is required';
    if (trimmed.length > 10) return 'Max 10 characters';
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return 'Letters and numbers only';
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
      setError('This stock already exists');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onAddStock(trimmed);
      setNewStockName('');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add');
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
      setError('This name already exists');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onRenameStock(editingStock, trimmed);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename');
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
      setError(err instanceof Error ? err.message : 'Failed to delete');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 p-4">
      <div className="bg-white p-5 sm:p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Manage Stocks</h2>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Confirmation dialog for delete */}
        {deletingStock && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">
              Delete <strong className="text-gray-900">{deletingStock}</strong>? All data for this stock will be lost.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancelDelete}
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Stock list */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Current stocks</label>
          {stocks.length === 0 ? (
            <p className="text-gray-400 text-sm italic py-3">No stocks yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stocks.map((stock) => (
                <div
                  key={stock}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  {editingStock === stock ? (
                    <>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value.toUpperCase().slice(0, 10))}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={10}
                        disabled={loading}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 transition-colors"
                        title="Save"
                      >
                        <i className="fi fi-sr-check text-lg"></i>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Cancel"
                      >
                        <i className="fi fi-sr-cross-small text-lg"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium text-gray-900">{stock}</span>
                      <button
                        onClick={() => handleStartEdit(stock)}
                        disabled={loading || deletingStock !== null}
                        className="p-1.5 text-gray-400 hover:text-orange-500 disabled:opacity-50 transition-colors"
                        title="Rename"
                      >
                        <i className="fi fi-sr-customize text-base"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(stock)}
                        disabled={loading || deletingStock !== null}
                        className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-50 transition-colors"
                        title="Delete"
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
        <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Add new stock</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newStockName}
              onChange={(e) => setNewStockName(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="e.g. BTC, AAPL, MSFT"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              maxLength={10}
              disabled={loading || editingStock !== null || deletingStock !== null}
            />
            <button
              onClick={handleAddStock}
              disabled={loading || !newStockName.trim() || editingStock !== null || deletingStock !== null}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                loading || !newStockName.trim() || editingStock !== null || deletingStock !== null
                  ? 'bg-gray-300'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {loading ? '...' : 'Add'}
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
          className="w-full px-4 py-3 sm:py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
