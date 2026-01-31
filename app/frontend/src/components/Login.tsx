import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logIn } from '../api/api';
import { useAuth } from '../context/AuthContext';
import AssetSelectionPanel from './AssetSelectionPanel';
import { Button, Input } from './ui';

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
      setError('Please enter username and password.');
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
        setError('Invalid username or password.');
      } else if (e.message.includes('404')) {
        setError('User not found.');
      } else {
        setError('Connection error. Please try again.');
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

            <div className="mb-4">
              <Input
                type="text"
                placeholder="Username"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            >
              Sign In
            </Button>

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
