import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "i18next";

const exchanges = [
  { value: "Bybit", label: "Bybit", icon: "/exchanges/bybit.png" },
  { value: "Binance", label: "Binance", icon: "/exchanges/binance.png" },
  { value: "OKX", label: "OKX", icon: "/exchanges/okx.png" },
];

const languages = [
  { code: "ru", name: "Русский", flag: "/flags/ru.png" },
  { code: "en", name: "English", flag: "/flags/en.png" },
  { code: "ua", name: "Українська", flag: "/flags/ua.png" },
];

interface ApiKey {
  _id: string;
  exchange: string;
  label: string;
  key: string;
  secret: string;
}

const ApiKeys = () => {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [form, setForm] = useState({
    exchange: "Bybit",
    label: "",
    key: "",
    secret: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exchangeDropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExchangeDropdownOpen, setIsExchangeDropdownOpen] = useState(false);

  useEffect(() => {
    const savedKeys = localStorage.getItem("apiKeys");
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateApiKey = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/get-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exchangeName: form.exchange.toLowerCase(),
          apiKey: form.key,
          apiSecret: form.secret,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      if (data.total) {
        return true;
      } else {
        throw new Error(data.error || "Invalid API key");
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKey = async () => {
    if (form.key && form.secret && form.label) {
      const isValid = await validateApiKey();
      if (isValid) {
        const newKey: ApiKey = {
          _id: Date.now().toString(),
          exchange: form.exchange,
          label: form.label,
          key: form.key,
          secret: form.secret,
        };
        const newKeys = [...apiKeys, newKey];
        setApiKeys(newKeys);
        localStorage.setItem("apiKeys", JSON.stringify(newKeys));
        setForm({ exchange: "Bybit", label: "", key: "", secret: "" });
      }
    } else {
      alert(t("fill_all_fields"));
    }
  };

  const handleDeleteKey = (index: number) => {
    const newKeys = apiKeys.filter((_, i) => i !== index);
    setApiKeys(newKeys);
    localStorage.setItem("apiKeys", JSON.stringify(newKeys));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        exchangeDropdownRef.current &&
        !exchangeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExchangeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 flex flex-col items-center">
      <header className="fixed top-0 left-0 w-full bg-black p-4 flex justify-between items-center z-50 shadow-[0_0_20px_#FBC30A]">
        <h1 className="text-5xl font-bold text-yellow-400 shadow-[0_0_20px_#FBC30A] px-4 py-2 rounded-lg">
          TradeGuard
        </h1>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-gray-900 text-white border border-gray-700 p-2 rounded-md flex items-center cursor-pointer"
          >
            <img
              src={languages.find((l) => l.code === selectedLang)?.flag}
              alt={selectedLang}
              className="w-5 h-3 mr-2"
            />
            <span>{languages.find((l) => l.code === selectedLang)?.name}</span>
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full mt-2 bg-gray-900 border border-gray-700 rounded-md w-32">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    changeLanguage(lang.code);
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center p-2 hover:bg-gray-700 cursor-pointer"
                >
                  <img
                    src={lang.flag}
                    alt={lang.code}
                    className="w-5 h-3 mr-2"
                  />
                  <span>{lang.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="mt-24"></div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-[0_0_15px_#FBC30A] w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">{t("add_api_key")}</h2>

        <label className="block mb-2">{t("exchange_label")}</label>
        <div className="relative" ref={exchangeDropdownRef}>
          <div
            className="w-full p-3 border border-yellow-400 bg-gray-800 text-white rounded-md cursor-pointer flex items-center"
            onClick={() => setIsExchangeDropdownOpen(!isExchangeDropdownOpen)}
          >
            {form.exchange ? (
              <>
                <img
                  src={exchanges.find((ex) => ex.value === form.exchange)?.icon}
                  alt={form.exchange}
                  className="w-5 h-5 mr-2"
                  onError={(e) =>
                    (e.currentTarget.src = "/exchanges/default.png")
                  }
                />
                {exchanges.find((ex) => ex.value === form.exchange)?.label}
              </>
            ) : (
              t("select_exchange")
            )}
          </div>
          {isExchangeDropdownOpen && (
            <div className="absolute z-10 bg-gray-800 w-full mt-1 max-h-40 overflow-y-auto rounded-md shadow-lg">
              {exchanges.map((ex) => (
                <div
                  key={ex.value}
                  className="flex items-center p-2 hover:bg-gray-600 cursor-pointer"
                  onClick={() => {
                    setForm({ ...form, exchange: ex.value });
                    setIsExchangeDropdownOpen(false);
                  }}
                >
                  <img
                    src={ex.icon}
                    alt={ex.label}
                    className="w-5 h-5 mr-2"
                    onError={(e) =>
                      (e.currentTarget.src = "/exchanges/default.png")
                    }
                  />
                  {ex.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="block mb-2 mt-3">{t("label")}:</label>
        <input
          name="label"
          value={form.label}
          onChange={handleChange}
          className="w-full p-2 border border-yellow-400 bg-gray-800 text-white rounded-md mb-3"
          placeholder={t("label_placeholder")}
        />

        <label className="block mb-2">{t("api_key")}:</label>
        <input
          name="key"
          value={form.key}
          onChange={handleChange}
          className="w-full p-2 border border-yellow-400 bg-gray-800 text-white rounded-md mb-3"
          placeholder={t("enter_api_key")}
        />

        <label className="block mb-2">{t("api_secret")}:</label>
        <input
          name="secret"
          value={form.secret}
          onChange={handleChange}
          className="w-full p-2 border border-yellow-400 bg-gray-800 text-white rounded-md mb-3"
          placeholder={t("enter_api_secret")}
        />

        {error && <p className="text-red-500 mb-3">{error}</p>}
        <button
          onClick={handleAddKey}
          className="w-full bg-yellow-400 text-black font-bold p-2 rounded-md mt-4"
          disabled={isLoading}
        >
          {isLoading ? t("validating") : t("add_button")}
        </button>
      </div>

      <div className="mt-6 bg-gray-900 p-6 rounded-lg shadow-[0_0_15px_#FBC30A] w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">{t("my_api_keys")}</h2>
        {apiKeys.length === 0 ? (
          <p className="text-gray-400">{t("no_api_keys")}</p>
        ) : (
          <ul>
            {apiKeys.map((key, index) => {
              const exchange = exchanges.find((ex) => ex.value === key.exchange);
              return (
                <li
                  key={key._id}
                  className="p-3 bg-gray-800 rounded-md mb-3 flex justify-between items-center"
                >
                  <div className="flex items-center">
                    {exchange && (
                      <img
                        src={exchange.icon}
                        alt={exchange.label}
                        className="w-5 h-5 mr-2"
                        onError={(e) =>
                          (e.currentTarget.src = "/exchanges/default.png")
                        }
                      />
                    )}
                    <span>
                      {key.label || key.exchange} - {key.key}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(index)}
                    className="bg-red-500 text-white p-2 rounded-md"
                  >
                    {t("delete")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ApiKeys;