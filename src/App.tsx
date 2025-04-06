import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navigation from './components/Navigation'; // Импортируем компонент навигации
import AppRoutes from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <Navigation /> {/* Добавляем компонент навигации */}
      <AppRoutes />
    </Router>
  );
};

export default App;