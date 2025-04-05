import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";

const languages = [
  { code: "ru", name: "Русский", flag: "/flags/ru.png" },
  { code: "en", name: "English", flag: "/flags/en.png" },
  { code: "ua", name: "Українська", flag: "/flags/ua.png" },
];

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [balance, setBalance] = useState({ total: 0, spot: 0, futures: 0 });
  const [commission, setCommission] = useState({ spot: 0, futures: 0 });
  const [isReferral, setIsReferral] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const networks = ["Arbitrum One", "Optimism", "BNB Smart Chain (BEP20)", "TRON (TRC20)", "Polygon PoS"];

  // Получение API-ключей из localStorage (предполагаем, что они сохранены)
  const apiKeys = JSON.parse(localStorage.getItem("apiKeys") || "[]");
  const defaultExchange = "Bybit"; // Замени на выбранную пользователем биржу
  const selectedApiKey = apiKeys.find((key: any) => key.exchange === defaultExchange);

  // Получение баланса и комиссии
  useEffect(() => {
    const fetchBalance = async () => {
      if (!selectedApiKey) {
        console.error("API keys not found");
        return;
      }
      const response = await fetch("http://localhost:3000/get-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchangeName: defaultExchange,
          apiKey: selectedApiKey.apiKey,
          apiSecret: selectedApiKey.apiSecret,
        }),
      });
      const data = await response.json();
      setBalance(data);
    };

    const fetchCommission = async () => {
      const response = await fetch("http://localhost:3000/api/commission");
      const data = await response.json();
      setCommission(data);
    };

    const checkReferral = async () => {
      const response = await fetch("http://localhost:3000/api/referrals/check");
      const data = await response.json();
      setIsReferral(data.isReferral);
    };

    fetchBalance();
    fetchCommission();
    checkReferral();
  }, []);

  // Обработка оплаты комиссии
  const handlePayCommission = async (walletType: "spot" | "futures") => {
    if (!selectedNetwork) {
      alert(t("select_network"));
      return;
    }
    const response = await fetch("http://localhost:3000/api/commission/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletType, network: selectedNetwork, amount: commission[walletType] }),
    });
    const data = await response.json();
    if (data.success) {
      alert(t("commission_paid", { address: data.walletAddress }));
      setCommission((prev) => ({ ...prev, [walletType]: 0 }));
    }
    setIsModalOpen(false);
  };

  // Обработка смены языка
  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    changeLanguage(lang);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const bots = [
    {
      name: "Bybit Futures VIRTUAL LONG",
      exchange: "Bybit",
      deposit: "20 USDT",
      leverage: "x10",
      profit: "+1%",
    },
    {
      name: "Binance Grid Trading",
      exchange: "Binance",
      deposit: "50 USDT",
      leverage: "x5",
      profit: "+3%",
    },
  ];

  const trades = [
    { pair: "BTC/USDT", result: "+5%", status: "✅", outcome: t("success") },
    { pair: "ETH/USDT", result: "-2%", status: "❌", outcome: t("loss") },
    { pair: "BNB/USDT", result: "+3%", status: "✅", outcome: t("success") },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* 🔹 Верхняя закрепленная панель */}
      <header className="fixed top-0 left-0 w-full bg-black p-4 flex justify-between items-center z-50 shadow-[0_0_20px_#FBC30A]">
        <h1 className="text-5xl font-bold text-yellow-400 shadow-[0_0_15px_#FBC30A] px-4 py-2 rounded-lg">
          TradeGuard
        </h1>

        {/* 🔹 Переключатель языка */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-gray-900 text-white border border-gray-700 p-2 rounded-md flex items-center cursor-pointer shadow-[0_0_10px_#FBC30A]"
          >
            <img src={languages.find((l) => l.code === selectedLang)?.flag} alt={selectedLang} className="w-5 h-3 mr-2" />
            <span className="text-sm">{languages.find((l) => l.code === selectedLang)?.name}</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full mt-2 bg-gray-900 border border-gray-700 rounded-md w-32 shadow-[0_0_10px_#FBC30A]">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="flex items-center p-2 hover:bg-gray-700 cursor-pointer text-sm"
                >
                  <img src={lang.flag} alt={lang.code} className="w-5 h-3 mr-2" />
                  <span>{lang.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Отступ после фиксированного заголовка */}
      <div className="mt-24"></div>

      {/* 🔹 Основной контент */}
      <div className="flex flex-grow">
        {/* 🔸 Левая панель с балансом и кнопками */}
        <aside className="w-1/4 p-2 flex flex-col items-start ml-6">
          <div className="text-center">
            {/* Блок баланса */}
            <div className="bg-gray-900 p-3 shadow-[0_0_15px_#FBC30A] rounded-lg inline-block text-left w-48 text-sm">
              <p className="font-bold">{t("total_balance")}: {balance.total.toFixed(2)} USDT</p>
              <p className="text-gray-400">
                {t("spot_balance")}: {balance.spot.toFixed(2)} USDT
                {commission.spot > 0 && !isReferral && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="ml-2 text-yellow-400 underline"
                  >
                    ({t("pay_commission")}: {commission.spot.toFixed(2)} USDT)
                  </button>
                )}
              </p>
              <p className="text-gray-400">
                {t("futures_balance")}: {balance.futures.toFixed(2)} USDT
                {commission.futures > 0 && !isReferral && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="ml-2 text-yellow-400 underline"
                  >
                    ({t("pay_commission")}: {commission.futures.toFixed(2)} USDT)
                  </button>
                )}
              </p>
              {isReferral && (
                <p className="text-green-400 mt-2">{t("commission_text")}</p>
              )}
            </div>

            {/* Кнопки */}
            <div className="mt-3 flex flex-col items-center w-48">
              <button className="w-full p-2 bg-blue-500 rounded-lg shadow-[0_0_10px_#FBC30A] text-sm">
                {t("deposit")}
              </button>
              <button className="w-full mt-2 p-2 bg-green-500 rounded-lg shadow-[0_0_10px_#FBC30A] text-sm">
                {t("become_referral")}
              </button>
              <button className="w-full mt-4 p-2 bg-yellow-400 text-black font-bold rounded-lg shadow-[0_0_10px_#FBC30A] text-sm">
                {t("create_bot")}
              </button>
            </div>
          </div>
        </aside>

        {/* 🔹 Центральный контент */}
        <main className="w-3/4 p-4">
          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-900 text-center p-3 text-lg font-black uppercase shadow-[0_0_10px_#FBC30A] rounded-lg">
              {t("profit")}: <span className="text-green-400">+172%</span>
            </div>
            <div className="bg-gray-900 text-center p-3 text-lg font-black uppercase shadow-[0_0_10px_#FBC30A] rounded-lg">
              {t("my_bots")}: 2
            </div>
            <div className="bg-gray-900 text-center p-3 text-lg font-black uppercase shadow-[0_0_10px_#FBC30A] rounded-lg">
              {t("completed_trades")}: 1245
            </div>
          </div>

          {/* Мои боты */}
          <div className="p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg mb-4">
            <h2 className="text-xl font-bold mb-3 shadow-[0_0_15px_#FBC30A] p-1 inline-block">{t("my_bots")}</h2>
            {bots.map((bot, index) => (
              <div key={index} className="p-3 shadow-[0_0_10px_#FBC30A] rounded-lg mb-3 text-sm">
                <h3 className="font-bold">{bot.name}</h3>
                <p>{t("exchange")}: {bot.exchange} | {t("deposit")}: {bot.deposit} | {t("leverage")}: {bot.leverage} | {t("profit")}: {bot.profit}</p>
                <div className="mt-2 flex gap-2">
                  <button className="bg-blue-500 p-2 rounded">{t("view_chart")}</button>
                  <button className="bg-gray-600 p-2 rounded">{t("pause_bot")}</button>
                  <button className="bg-yellow-500 p-2 rounded">{t("edit_bot")}</button>
                  <button className="bg-purple-500 p-2 rounded">{t("backtest")}</button>
                </div>
              </div>
            ))}
          </div>

          {/* Последние сделки */}
          <div className="p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg">
            <h2 className="text-xl font-bold mb-3">{t("latest_trades")}</h2>
            {trades.map((trade, index) => (
              <div key={index} className="p-2 shadow-[0_0_10px_#FBC30A] rounded-lg mb-2 text-sm">
                {trade.pair} {trade.result} {trade.status} {trade.outcome}
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Модальное окно для оплаты комиссии */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg text-black">
            <h2 className="text-xl font-bold mb-4">{t("pay_commission")}</h2>
            <select
              onChange={(e) => setSelectedNetwork(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">{t("select_network")}</option>
              {networks.map((network) => (
                <option key={network} value={network}>
                  {network}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => handlePayCommission("spot")}
                className="bg-green-500 text-white p-2 rounded"
              >
                {t("confirm_payment")} (Spot)
              </button>
              <button
                onClick={() => handlePayCommission("futures")}
                className="bg-green-500 text-white p-2 rounded"
              >
                {t("confirm_payment")} (Futures)
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-500 text-white p-2 rounded"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;