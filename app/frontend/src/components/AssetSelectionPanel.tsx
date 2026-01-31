import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui';

interface AssetSelectionPanelProps {
  userId: string;
  assets: string[];
  onClose?: () => void;
  currentAsset?: string;
}

const AssetSelectionPanel: React.FC<AssetSelectionPanelProps> = ({ userId, assets, onClose, currentAsset }) => {
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
          {assets.map((asset) => {
            const isCurrentAsset = currentAsset?.toLowerCase() === asset.toLowerCase();
            const isLoading = selectedAsset === asset;
            
            let variant: 'primary' | 'secondary' | 'outline' = 'primary';
            if (isLoading) variant = 'secondary';
            else if (isCurrentAsset) variant = 'secondary';
            
            return (
              <Button
                key={asset}
                onClick={() => handleAssetClick(asset)}
                disabled={selectedAsset !== null && selectedAsset !== asset}
                fullWidth
                size="lg"
                variant={variant}
                loading={isLoading}
              >
                {formatAssetName(asset)}{isCurrentAsset && !isLoading ? ' ✓' : ''}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssetSelectionPanel;
