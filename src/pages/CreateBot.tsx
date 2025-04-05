import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";

// Интерфейсы для данных
interface TradingPair {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
}

interface CoinOption {
  value: string;
  label: string;
  icon: string;
}

interface ApiKey {
  _id: string;
  exchange: string;
  label: string;
  key: string;
  secret: string;
}

interface Filter {
  type: string;
  interval: string;
  value: number;
}

// Опции для выпадающих списков
const exchanges = [
  { value: "Bybit", label: "Bybit", icon: "/exchanges/bybit.png" },
  { value: "Binance", label: "Binance", icon: "/exchanges/binance.png" },
  { value: "OKX", label: "OKX", icon: "/exchanges/okx.png" },
];

const walletTypes = [
  { value: "spot", label: "Spot" },
  { value: "futures", label: "Futures" },
];

const steps = [
  { id: 1, name: "select_exchange", section: "exchange" },
  { id: 2, name: "select_api_key", section: "api_key" },
  { id: 3, name: "select_algorithm", section: "algorithm" },
  { id: 4, name: "select_trading_pair", section: "trading_pair" },
  { id: 5, name: "set_deposit", section: "deposit" },
  { id: 6, name: "set_leverage", section: "leverage" },
  { id: 7, name: "set_margin_type", section: "margin_type" },
  { id: 8, name: "set_trade_mode", section: "trade_mode" },
  { id: 9, name: "set_price_distribution", section: "price_distribution" },
  { id: 10, name: "set_order_grid_pull", section: "order_grid_pull" },
  { id: 11, name: "set_stop_after_deal", section: "stop_after_deal" },
  { id: 12, name: "set_hedging", section: "hedging" },
  { id: 13, name: "set_stop_loss", section: "stop_loss" },
  { id: 14, name: "set_take_profit", section: "take_profit" },
  { id: 15, name: "set_filters", section: "filters" },
  { id: 16, name: "final_step", section: "final_step" },
];

const languages = [
  { code: "ru", name: "Русский", flag: "/flags/ru.png" },
  { code: "en", name: "English", flag: "/flags/en.png" },
  { code: "ua", name: "Українська", flag: "/flags/ua.png" },
];

type HelpSection =
  | "exchange"
  | "api_key"
  | "algorithm"
  | "trading_pair"
  | "deposit"
  | "leverage"
  | "margin_type"
  | "trade_mode"
  | "price_distribution"
  | "order_grid_pull"
  | "stop_after_deal"
  | "hedging"
  | "stop_loss"
  | "take_profit"
  | "filters"
  | "final_step";

// Основной компонент
const CreateBot: React.FC = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [exchange, setExchange] = useState<string>("");
  const [isExchangeDropdownOpen, setIsExchangeDropdownOpen] = useState<boolean>(false);
  const [walletType, setWalletType] = useState<string>("spot");
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState<string>("long");
  const [baseCoin, setBaseCoin] = useState<string>("");
  const [quoteCoin, setQuoteCoin] = useState<string>("");
  const [isBaseDropdownOpen, setIsBaseDropdownOpen] = useState<boolean>(false);
  const [isQuoteDropdownOpen, setIsQuoteDropdownOpen] = useState<boolean>(false);
  const [allBaseCoins, setAllBaseCoins] = useState<string[]>([]);
  const [filteredBaseCoins, setFilteredBaseCoins] = useState<string[]>([]);
  const [recommendedPairs, setRecommendedPairs] = useState<TradingPair[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>("ru");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [savedApiKeys, setSavedApiKeys] = useState<ApiKey[]>([]);
  const [deposit, setDeposit] = useState<number>(100);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [leverage, setLeverage] = useState<number>(1);
  const [marginType, setMarginType] = useState<string>("cross");
  const [tradeMode, setTradeMode] = useState<string>("overlap");
  const [priceDistribution, setPriceDistribution] = useState<string>("logarithmic");
  const [orderGridPull, setOrderGridPull] = useState<number>(0.5);
  const [stopAfterDeal, setStopAfterDeal] = useState<boolean>(false);
  const [hedgingEnabled, setHedgingEnabled] = useState<boolean>(false);
  const [hedgingTriggerType, setHedgingTriggerType] = useState<string>("amount");
  const [hedgingTriggerValue, setHedgingTriggerValue] = useState<number>(-100);
  const [hedgingDirection, setHedgingDirection] = useState<string>("opposite");
  const [hedgingVolume, setHedgingVolume] = useState<number>(100);
  const [stopLossEnabled, setStopLossEnabled] = useState<boolean>(false);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [filters, setFilters] = useState<Filter[]>([{ type: "rsi", interval: "1min", value: 70 }]);
  const [backtestResult, setBacktestResult] = useState<string>("N/A");
  const baseDropdownRef = useRef<HTMLDivElement>(null);
  const quoteDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const exchangeDropdownRef = useRef<HTMLDivElement>(null);

  const totalSteps = steps.length;

  // Инициализация состояния при загрузке
  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "ru";
    setSelectedLang(savedLang);
    changeLanguage(savedLang);
  }, []);

  useEffect(() => {
    const savedKeys = localStorage.getItem("apiKeys");
    if (savedKeys) {
      setSavedApiKeys(JSON.parse(savedKeys));
    }
  }, []);

  useEffect(() => {
    fetch("https://api.bybit.com/v5/market/instruments-info?category=spot")
      .then((res) => res.json())
      .then((data) => {
        if (data.result?.list) {
          const pairs: TradingPair[] = data.result.list.map((item: any) => ({
            symbol: item.symbol,
            baseCoin: item.baseCoin,
            quoteCoin: item.quoteCoin,
          }));
          const filteredPairs = pairs.filter((pair) => ["USDT", "USDC"].includes(pair.quoteCoin));
          setRecommendedPairs(filteredPairs);
          const uniqueBaseCoins = Array.from(new Set(pairs.map((pair) => pair.baseCoin)));
          setAllBaseCoins(uniqueBaseCoins);
          setFilteredBaseCoins(uniqueBaseCoins);
        }
      })
      .catch((err) => console.error("Ошибка загрузки пар:", err));
  }, []);

  useEffect(() => {
    if (selectedApiKeyId && exchange) fetchBalance(selectedApiKeyId);
  }, [selectedApiKeyId, exchange, walletType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (baseDropdownRef.current && !baseDropdownRef.current.contains(event.target as Node)) setIsBaseDropdownOpen(false);
      if (quoteDropdownRef.current && !quoteDropdownRef.current.contains(event.target as Node)) setIsQuoteDropdownOpen(false);
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) setIsLangDropdownOpen(false);
      if (exchangeDropdownRef.current && !exchangeDropdownRef.current.contains(event.target as Node)) setIsExchangeDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Подсчёт завершённых шагов
  const completedSteps = (): number => {
    let completed = 0;
    if (exchange) completed++;
    if (walletType) completed++;
    if (selectedApiKeyId) completed++;
    if (algorithm) completed++;
    if (baseCoin && quoteCoin) completed++;
    if (deposit > 0) completed++;
    if (leverage > 0) completed++;
    if (marginType) completed++;
    if (tradeMode) completed++;
    if (priceDistribution) completed++;
    if (orderGridPull > 0) completed++;
    if (typeof stopAfterDeal === "boolean") completed++;
    if (typeof hedgingEnabled === "boolean") completed++;
    if (stopLossEnabled ? stopLoss > 0 : true) completed++;
    if (takeProfit > 0) completed++;
    if (filters.length > 0) completed++;
    return completed;
  };

  // Опции для котируемых монет
  const quoteCoinOptions: CoinOption[] = [
    { value: "USDT", label: "USDT", icon: "https://assets.coincap.io/assets/icons/usdt@2x.png" },
    { value: "USDC", label: "USDC", icon: "https://assets.coincap.io/assets/icons/usdc@2x.png" },
  ];

  const getCoinIcon = (coin: string): string => {
    return `https://assets.coincap.io/assets/icons/${coin.toLowerCase()}@2x.png`;
  };

  // Обработчики событий
  const handleLanguageChange = (lang: string): void => {
    setSelectedLang(lang);
    changeLanguage(lang);
    localStorage.setItem("language", lang);
    setIsLangDropdownOpen(false);
  };

  const handleRecommendedPairClick = (pair: TradingPair): void => {
    setBaseCoin(pair.baseCoin);
    setQuoteCoin(pair.quoteCoin);
    setIsBaseDropdownOpen(false);
    setIsQuoteDropdownOpen(false);
    setCurrentStep(5);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = allBaseCoins.filter((coin) => coin.toLowerCase().includes(term));
    setFilteredBaseCoins(filtered);
  };

  const fetchBalance = async (apiKeyId: string) => {
    setIsBalanceLoading(true);
    setBalanceError(null);
    try {
      const savedKeys = localStorage.getItem("apiKeys");
      if (!savedKeys) throw new Error("API-ключи отсутствуют");
      const keys: ApiKey[] = JSON.parse(savedKeys);
      const selectedKey = keys.find((key) => key._id === apiKeyId);
      if (!selectedKey) throw new Error("Выбранный ключ не найден");

      const response = await fetch("http://localhost:3000/get-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exchangeName: exchange.toLowerCase(),
          apiKey: selectedKey.key,
          apiSecret: selectedKey.secret,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка получения баланса");
      setUserBalance(data.total || 0);
    } catch (error: any) {
      setBalanceError(`Ошибка: ${error.message}`);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const handleRefreshBalance = (): void => {
    if (selectedApiKeyId) fetchBalance(selectedApiKeyId);
  };

  const handleAddFilter = (): void => {
    setFilters([...filters, { type: "rsi", interval: "1min", value: 70 }]);
  };

  const handleUpdateFilter = (index: number, field: keyof Filter, value: string | number): void => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    setFilters(updatedFilters);
  };

  const handleRemoveFilter = (index: number): void => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (deposit > userBalance) {
      alert(t("insufficient_balance") || "Недостаточно средств на балансе");
      return;
    }
    if (
      exchange &&
      walletType &&
      selectedApiKeyId &&
      baseCoin &&
      quoteCoin &&
      deposit > 0 &&
      leverage > 0 &&
      marginType &&
      tradeMode &&
      priceDistribution &&
      orderGridPull > 0 &&
      (stopLossEnabled ? stopLoss > 0 : true) &&
      takeProfit > 0 &&
      filters.length > 0
    ) {
      const botConfig = {
        exchange,
        walletType,
        apiKeyId: selectedApiKeyId,
        algorithm,
        tradingPair: `${baseCoin}/${quoteCoin}`,
        deposit,
        leverage,
        marginType,
        tradeMode,
        priceDistribution,
        orderGridPull,
        stopAfterDeal,
        hedgingEnabled,
        hedgingTriggerType,
        hedgingTriggerValue,
        hedgingDirection,
        hedgingVolume,
        stopLossEnabled,
        stopLoss,
        takeProfit,
        filters,
      };
      console.log("Bot configuration:", botConfig);
      alert(t("bot_created_successfully") || "Бот успешно создан");
    } else {
      alert(t("fill_all_fields") || "Заполните все обязательные поля");
    }
  };

  const handleRunBacktest = (): void => {
    const riskFactor = leverage / deposit;
    const success = riskFactor < 0.1;
    const result = success ? "Success" : "Failure";
    setBacktestResult(result);
    alert(`${t("backtest_result") || "Результат бэктеста"}: ${result}`);
  };

  // Вспомогательные функции для интерфейса
  const getHelpContent = (section: HelpSection): { title: string; content: string; link: string } => {
    const helpContent = {
      exchange: { title: t("exchange"), content: t("exchange_help") || "Выберите биржу для торговли.", link: t("learn_more") || "Узнать больше" },
      api_key: { title: t("api_key"), content: t("api_key_help") || "Выберите API ключ для доступа к бирже.", link: t("learn_more") || "Узнать больше" },
      algorithm: { title: t("algorithm"), content: t("algorithm_help") || "Выберите стратегию торговли.", link: t("learn_more") || "Узнать больше" },
      trading_pair: { title: t("trading_pair"), content: t("trading_pair_help") || "Выберите торговую пару.", link: t("learn_more") || "Узнать больше" },
      deposit: { title: t("deposit"), content: t("deposit_help") || "Укажите сумму депозита.", link: t("learn_more") || "Узнать больше" },
      leverage: { title: t("leverage"), content: t("leverage_help") || "Установите плечо для торговли.", link: t("learn_more") || "Узнать больше" },
      margin_type: { title: t("margin_type"), content: t("margin_type_help") || "Выберите тип маржи.", link: t("learn_more") || "Узнать больше" },
      trade_mode: { title: t("trade_mode"), content: t("trade_mode_help") || "Выберите режим торговли.", link: t("learn_more") || "Узнать больше" },
      price_distribution: { title: t("price_distribution"), content: t("price_distribution_help") || "Выберите распределение цен.", link: t("learn_more") || "Узнать больше" },
      order_grid_pull: { title: t("order_grid_pull"), content: t("order_grid_pull_help") || "Установите подтяжку сетки ордеров.", link: t("learn_more") || "Узнать больше" },
      stop_after_deal: { title: t("stop_after_deal"), content: t("stop_after_deal_help") || "Остановка бота после сделки.", link: t("learn_more") || "Узнать больше" },
      hedging: { title: t("hedging"), content: t("hedging_help") || "Настройте хеджирование.", link: t("learn_more") || "Узнать больше" },
      stop_loss: { title: t("stop_loss"), content: t("stop_loss_help") || "Установите стоп-лосс.", link: t("learn_more") || "Узнать больше" },
      take_profit: { title: t("take_profit"), content: t("take_profit_help") || "Установите тейк-профит.", link: t("learn_more") || "Узнать больше" },
      filters: { title: t("filters"), content: t("filters_help") || "Добавьте фильтры для торговли.", link: t("learn_more") || "Узнать больше" },
      final_step: { title: t("final_step"), content: t("backtest_help") || "Запустите бэктест или создайте бота.", link: t("learn_more") || "Узнать больше" },
    };
    return helpContent[section] || { title: t("help"), content: t("general_help") || "Общая помощь.", link: t("learn_more") || "Узнать больше" };
  };

  const getLeverageColor = (value: number): string => {
    if (value <= 10) return "bg-green-500";
    if (value <= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  // Рендеринг интерфейса
  return (
    <div className="min-h-screen bg-black text-white font-sans flex">
      <div className="w-1/5 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] fixed top-0 left-0 h-screen overflow-y-auto" style={{ marginTop: "96px" }}>
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">{t("navigation") || "Навигация"}</h2>
        <ul>
          {steps.map((step) => (
            <li
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`p-2 cursor-pointer rounded-md mb-2 ${
                currentStep === step.id ? "bg-yellow-400 text-black" : "bg-gray-700 text-white"
              } hover:bg-yellow-500 transition-all duration-200`}
            >
              {t(step.name) || step.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-4/5 p-6 ml-[20%]">
        <header className="fixed top-0 left-0 w-full bg-black p-4 flex justify-between items-center z-50 shadow-[0_0_20px_#FBC30A]">
          <h1 className="text-5xl font-bold text-yellow-400 shadow-[0_0_15px_#FBC30A] px-4 py-2 rounded-lg">
            TradeGuard
          </h1>
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="bg-gray-900 text-white border border-gray-700 p-2 rounded-md flex items-center cursor-pointer shadow-[0_0_10px_#FBC30A]"
            >
              <img
                src={languages.find((l) => l.code === selectedLang)?.flag || "/flags/ru.png"}
                alt={selectedLang}
                className="w-5 h-3 mr-2"
              />
              <span className="text-sm">{languages.find((l) => l.code === selectedLang)?.name || "Русский"}</span>
            </button>
            {isLangDropdownOpen && (
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

        <div className="mt-24">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6">{t("create_bot") || "Создать бота"}</h2>
          <div className="mb-6">
            <p className="text-white">{t("step") || "Шаг"} {currentStep} / {totalSteps}</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps() / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {currentStep >= 1 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("select_exchange") || "Выберите биржу"}</h3>
                <div className="relative" ref={exchangeDropdownRef}>
                  <div
                    className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md cursor-pointer flex items-center"
                    onClick={() => setIsExchangeDropdownOpen(!isExchangeDropdownOpen)}
                  >
                    {exchange ? (
                      <>
                        <img
                          src={exchanges.find((ex) => ex.value === exchange)?.icon}
                          alt={exchange}
                          className="w-5 h-5 mr-2"
                          onError={(e) => (e.currentTarget.src = "/exchanges/default.png")}
                        />
                        {exchanges.find((ex) => ex.value === exchange)?.label}
                      </>
                    ) : (
                      t("select_exchange") || "Выберите биржу"
                    )}
                  </div>
                  {isExchangeDropdownOpen && (
                    <div className="absolute z-10 bg-gray-800 w-full mt-1 max-h-40 overflow-y-auto rounded-md shadow-lg">
                      {exchanges.map((ex) => (
                        <div
                          key={ex.value}
                          className="flex items-center p-2 hover:bg-gray-600 cursor-pointer"
                          onClick={() => {
                            setExchange(ex.value);
                            setIsExchangeDropdownOpen(false);
                            setCurrentStep(2);
                          }}
                        >
                          <img
                            src={ex.icon}
                            alt={ex.label}
                            className="w-5 h-5 mr-2"
                            onError={(e) => (e.currentTarget.src = "/exchanges/default.png")}
                          />
                          {ex.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {exchange && (
                  <div className="mt-4">
                    <h3 className="text-xl font-bold mb-2">{t("wallet_type") || "Тип кошелька"}</h3>
                    <select
                      value={walletType}
                      onChange={(e) => setWalletType(e.target.value)}
                      className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      {walletTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {t(type.label.toLowerCase() + "_wallet") || type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("exchange").title}</h4>
                <p className="text-sm">{getHelpContent("exchange").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("exchange").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 2 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("select_api_key") || "Выберите API ключ"}</h3>
                <select
                  value={selectedApiKeyId || ""}
                  onChange={(e) => {
                    const apiKeyId = e.target.value;
                    setSelectedApiKeyId(apiKeyId);
                    if (apiKeyId) setCurrentStep(3);
                  }}
                  className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">{t("select_api_key") || "Выберите API ключ"}</option>
                  {savedApiKeys
                    .filter((key) => key.exchange === exchange)
                    .map((key) => (
                      <option key={key._id} value={key._id}>
                        {key.label}
                      </option>
                    ))}
                </select>
                {selectedApiKeyId && (
                  <div className="mt-4">
                    {isBalanceLoading ? (
                      <p>{t("loading_balance") || "Загрузка баланса..."}</p>
                    ) : balanceError ? (
                      <p className="text-red-500">{balanceError}</p>
                    ) : (
                      <p>{t("user_balance") || "Баланс"}: {userBalance} USDT</p>
                    )}
                    <button
                      onClick={handleRefreshBalance}
                      className="mt-2 p-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-all duration-200"
                      disabled={!selectedApiKeyId || isBalanceLoading}
                    >
                      {t("refresh_balance") || "Обновить баланс"}
                    </button>
                  </div>
                )}
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("api_key").title}</h4>
                <p className="text-sm">{getHelpContent("api_key").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("api_key").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 3 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("algorithm") || "Алгоритм"}</h3>
                <div className="flex justify-center space-x-6">
                  <button
                    className={`p-4 text-xl font-bold rounded-md transition-all duration-200 ${
                      algorithm === "long" ? "bg-green-600 text-white" : "bg-gray-700 text-white"
                    } hover:bg-green-500`}
                    onClick={() => {
                      setAlgorithm("long");
                      setCurrentStep(4);
                    }}
                  >
                    {t("long") || "Лонг"}
                  </button>
                  <button
                    className={`p-4 text-xl font-bold rounded-md transition-all duration-200 ${
                      algorithm === "short" ? "bg-red-600 text-white" : "bg-gray-700 text-white"
                    } hover:bg-red-500`}
                    onClick={() => {
                      setAlgorithm("short");
                      setCurrentStep(4);
                    }}
                  >
                    {t("short") || "Шорт"}
                  </button>
                </div>
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("algorithm").title}</h4>
                <p className="text-sm">{getHelpContent("algorithm").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("algorithm").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 4 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("recommended_pairs") || "Рекомендуемые пары"}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {recommendedPairs.slice(0, 10).map((pair) => (
                    <button
                      key={pair.symbol}
                      className="p-2 bg-gray-700 text-white rounded-md flex items-center hover:bg-gray-600 transition-all duration-200"
                      onClick={() => handleRecommendedPairClick(pair)}
                    >
                      <img
                        src={getCoinIcon(pair.baseCoin)}
                        alt={pair.baseCoin}
                        className="w-5 h-5 mr-2"
                        onError={(e) => (e.currentTarget.src = "/coins/default.png")}
                      />
                      {pair.symbol}
                    </button>
                  ))}
                </div>

                <h3 className="text-xl font-bold mb-2">{t("trading_pair") || "Торговая пара"}</h3>
                <div className="flex gap-4">
                  <div className="w-1/2 relative" ref={baseDropdownRef}>
                    <label className="block mb-2">{t("base_coin") || "Базовая монета"}</label>
                    <div
                      className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md cursor-pointer flex items-center"
                      onClick={() => setIsBaseDropdownOpen(!isBaseDropdownOpen)}
                    >
                      {baseCoin ? (
                        <>
                          <img
                            src={getCoinIcon(baseCoin)}
                            alt={baseCoin}
                            className="w-5 h-5 mr-2"
                            onError={(e) => (e.currentTarget.src = "/coins/default.png")}
                          />
                          {baseCoin}
                        </>
                      ) : (
                        t("select_base_coin") || "Выберите базовую монету"
                      )}
                    </div>
                    {isBaseDropdownOpen && (
                      <div className="absolute z-10 bg-gray-800 w-full mt-1 max-h-40 overflow-y-auto rounded-md shadow-lg">
                        <input
                          type="text"
                          placeholder={t("search_coin") || "Поиск монеты"}
                          value={searchTerm}
                          onChange={handleSearch}
                          className="w-full p-2 mb-2 bg-gray-700 text-white border border-gray-600 rounded-md"
                        />
                        {filteredBaseCoins.map((coin) => (
                          <div
                            key={coin}
                            className="flex items-center p-2 hover:bg-gray-600 cursor-pointer"
                            onClick={() => {
                              setBaseCoin(coin);
                              setIsBaseDropdownOpen(false);
                              setSearchTerm("");
                              if (quoteCoin) setCurrentStep(5);
                            }}
                          >
                            <img
                              src={getCoinIcon(coin)}
                              alt={coin}
                              className="w-5 h-5 mr-2"
                              onError={(e) => (e.currentTarget.src = "/coins/default.png")}
                            />
                            {coin}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-1/2 relative" ref={quoteDropdownRef}>
                    <label className="block mb-2">{t("quote_coin") || "Котируемая монета"}</label>
                    <div
                      className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md cursor-pointer flex items-center"
                      onClick={() => setIsQuoteDropdownOpen(!isQuoteDropdownOpen)}
                    >
                      {quoteCoin ? (
                        <>
                          <img
                            src={quoteCoinOptions.find((opt) => opt.value === quoteCoin)?.icon}
                            alt={quoteCoin}
                            className="w-5 h-5 mr-2"
                            onError={(e) => (e.currentTarget.src = "/coins/default.png")}
                          />
                          {quoteCoin}
                        </>
                      ) : (
                        t("select_quote_coin") || "Выберите котируемую монету"
                      )}
                    </div>
                    {isQuoteDropdownOpen && (
                      <div className="absolute z-10 bg-gray-800 w-full mt-1 max-h-40 overflow-y-auto rounded-md shadow-lg">
                        {quoteCoinOptions.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center p-2 hover:bg-gray-600 cursor-pointer"
                            onClick={() => {
                              setQuoteCoin(option.value);
                              setIsQuoteDropdownOpen(false);
                              if (baseCoin) setCurrentStep(5);
                            }}
                          >
                            <img
                              src={option.icon}
                              alt={option.label}
                              className="w-5 h-5 mr-2"
                              onError={(e) => (e.currentTarget.src = "/coins/default.png")}
                            />
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("trading_pair").title}</h4>
                <p className="text-sm">{getHelpContent("trading_pair").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("trading_pair").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 5 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("deposit") || "Депозит"}</h3>
                <div className="flex items-center mb-2">
                  <input
                    type="number"
                    min="0"
                    value={deposit}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setDeposit(value);
                      if (value > 0 && value <= userBalance) setCurrentStep(6);
                    }}
                    className="w-full p-3 mb-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <img
                    src={quoteCoinOptions.find((opt) => opt.value === quoteCoin)?.icon || "/coins/default.png"}
                    alt={quoteCoin}
                    className="w-6 h-6 ml-2"
                  />
                  <span className="ml-2">{quoteCoin || "USDT"}</span>
                </div>
                <div className="flex items-center mb-2">
                  {isBalanceLoading ? (
                    <p className="text-sm text-gray-400">{t("loading_balance") || "Загрузка баланса..."}</p>
                  ) : balanceError ? (
                    <p className="text-sm text-red-500">{balanceError}</p>
                  ) : (
                    <p className="text-sm text-gray-400">{t("user_balance") || "Баланс"}: {userBalance} {quoteCoin || "USDT"}</p>
                  )}
                  <button
                    onClick={handleRefreshBalance}
                    className="ml-4 p-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-all duration-200"
                    disabled={isBalanceLoading}
                  >
                    {t("refresh_balance") || "Обновить баланс"}
                  </button>
                </div>
                {deposit > userBalance && (
                  <div className="flex items-center text-red-500 mb-4">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V7h2v2z" />
                    </svg>
                    <span>{t("insufficient_balance") || "Недостаточно средств"}</span>
                  </div>
                )}
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("deposit").title}</h4>
                <p className="text-sm">{getHelpContent("deposit").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("deposit").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 6 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("leverage") || "Плечо"}</h3>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={leverage}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setLeverage(value);
                      if (value > 0) setCurrentStep(7);
                    }}
                    className={`w-full mb-2 h-2 rounded-lg appearance-none ${getLeverageColor(leverage)}`}
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>1</span>
                    <span>{leverage}</span>
                    <span>100</span>
                  </div>
                </div>
                {leverage > 10 && (
                  <div className="flex items-center text-red-500 mb-4">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V7h2v2z" />
                    </svg>
                    <span>{t("high_leverage_warning") || "Высокое плечо увеличивает риск"}</span>
                  </div>
                )}
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("leverage").title}</h4>
                <p className="text-sm">{getHelpContent("leverage").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("leverage").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 7 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("margin_type") || "Тип маржи"}</h3>
                <select
                  value={marginType}
                  onChange={(e) => {
                    setMarginType(e.target.value);
                    setCurrentStep(8);
                  }}
                  className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="cross">{t("cross_margin") || "Кросс-маржа"}</option>
                  <option value="isolated">{t("isolated_margin") || "Изолированная маржа"}</option>
                </select>
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("margin_type").title}</h4>
                <p className="text-sm">{getHelpContent("margin_type").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("margin_type").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 8 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("trade_mode") || "Режим торговли"}</h3>
                <select
                  value={tradeMode}
                  onChange={(e) => {
                    setTradeMode(e.target.value);
                    setCurrentStep(9);
                  }}
                  className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="overlap">{t("overlap_mode") || "Перекрытие"}</option>
                  <option value="order_grid">{t("order_grid_mode") || "Сетка ордеров"}</option>
                  <option value="martingale">{t("martingale_mode") || "Мартингейл"}</option>
                  <option value="custom">{t("custom_mode") || "Пользовательский"}</option>
                </select>
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("trade_mode").title}</h4>
                <p className="text-sm">{getHelpContent("trade_mode").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("trade_mode").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 9 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("price_distribution") || "Распределение цен"}</h3>
                <select
                  value={priceDistribution}
                  onChange={(e) => {
                    setPriceDistribution(e.target.value);
                    setCurrentStep(10);
                  }}
                  className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="logarithmic">{t("logarithmic_distribution") || "Логарифмическое"}</option>
                  <option value="linear">{t("linear_distribution") || "Линейное"}</option>
                </select>
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("price_distribution").title}</h4>
                <p className="text-sm">{getHelpContent("price_distribution").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("price_distribution").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 10 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("order_grid_pull") || "Подтяжка сетки ордеров"}</h3>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={orderGridPull}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setOrderGridPull(value);
                    if (value > 0) setCurrentStep(11);
                  }}
                  className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("order_grid_pull").title}</h4>
                <p className="text-sm">{getHelpContent("order_grid_pull").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("order_grid_pull").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 11 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("stop_after_deal") || "Остановка после сделки"}</h3>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={stopAfterDeal}
                    onChange={(e) => {
                      setStopAfterDeal(e.target.checked);
                      setCurrentStep(12);
                    }}
                    className="mr-2"
                  />
                  <span>{t("enable_stop_after_deal") || "Включить остановку после сделки"}</span>
                </div>
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("stop_after_deal").title}</h4>
                <p className="text-sm">{getHelpContent("stop_after_deal").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("stop_after_deal").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 12 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("hedging") || "Хеджирование"}</h3>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={hedgingEnabled}
                    onChange={(e) => {
                      setHedgingEnabled(e.target.checked);
                      if (!e.target.checked) setCurrentStep(13);
                    }}
                    className="mr-2"
                  />
                  <span>{t("enable_hedging") || "Включить хеджирование"}</span>
                </div>
                {hedgingEnabled && (
                  <>
                    <div className="mb-4">
                      <label className="block mb-2">{t("hedging_trigger") || "Триггер хеджирования"}</label>
                      <div className="flex items-center mb-2">
                        <select
                          value={hedgingTriggerType}
                          onChange={(e) => setHedgingTriggerType(e.target.value)}
                          className="w-1/3 p-2 mr-2 border border-gray-700 bg-gray-800 text-white rounded-md"
                        >
                          <option value="amount">{t("amount") || "Сумма"}</option>
                          <option value="percent">{t("percent") || "Процент"}</option>
                        </select>
                        <input
                          type="number"
                          value={hedgingTriggerValue}
                          onChange={(e) => setHedgingTriggerValue(Number(e.target.value))}
                          className="w-1/3 p-2 border border-gray-700 bg-gray-800 text-white rounded-md"
                        />
                        <span className="ml-2">{hedgingTriggerType === "amount" ? quoteCoin || "USDT" : "%"}</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2">{t("hedging_direction") || "Направление хеджирования"}</label>
                      <select
                        value={hedgingDirection}
                        onChange={(e) => setHedgingDirection(e.target.value)}
                        className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md"
                      >
                        <option value="opposite">{t("opposite_direction") || "Противоположное"}</option>
                        <option value="same">{t("same_direction") || "То же"}</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2">{t("hedging_volume") || "Объем хеджирования"}</label>
                      <input
                        type="number"
                        min="0"
                        value={hedgingVolume}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setHedgingVolume(value);
                          if (value > 0) setCurrentStep(13);
                        }}
                        className="w-full p-3 border border-gray-700 bg-gray-800 text-white rounded-md"
                      />
                      <span className="ml-2">%</span>
                    </div>
                  </>
                )}
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("hedging").title}</h4>
                <p className="text-sm">{getHelpContent("hedging").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("hedging").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 13 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("stop_loss") || "Стоп-лосс"}</h3>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={stopLossEnabled}
                    onChange={(e) => setStopLossEnabled(e.target.checked)}
                    className="mr-2"
                  />
                  <span>{t("enable_stop_loss") || "Включить стоп-лосс"}</span>
                </div>
                {stopLossEnabled && (
                  <input
                    type="number"
                    min="0"
                    value={stopLoss}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setStopLoss(value);
                      if (value > 0) setCurrentStep(14);
                    }}
                    className="w-full p-3 mb-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                )}
                {!stopLossEnabled && (
                  <button
                    onClick={() => setCurrentStep(14)}
                    className="mt-4 p-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-all duration-200"
                  >
                    {t("next_step") || "Следующий шаг"}
                  </button>
                )}
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("stop_loss").title}</h4>
                <p className="text-sm">{getHelpContent("stop_loss").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("stop_loss").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 14 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("take_profit") || "Тейк-профит"}</h3>
                <div className="flex items-center mb-2">
                  <input
                    type="number"
                    min="0"
                    value={takeProfit}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setTakeProfit(value);
                      if (value > 0) setCurrentStep(15);
                    }}
                    className="w-full p-3 mb-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <img
                    src={quoteCoinOptions.find((opt) => opt.value === quoteCoin)?.icon || "/coins/default.png"}
                    alt={quoteCoin}
                    className="w-6 h-6 ml-2"
                  />
                  <span className="ml-2">{quoteCoin || "USDT"}</span>
                </div>
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("take_profit").title}</h4>
                <p className="text-sm">{getHelpContent("take_profit").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("take_profit").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 15 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("filters") || "Фильтры"}</h3>
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <select
                      value={filter.type}
                      onChange={(e) => handleUpdateFilter(index, "type", e.target.value)}
                      className="w-1/3 p-2 mr-2 border border-gray-700 bg-gray-800 text-white rounded-md"
                    >
                      <option value="rsi">{t("rsi_filter") || "RSI"}</option>
                      <option value="cci">{t("cci_filter") || "CCI"}</option>
                    </select>
                    <select
                      value={filter.interval}
                      onChange={(e) => handleUpdateFilter(index, "interval", e.target.value)}
                      className="w-1/3 p-2 mr-2 border border-gray-700 bg-gray-800 text-white rounded-md"
                    >
                      <option value="1min">{t("1min") || "1 минута"}</option>
                      <option value="5min">{t("5min") || "5 минут"}</option>
                      <option value="15min">{t("15min") || "15 минут"}</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={filter.value}
                      onChange={(e) => handleUpdateFilter(index, "value", Number(e.target.value))}
                      className="w-1/3 p-2 mr-2 border border-gray-700 bg-gray-800 text-white rounded-md"
                    />
                    <button
                      onClick={() => handleRemoveFilter(index)}
                      className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200"
                    >
                      {t("remove") || "Удалить"}
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddFilter}
                  className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-200"
                >
                  {t("add_filter") || "Добавить фильтр"}
                </button>
                <button
                  onClick={() => setCurrentStep(16)}
                  className="mt-4 p-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-all duration-200"
                >
                  {t("next_step") || "Следующий шаг"}
                </button>
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("filters").title}</h4>
                <p className="text-sm">{getHelpContent("filters").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("filters").link}</a>
              </div>
            </div>
          )}

          {currentStep >= 16 && (
            <div className="mb-4 p-4 bg-gray-900 shadow-[0_0_15px_#FBC30A] rounded-lg flex items-start">
              <div className="w-3/4 pr-4">
                <h3 className="text-xl font-bold mb-2">{t("final_step") || "Финальный шаг"}</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={handleRunBacktest}
                    className="p-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-200"
                  >
                    {t("run_backtest") || "Запустить бэктест"}
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="p-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200"
                  >
                    {t("create_bot") || "Создать бота"}
                  </button>
                </div>
                <p className="mt-4 text-white">{t("backtest_result") || "Результат бэктеста"}: {backtestResult}</p>
              </div>
              <div className="w-1/4 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-lg font-bold mb-2">{getHelpContent("final_step").title}</h4>
                <p className="text-sm">{getHelpContent("final_step").content}</p>
                <a href="#" className="text-yellow-400 underline mt-2 block">{getHelpContent("final_step").link}</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateBot;