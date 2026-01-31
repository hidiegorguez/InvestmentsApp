import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner } from './ui';

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
            <Button
              key={asset}
              onClick={() => handleAssetClick(asset)}
              disabled={selectedAsset !== null}
              fullWidth
              size="lg"
              variant={selectedAsset === asset ? 'primary' : selectedAsset !== null ? 'outline' : 'primary'}
              className={selectedAsset !== null && selectedAsset !== asset ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {selectedAsset === asset ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  {formatAssetName(asset)}
                </span>
              ) : (
                formatAssetName(asset)
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetSelectionPanel;
