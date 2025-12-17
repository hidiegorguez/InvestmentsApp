import React, { useState } from 'react'

export default function App() {
  const [assetType, setAssetType] = useState('crypto')
  const [userId, setUserId] = useState('')
  const [wallet, setWallet] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetchWallet() {
    setError(null)
    try {
      const url = `/wallet?container=investmentscontainer&asset_type=${encodeURIComponent(assetType)}&user_id=${encodeURIComponent(userId)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()
      setWallet(data)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, system-ui, Arial' }}>
      <h1>Investments UI — Demo</h1>
      <div style={{ marginBottom: 12 }}>
        <label>Asset type: </label>
        <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
          <option value="crypto">crypto</option>
          <option value="etf">etf</option>
          <option value="stock">stock</option>
        </select>
        <label style={{ marginLeft: 12 }}>User id: </label>
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user id" />
        <button style={{ marginLeft: 12 }} onClick={fetchWallet}>Fetch Wallet</button>
      </div>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {wallet && (
        <pre style={{ background: '#f6f6f6', padding: 12 }}>{JSON.stringify(wallet, null, 2)}</pre>
      )}

      <p style={{ marginTop: 16, color: '#666' }}>Note: this dev server proxies aren't configured; in production set `API_URL` to your backend.</p>
    </div>
  )
}
