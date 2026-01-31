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

  const formatAssetName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <div className={onClose ? '' : 'flex items-center justify-center min-h-[80vh] px-4'}>
      <div className={onClose ? '' : 'w-full max-w-sm bg-white p-6 rounded-lg shadow-xl'}>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Select Asset</h2>
        <div className="space-y-2">
          {assets.map((asset) => (
            <button
              key={asset}
              onClick={() => handleAssetClick(asset)}
              disabled={selectedAsset !== null}
              className={`w-full py-3 sm:py-2.5 px-4 rounded-lg text-base font-medium transition-colors ${
                selectedAsset === asset
                  ? 'bg-orange-600 text-white'
                  : selectedAsset !== null
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700'
              }`}
            >
              {selectedAsset === asset ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  {formatAssetName(asset)}
                </span>
              ) : (
                formatAssetName(asset)
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetSelectionPanel;
