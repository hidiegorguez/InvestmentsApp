import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getWallet, getAssets } from '../api/api';
// import { FaEdit, FaTrash } from 'react-icons/fa';
import AssetSelectionPanel from '../components/AssetSelectionPanel';

const Wallet: React.FC = () => {
  const { userId, asset } = useParams<{ userId: string; asset: string }>();

  const [walletData, setWalletData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAssetPanel, setShowAssetPanel] = useState(false); // Ensure the asset panel is hidden on page load
  const [assets, setAssets] = useState<string[]>([]);

  const formatDate = (dateString: string) => {
  const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
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

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!walletData) {
    return <div className='h-screen flex items-center justify-center'>Cargando datos de la billetera...</div>;
  }

  const assetSymbols = walletData[0]?.assets.map((asset: any) => asset.symbol) || [];

  return (
    <div className="flex flex-col items-center justify-center">
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
                  <button className="text-green-500 hover:text-green-700 mx-2">
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