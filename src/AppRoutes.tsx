import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreateBot from './pages/CreateBot';
import ApiKeys from './pages/ApiKeys';
import Balance from './pages/Balance';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-bot" element={<CreateBot />} />
      <Route path="/api-keys" element={<ApiKeys />} />
      <Route path="/balance" element={<Balance />} />
    </Routes>
  );
};

export default AppRoutes;