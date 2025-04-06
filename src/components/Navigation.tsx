import React from 'react';
import { Link } from 'react-router-dom';

const Navigation: React.FC = () => {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/create-bot">Create Bot</Link></li>
        <li><Link to="/api-keys">API Keys</Link></li>
        <li><Link to="/balance">Balance</Link></li> {/* Добавляем ссылку на страницу баланса */}
      </ul>
    </nav>
  );
};

export default Navigation;