import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import FishermanDashboard from './pages/FishermanDashboard';
import BuyerDashboard from './pages/BuyerDashboard';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (user.role === 'fisherman') {
    return (
      <BrowserRouter>
        <FishermanDashboard user={user} onLogout={handleLogout} />
      </BrowserRouter>
    );
  }

  if (user.role === 'buyer') {
    return (
      <BrowserRouter>
        <BuyerDashboard user={user} onLogout={handleLogout} />
      </BrowserRouter>
    );
  }
}

export default App;
