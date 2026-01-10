export async function logIn (userId: string) {
  const response = await fetch(`http://127.0.0.1:8000/user/assets?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getWallet(userId: string, asset: string) {
  console.log('Fetching wallet for', userId, asset);
  const response = await fetch(`http://127.0.0.1:8000/wallet?asset_type=${encodeURIComponent(asset)}&user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getAssets(userId: string) {
  const response = await fetch(`http://127.0.0.1:8000/user/assets?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}