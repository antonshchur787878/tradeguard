import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ApiKeys from "./pages/ApiKeys";
import CreateBot from "./pages/CreateBot";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/api-keys" element={<ApiKeys />} />
      <Route path="/create-bot" element={<CreateBot />} />
      <Route path="*" element={<div>404 - Страница не найдена</div>} />
    </Routes>
  );
};

export default AppRoutes;