import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getWallet, getAssets, deleteWalletRecord, addWalletStock, renameWalletStock, deleteWalletStock } from '../api/api';
import { stockItem, WalletRecord } from '../types/types';
import AssetSelectionPanel from '../components/AssetSelectionPanel';
import WalletRecordEdit from '../components/WalletRecordEdit';
import StockManagerModal from '../components/StockManagerModal';
import { Modal, Button, ConfirmDialog, IconButton } from '../components/ui';

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
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  useEffect(() => {
    const fetchWallet = async () => {
      if (!userId || !asset) {
        setError('Missing required parameters.');
        return;
      }

      try {
        const data = await getWallet(userId, asset);
        setWalletData(data);
      } catch (e: any) {
        setError(`Failed to load wallet: ${e.message}`);
      }
    };

    fetchWallet();
  }, [userId, asset]);

  const fetchAssets = async () => {
    if (!userId) {
      setError('Missing required parameters.');
      return;
    }

    try {
      const data = await getAssets(userId);
      setAssets(data);
      setShowAssetPanel(true);
    } catch (e: any) {
      setError(`Failed to load assets: ${e.message}`);
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
      
      setTimeout(() => {
        setShowDeleteModal(false);
        setDeleteIndex(null);
        setDeleteSuccess(false);
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      setError(`Failed to delete: ${e.message}`);
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
        <div className="w-full max-w-5xl mx-auto bg-white p-4 sm:p-6 rounded-md shadow-xl">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="h-10 w-full sm:w-32 bg-gray-800 rounded animate-pulse"></div>
              <div className="h-10 w-full sm:w-36 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full sm:w-32 bg-orange-600 rounded animate-pulse"></div>
            </div>
          </div>
          {/* Table skeleton */}
          <div className="space-y-3 overflow-x-auto">
            {/* Header row */}
            <div className="flex space-x-4">
              <div className="h-10 w-28 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
            {/* Data rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-12 w-28 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-12 flex-1 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-12 flex-1 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-12 w-28 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const assetSymbols = walletData[0]?.assets.map((asset: any) => asset.symbol) || [];

  // Capitalizar primera letra
  const formatAssetName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Modal isOpen={showAssetPanel && !!userId} onClose={() => setShowAssetPanel(false)} size="sm">
        <AssetSelectionPanel userId={userId!} assets={assets} onClose={() => setShowAssetPanel(false)} currentAsset={asset} />
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowAssetPanel(false)}
          fullWidth
          className="mt-3"
        >
          Close
        </Button>
      </Modal>
      <Modal isOpen={showEditPanel && !!userId} size="md">
        {record && (
          <WalletRecordEdit 
            {...record} 
            onSave={handleSave} 
            onCancel={handleCancel} 
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Confirm deletion"
        message="Are you sure you want to delete this record?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleteLoading}
        success={deleteSuccess}
        successMessage="Record deleted successfully."
        variant="secondary"
      />
      <StockManagerModal
        isOpen={showStockManager}
        onClose={() => setShowStockManager(false)}
        stocks={assetSymbols}
        onAddStock={handleAddStock}
        onRenameStock={handleRenameStock}
        onDeleteStock={handleDeleteStock}
      />
      <div className="w-full max-w-5xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{formatAssetName(asset || '')} Wallet</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={fetchAssets}
            >
              Switch Asset
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowStockManager(true)}
            >
              Manage Stocks
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAddNewRecord}
            >
              New Record
            </Button>
          </div>
        </div>
        
        {/* Tabla responsive con scroll horizontal en móviles */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm sm:text-base min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-3 font-semibold text-gray-600 bg-gray-50/50 w-28">Date</th>
                {assetSymbols.map((symbol: string) => (
                  <th key={symbol} className="text-center py-3 px-2 border-x border-gray-300 font-semibold text-gray-900 bg-gray-50/50" colSpan={2}>
                    {symbol}
                  </th>
                ))}
                <th className="text-center py-3 px-3 font-semibold text-gray-600 bg-gray-50/50 w-28">Actions</th>
              </tr>
              <tr className="border-b border-gray-100">
                <th className="py-2 px-3"></th>
                {assetSymbols.map((symbol: string) => (
                  <React.Fragment key={symbol}>
                    <th className="py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Invested</th>
                    <th className="py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Holdings</th>
                  </React.Fragment>
                ))}
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {walletData.map((entry: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-1 px-3 text-gray-600 whitespace-nowrap text-sm">{formatDate(entry.date)}</td>
                  {assetSymbols.map((symbol: string) => {
                    const assetData = entry.assets.find((a: any) => a.symbol === symbol);
                    return (
                      <React.Fragment key={symbol}>
                        <td className="py-3 px-2 text-center border-l border-gray-200 text-gray-900 font-medium tabular-nums">
                          {assetData?.invested_EUR != null ? `€${assetData.invested_EUR.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-2 text-center border-r border-gray-200 text-gray-700 tabular-nums">
                          {assetData?.total_holding != null ? assetData.total_holding.toLocaleString() : '—'}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="py-1 px-3 text-center whitespace-nowrap">
                    <IconButton
                      icon="fi-sr-customize"
                      variant="warning"
                      onClick={() => fetchEditPanel(userId!, index, asset!, entry.date, entry.assets)}
                      title="Edit record"
                    />
                    <IconButton
                      icon="fi-sr-trash"
                      variant="danger"
                      onClick={() => handleDeleteClick(index)}
                      title="Delete record"
                      className="ml-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Wallet;