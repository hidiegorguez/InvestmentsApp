import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getWallet, getAssets } from '../api/api';
import { stockItem, WalletRecord } from '../types/types';
import AssetSelectionPanel from '../components/AssetSelectionPanel';
import WalletRecordEdit from '../components/WalletRecordEdit';

const Wallet: React.FC = () => {
  const { userId, asset } = useParams<{ userId: string; asset: string }>();

  const [walletData, setWalletData] = useState<any>(null);
  const [record, setRecord] = useState<WalletRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAssetPanel, setShowAssetPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [assets, setAssets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSave = async (updatedRecord: WalletRecord) => {
    setLoading(true);
    setSuccessMessage(null);

    // Simular espera de 2 segundos
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('Saving record to backend:', updatedRecord);
    // Aquí se puede agregar la lógica para enviar los datos al backend

    setLoading(false);
    setSuccessMessage('Operación realizada con éxito.');

    // Esperar 1 segundo antes de actualizar la página
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleCancel = () => {
    console.log('Edit cancelled');
    setShowEditPanel(false);
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!walletData) {
    return <div className='h-screen flex items-center justify-center'>Cargando datos de la billetera...</div>;
  }

  const assetSymbols = walletData[0]?.assets.map((asset: any) => asset.symbol) || [];

  return (
    <div className="flex flex-col items-center justify-center">
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-md">
          {successMessage}
        </div>
      )}
      {showAssetPanel && userId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1">
          <div className="bg-gray-200 p-4 rounded-md shadow-md">
            <AssetSelectionPanel userId={userId} assets={assets} />
            <button
              onClick={() => setShowAssetPanel(false)}
              className="mt-2 bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showEditPanel && userId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1">
          <div className="bg-gray-200 p-4 rounded-md shadow-md">
            {record && (
              <>
                <WalletRecordEdit {...record} onSave={handleSave} onCancel={handleCancel} />
                <div className="flex flex-col justify-end mt-4">
                  <div className="flex justify-end">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-300 rounded-md mr-2"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(record)}
                      className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'}`}
                      disabled={loading}
                    >
                      {loading ? 'Guardando operación...' : 'Save'}
                    </button>
                  </div>
                  {successMessage && (
                    <div className="mt-4 text-center text-green-500">
                      {successMessage}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="w-full bg-white p-6 rounded-md shadow-xl relative">
        <button
          onClick={fetchAssets}
          className="absolute top-4 right-4 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Change Asset
        </button>
        <h2 className="text-2xl font-semibold mb-4">{asset?.toUpperCase()} WALLET</h2>
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2 bg-gray-100">Date</th>
              {assetSymbols.map((symbol: string) => (
                <React.Fragment key={symbol}>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-200" colSpan={2}>{symbol}</th>
                </React.Fragment>
              ))}
              <th className="border border-gray-300 px-4 py-2 bg-gray-100">Actions</th>
            </tr>
            <tr>
              <th className="border border-gray-300 px-4 py-2 bg-gray-100"></th>
              {assetSymbols.map((symbol: string) => (
                <React.Fragment key={symbol}>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-200">Invested (EUR)</th>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-200">Total Holding</th>
                </React.Fragment>
              ))}
              <th className="border border-gray-300 px-4 py-2 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {walletData.map((entry: any, index: number) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2 bg-gray-50">{formatDate(entry.date)}</td>
                {assetSymbols.map((symbol: string) => {
                  const asset = entry.assets.find((a: any) => a.symbol === symbol);
                  return (
                    <React.Fragment key={symbol}>
                      <td className="border border-gray-300 px-4 py-2 bg-gray-100">{asset?.invested_EUR || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 bg-gray-100">{asset?.total_holding || '-'}</td>
                    </React.Fragment>
                  );
                })}
                <td className="border border-gray-300 px-4 py-2 bg-gray-50 text-center">
                  <button className="text-green-500 hover:text-green-700 mx-2"
                          onClick={() => fetchEditPanel(userId!, index, asset!, entry.date, entry.assets)}>
                    <i className="fi fi-sr-customize"></i>
                  </button>
                  <button className="text-red-500 hover:text-red-700 mx-2">
                    <i className="fi fi-sr-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Wallet;