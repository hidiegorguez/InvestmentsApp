import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logIn } from '../api/api';
import AssetSelectionPanel from './AssetSelectionPanel';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [succesfullLogin, setSuccesfullLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);

    if (!userId) {
      setError('Por favor, introduce un ID de usuario.');
      setIsLoading(false);
      return;
    }

    try {
      const assetsList = await logIn(userId);
      setAssets(assetsList);
      setSuccesfullLogin(true);
    } catch (e: any) {
      setError(`Error de red: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!succesfullLogin ? (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white p-6 rounded-md shadow">
          <h2 className="text-2xl font-semibold mb-4">Login</h2>

          <input
            type="text"
            placeholder="Introduce tu ID de usuario"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isLoading}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              'Entrar'
            )}
          </button>

          {error && <p className="text-red-600 mt-3">{error}</p>}
        </div>
      </div>
    ) : (
      <AssetSelectionPanel userId={userId} assets={assets} />
    )}
    </>
  );
};

export default Login;
