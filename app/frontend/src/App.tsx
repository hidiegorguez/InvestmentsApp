import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Wallet from './pages/Wallet';

export default function App() {
  return (
    <Router>
      <div style={{ padding: 24, fontFamily: 'Inter, system-ui, Arial' , backgroundColor: '#ffcc88', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/wallet/:userId/:asset" element={<Wallet />} />
        </Routes>
      </div>
    </Router>
  );
}
