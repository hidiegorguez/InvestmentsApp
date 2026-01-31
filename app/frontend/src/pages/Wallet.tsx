import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getWallet, getAssets, deleteWalletRecord, addWalletStock, renameWalletStock, deleteWalletStock } from '../api/api';
import { stockItem, WalletRecord } from '../types/types';
import AssetSelectionPanel from '../components/AssetSelectionPanel';
import WalletRecordEdit from '../components/WalletRecordEdit';
import StockManagerModal from '../components/StockManagerModal';

const Wallet: React.FC = () => {
  const { userId, asset } = useParams<{ userId: string; asset: string }>();

  const [walletData, setWalletData] = useState<any>(null);
  const [record, setRecord] = useState<WalletRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAssetPanel, setShowAssetPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [assets, setAssets] = useState<string[]>([]);
  const [showStockManager, setShowStockManager] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  useEffect(() => {
    const fetchWallet = async () => {
      if (!userId || !asset) {
        setError('Faltan parámetros necesarios.');
        return;
      }

      try {
        const data = await getWallet(userId, asset);
        setWalletData(data);
      } catch (e: any) {
        setError(`Error al obtener la billetera: ${e.message}`);
      }
    };

    fetchWallet();
  }, [userId, asset]);

  const fetchAssets = async () => {
    if (!userId) {
      setError('Faltan parámetros necesarios para obtener los assets.');
      return;
    }

    try {
      const data = await getAssets(userId);
      setAssets(data);
      setShowAssetPanel(true);
    } catch (e: any) {
      setError(`Error al obtener los assets: ${e.message}`);
    }
  };

  const transformStockData = (assets: any[]): stockItem[] => {
    return assets.map((asset) => ({
      symbol: asset.symbol,
      total_holding: asset.total_holding,
      invested: asset.invested_EUR,
    }));
  };

  const fetchEditPanel = (userId: string, index: number, asset: string, date: string, stock: any[]) => {
    const transformedStock = transformStockData(stock);
    const record: WalletRecord = { userId, asset, index, date, stock: transformedStock };
    setRecord(record);
    setShowEditPanel(true);
  };

  const handleSave = (updatedRecord: WalletRecord) => {
    setShowEditPanel(false);
  };

  const handleCancel = () => {
    setShowEditPanel(false);
  };

  const handleDeleteClick = (index: number) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userId || !asset || deleteIndex === null) return;
    
    setDeleteLoading(true);
    try {
      await deleteWalletRecord(asset, userId, deleteIndex);
      setDeleteSuccess(true);
      
      // Esperar antes de cerrar y recargar
      setTimeout(() => {
        setShowDeleteModal(false);
        setDeleteIndex(null);
        setDeleteSuccess(false);
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      setError(`Error al eliminar: ${e.message}`);
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const handleAddNewRecord = () => {
    const emptyRecord: WalletRecord = {
      userId: userId!,
      asset: asset!,
      index: walletData.length, // Asumimos que el índice es el siguiente en la lista
      date: new Date().toISOString().split('T')[0], // Fecha actual en formato ISO
      stock: assetSymbols.map((symbol: string) => ({
        symbol,
        total_holding: 0,
        invested: 0,
      })),
    };
    setRecord(emptyRecord);
    setShowEditPanel(true);
  };

  const handleAddStock = async (stockName: string) => {
    if (!asset) return;
    await addWalletStock(asset, stockName);
  };

  const handleRenameStock = async (oldName: string, newName: string) => {
    if (!asset) return;
    await renameWalletStock(asset, oldName, newName);
  };

  const handleDeleteStock = async (stockName: string) => {
    if (!asset) return;
    await deleteWalletStock(asset, stockName);
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!walletData) {
    return (
      <div className="flex flex-col items-center justify-center p-2 sm:p-6">
        <div className="w-full bg-white p-4 sm:p-6 rounded-md shadow-xl">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="h-10 w-full sm:w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full sm:w-36 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          {/* Table skeleton */}
          <div className="space-y-3 overflow-x-auto">
            {/* Header row */}
            <div className="flex space-x-4 min-w-150">
              <div className="h-10 w-24 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            {/* Data rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4 min-w-150">
                <div className="h-12 w-24 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-12 flex-1 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-12 flex-1 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-12 w-20 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const assetSymbols = walletData[0]?.assets.map((asset: any) => asset.symbol) || [];

  return (
    <div className="flex flex-col items-center justify-center">
      {showAssetPanel && userId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-10 p-4\">
          <div className="bg-gray-200 p-4 rounded-md shadow-md w-full max-w-sm sm:max-w-md\">
            <AssetSelectionPanel userId={userId} assets={assets} onClose={() => setShowAssetPanel(false)} />
            <button
              onClick={() => setShowAssetPanel(false)}
              className="mt-2 w-full bg-red-700 text-white px-4 py-3 sm:py-2 rounded hover:bg-red-800 active:bg-red-900\"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showEditPanel && userId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-10 p-4 overflow-y-auto\">
          <div className="bg-gray-200 p-4 rounded-md shadow-md w-full max-w-sm sm:max-w-md my-4\">
            {record && (
              <WalletRecordEdit 
                {...record} 
                onSave={handleSave} 
                onCancel={handleCancel} 
              />
            )}
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-md shadow-md w-full max-w-sm">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Confirmar eliminación</h2>
            {deleteSuccess ? (
              <p className="mb-6 text-green-500 text-center">Registro eliminado con éxito.</p>
            ) : (
              <>
                <p className="mb-6 text-sm sm:text-base">¿Estás seguro de que quieres eliminar este registro?</p>
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                  <button
                    onClick={handleDeleteCancel}
                    className="px-4 py-3 sm:py-2 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 rounded-md order-2 sm:order-1"
                    disabled={deleteLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className={`px-4 py-3 sm:py-2 rounded-md text-white order-1 sm:order-2 ${deleteLoading ? 'bg-gray-500' : 'bg-red-500 hover:bg-red-600 active:bg-red-700'}`}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <StockManagerModal
        isOpen={showStockManager}
        onClose={() => setShowStockManager(false)}
        stocks={assetSymbols}
        onAddStock={handleAddStock}
        onRenameStock={handleRenameStock}
        onDeleteStock={handleDeleteStock}
      />
      <div className="w-full bg-white p-3 sm:p-6 rounded-md shadow-xl relative">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold\">{asset?.toUpperCase()} WALLET</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={fetchAssets}
              className="bg-orange-600 text-white px-4 py-2 sm:py-2 rounded text-sm font-medium hover:bg-orange-700 active:bg-orange-800"
            >
              Change Asset
            </button>
            <button
              onClick={() => setShowStockManager(true)}
              className="bg-blue-600 text-white px-4 py-2 sm:py-2 rounded text-sm font-medium hover:bg-blue-700 active:bg-blue-800"
            >
              Edit Stocks
            </button>
            <button
              onClick={handleAddNewRecord}
              className="bg-green-600 text-white px-4 py-2 sm:py-2 rounded text-sm font-medium hover:bg-green-700 active:bg-green-800"
            >
              Add New Record
            </button>
          </div>
        </div>
        
        {/* Tabla responsive con scroll horizontal en móviles */}
        <div className="overflow-x-auto -mx-3 sm:mx-0\">
          <div className="min-w-150 px-3 sm:px-0\">
            <table className="table-auto w-full border-collapse border border-gray-300 text-xs sm:text-sm\">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-100\">Date</th>
                  {assetSymbols.map((symbol: string) => (
                    <React.Fragment key={symbol}>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-200\" colSpan={2}>{symbol}</th>
                    </React.Fragment>
                  ))}
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-100\">Actions</th>
                </tr>
                <tr>
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-100\"></th>
                  {assetSymbols.map((symbol: string) => (
                    <React.Fragment key={symbol}>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-200 text-xs\">Invested</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-200 text-xs\">Holding</th>
                    </React.Fragment>
                  ))}
                  <th className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-100\"></th>
                </tr>
              </thead>
              <tbody>
                {walletData.map((entry: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-50 whitespace-nowrap\">{formatDate(entry.date)}</td>
                    {assetSymbols.map((symbol: string) => {
                      const asset = entry.assets.find((a: any) => a.symbol === symbol);
                      return (
                        <React.Fragment key={symbol}>
                          <td className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-100 text-right\">{asset?.invested_EUR || '-'}</td>
                          <td className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-100 text-right\">{asset?.total_holding || '-'}</td>
                        </React.Fragment>
                      );
                    })}
                    <td className="border border-gray-300 px-2 sm:px-4 py-2 bg-gray-50 text-center whitespace-nowrap\">
                      <button className="text-green-500 hover:text-green-700 active:text-green-800 mx-1 sm:mx-2 p-1\"
                              onClick={() => fetchEditPanel(userId!, index, asset!, entry.date, entry.assets)}>
                        <i className="fi fi-sr-customize text-lg sm:text-base\"></i>
                      </button>
                      <button className="text-red-500 hover:text-red-700 active:text-red-800 mx-1 sm:mx-2 p-1\"
                              onClick={() => handleDeleteClick(index)}>
                        <i className="fi fi-sr-trash text-lg sm:text-base\"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;