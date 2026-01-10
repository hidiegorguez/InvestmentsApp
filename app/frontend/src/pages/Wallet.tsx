import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getWallet } from '../api/api';

const Wallet: React.FC = () => {
  const [walletData, setWalletData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchWallet = async () => {
      const params = new URLSearchParams(location.search);
      const userId = params.get('userId');
      const asset = params.get('asset');

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
  }, [location]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!walletData) {
    return <div>Cargando datos de la billetera...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-md shadow">
        <h2 className="text-2xl font-semibold mb-4">Datos de la Billetera</h2>
        <pre>{JSON.stringify(walletData, null, 2)}</pre>
      </div>
    </div>
  );
};

export default Wallet;