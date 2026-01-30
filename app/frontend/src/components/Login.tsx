import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logIn } from '../api/api';
import { useAuth } from '../context/AuthContext';
import AssetSelectionPanel from './AssetSelectionPanel';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [succesfullLogin, setSuccesfullLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState<string[]>([]);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);

    if (!userId || !password) {
      setError('Por favor, introduce usuario y contraseña.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await logIn(userId, password);
      login(response.access_token, userId, response.assets);
      setAssets(response.assets);
      setSuccesfullLogin(true);
    } catch (e: any) {
      if (e.message.includes('401')) {
        setError('Usuario o contraseña incorrectos.');
      } else if (e.message.includes('404')) {
        setError('Usuario no existente.');
      } else {
        setError('Error de conexión. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <>
      {!succesfullLogin ? (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-sm sm:max-w-md bg-white p-4 sm:p-6 rounded-md shadow-xl">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Login</h2>

          <input
            type="text"
            placeholder="Usuario"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="w-full border border-gray-300 rounded px-3 py-3 sm:py-2 mb-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:opacity-50"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="w-full border border-gray-300 rounded px-3 py-3 sm:py-2 mb-4 text-base focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:opacity-50"
          />

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-3 sm:py-2 rounded text-base font-medium disabled:opacity-50 flex items-center justify-center active:bg-orange-700"
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

          {error && <p className="text-red-600 mt-3 text-sm sm:text-base">{error}</p>}
        </div>
      </div>
    ) : (
      <AssetSelectionPanel userId={userId} assets={assets} />
    )}
    </>
  );
};

export default Login;
