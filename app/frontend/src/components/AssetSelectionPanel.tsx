import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AssetSelectionPanelProps {
  userId: string;
  assets: string[];
}

const AssetSelectionPanel: React.FC<AssetSelectionPanelProps> = ({ userId, assets }) => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAssetClick = (asset: string) => {
    navigate(`/wallet?userId=${encodeURIComponent(userId)}&asset=${encodeURIComponent(asset)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-md shadow">
        <h2 className="text-2xl font-semibold mb-4">Selecciona un Asset</h2>
        <ul>
          {assets.map((asset) => (
            <li key={asset} className="mb-2">
              <button
                onClick={() => handleAssetClick(asset)}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                {asset}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AssetSelectionPanel;
