import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Wallet from './pages/Wallet';

export default function App() {
  return (
    <Router>
      <div style={{ padding: 24, fontFamily: 'Inter, system-ui, Arial' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/wallet" element={<Wallet />} />
          {/* <Route path="/asset-selection" element={<AssetSelection />} />
          <Route path="/editable-table/:assetType" element={<EditableTable />} /> */}
        </Routes>
      </div>
    </Router>
  );
}
