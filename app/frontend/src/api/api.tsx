const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function logIn(userId: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, password }),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getWallet(userId: string, asset: string) {
  const response = await fetch(`${API_BASE}/wallet?asset_type=${encodeURIComponent(asset)}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_userId');
      localStorage.removeItem('auth_assets');
      window.location.href = '/';
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getAssets(userId: string) {
  const response = await fetch(`${API_BASE}/user/assets?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function saveWalletRecord(assetType: string, record: any) {
  const response = await fetch(`${API_BASE}/wallet/record?asset_type=${encodeURIComponent(assetType)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_userId');
      localStorage.removeItem('auth_assets');
      window.location.href = '/';
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function deleteWalletRecord(assetType: string, userId: string, index: number) {
  const response = await fetch(
    `${API_BASE}/wallet/record?asset_type=${encodeURIComponent(assetType)}&index=${index}`,
    { 
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_userId');
      localStorage.removeItem('auth_assets');
      window.location.href = '/';
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function addWalletStock(assetType: string, stockName: string): Promise<{ message: string; stock_name: string }> {
  const response = await fetch(
    `${API_BASE}/wallet/stock?asset_type=${encodeURIComponent(assetType)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ stock_name: stockName }),
    }
  );
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_userId');
      localStorage.removeItem('auth_assets');
      window.location.href = '/';
    }
    const error = await response.json();
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function renameWalletStock(assetType: string, oldName: string, newName: string): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE}/wallet/stock?asset_type=${encodeURIComponent(assetType)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ old_name: oldName, new_name: newName }),
    }
  );
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_userId');
      localStorage.removeItem('auth_assets');
      window.location.href = '/';
    }
    const error = await response.json();
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function deleteWalletStock(assetType: string, stockName: string): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE}/wallet/stock?asset_type=${encodeURIComponent(assetType)}&stock_name=${encodeURIComponent(stockName)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_userId');
      localStorage.removeItem('auth_assets');
      window.location.href = '/';
    }
    const error = await response.json();
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}