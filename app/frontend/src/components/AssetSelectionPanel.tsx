import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AssetSelectionPanelProps {
  userId: string;
  assets: string[];
  onClose?: () => void;
}

const AssetSelectionPanel: React.FC<AssetSelectionPanelProps> = ({ userId, assets, onClose }) => {
  const navigate = useNavigate();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const handleAssetClick = (asset: string) => {
    setSelectedAsset(asset);
    setTimeout(() => {
      if (onClose) onClose();
      navigate(`/wallet/${userId}/${asset}`);
      window.location.reload();
    }, 500);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-md bg-white p-6 rounded-md shadow-xl">
        <h2 className="text-2xl font-semibold mb-4">Select an Asset</h2>
        {selectedAsset ? (
          <p className="text-center text-green-500">Cargando {selectedAsset}...</p>
        ) : (
          <ul>
            {assets.map((asset) => (
              <li key={asset} className="mb-2">
                <button
                  onClick={() => handleAssetClick(asset)}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
                >
                  {asset}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AssetSelectionPanel;
