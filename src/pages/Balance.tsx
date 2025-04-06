import React, { useState, useEffect } from 'react';

const Balance: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [commission] = useState<number>(10); // Убираем setCommission
  const [isReferral, setIsReferral] = useState<boolean>(false);

  useEffect(() => {
    // Загрузка данных о балансе пользователя с сервера
    fetch('/api/user/balance')
      .then(response => response.json())
      .then(data => {
        setBalance(data.balance);
        setIsReferral(data.isReferral);
      });
  }, []);

  const handleTopUp = (amount: number) => {
    // Логика пополнения баланса
    fetch('/api/user/top-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    })
      .then(response => response.json())
      .then(data => {
        setBalance(data.newBalance);
      });
  };

  return (
    <div>
      <h1>Ваш баланс</h1>
      <p>Баланс: {balance} USDT</p>
      <p>Комиссия: {commission}%</p>
      <p>
        {isReferral
          ? 'У вас бесплатный доступ до 50 USDT.'
          : 'Комиссия 10% от прибыли, но не больше 50 USDT.'}
      </p>
      <button onClick={() => handleTopUp(10)}>Пополнить на 10 USDT</button>
    </div>
  );
};

export default Balance;