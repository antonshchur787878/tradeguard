import React, { useState } from "react";
import useFetchCoins from "../hooks/useFetchCoins";

const CoinSelector = () => {
  const [marketType, setMarketType] = useState<"spot" | "linear">("spot");
  const { coins, loading, error } = useFetchCoins(marketType);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Выбор монеты</h2>

      {/* Переключатель между рынками */}
      <div className="my-4">
        <button
          className={`px-4 py-2 mx-2 ${marketType === "spot" ? "bg-yellow-500 text-black" : "bg-gray-700 text-white"}`}
          onClick={() => setMarketType("spot")}
        >
          Спотовый рынок
        </button>
        <button
          className={`px-4 py-2 mx-2 ${marketType === "linear" ? "bg-yellow-500 text-black" : "bg-gray-700 text-white"}`}
          onClick={() => setMarketType("linear")}
        >
          Фьючерсы
        </button>
      </div>

      {/* Отображение списка монет */}
      {loading && <p>Загрузка...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <select className="border p-2 w-full bg-black text-white">
          {coins.map((coin) => (
            <option key={coin} value={coin}>
              {coin}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default CoinSelector;
