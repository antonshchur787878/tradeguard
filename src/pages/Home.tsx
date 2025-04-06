import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode"; // Исправленный импорт

const languages = [
  { code: "ru", name: "Русский", flag: "/flags/ru.png" },
  { code: "en", name: "English", flag: "/flags/en.png" },
  { code: "ua", name: "Українська", flag: "/flags/ua.png" },
];

// Компонент TradingViewWidget
const TradingViewWidget: React.FC = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      new (window as any).TradingView.widget({
        width: "100%",
        height: "100%",
        symbol: "BTCUSD",
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "ru",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: "tradingview_widget",
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="tradingview_widget" className="w-full h-[400px]" />;
};

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState("ru");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "ru";
    setSelectedLang(savedLang);
    changeLanguage(savedLang);
  }, []);

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    changeLanguage(lang);
    localStorage.setItem("language", lang);
    setIsDropdownOpen(false);
  };

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (!validateEmail(e.target.value)) {
      setError(t("invalid_email") || "Неверный формат email");
    } else if (!password && !isRegistering) {
      setError(t("fill_all_fields") || "Заполните все поля");
    } else {
      setError(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (e.target.value.length < 6) {
      setError(t("short_password") || "Пароль должен быть не менее 6 символов");
    } else if (!email) {
      setError(t("fill_all_fields") || "Заполните все поля");
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (isRegister: boolean) => {
    if (!email || (!password && !isRegistering)) {
      setError(t("fill_all_fields") || "Заполните все поля");
      return;
    }
    if (!validateEmail(email)) {
      setError(t("invalid_email") || "Неверный формат email");
      return;
    }
    if (password && password.length < 6) {
      setError(t("short_password") || "Пароль должен быть не менее 6 символов");
      return;
    }

    try {
      const endpoint = isRegister ? "/api/register" : "/api/login";
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password: password || "google-auth" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || (isRegister ? "Ошибка регистрации" : "Ошибка логина"));
      }
      if (!isRegister) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        alert(t("registration_success") || "Регистрация успешна. Теперь вы можете войти.");
        setIsRegistering(false);
      }
      setError(null);
    } catch (err: any) {
      setError(
        isRegister
          ? `Ошибка регистрации: ${err.message}`
          : `Ошибка логина: ${err.message}`
      );
    }
  };

  // Обработка входа через Google
  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      // Декодируем токен Google, чтобы получить данные пользователя
      const userData: any = jwtDecode(credentialResponse.credential);
      const { email } = userData;

      // Заполняем поле email
      setEmail(email);
      setError(null);

      // Автоматически отправляем запрос на вход
      const response = await fetch("http://localhost:3000/api/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: userData.name || "Google User",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка входа через Google");
      }

      // Сохраняем токен и перенаправляем на дашборд
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 flex flex-col items-center">
      <header className="fixed top-0 left-0 w-full bg-black px-4 py-3 flex justify-between items-center z-50 shadow-[0_0_20px_#FBC30A]">
        <h1 className="text-4xl font-bold text-yellow-400 shadow-[0_0_15px_#FBC30A] px-3 py-2 rounded-lg">
          TradeGuard
        </h1>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-gray-900 text-white border border-gray-700 px-3 py-2 rounded-md flex items-center cursor-pointer"
          >
            <img
              src={
                languages.find((l) => l.code === selectedLang)?.flag ||
                "/flags/ru.png"
              }
              alt={selectedLang}
              className="w-5 h-3 mr-2"
            />
            <span className="text-sm">
              {languages.find((l) => l.code === selectedLang)?.name || "Русский"}
            </span>
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full mt-2 bg-gray-900 border border-gray-700 rounded-md w-32">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="flex items-center p-2 hover:bg-gray-700 cursor-pointer text-sm"
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

      <div className="mt-20"></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl w-full mb-4">
        <div className="bg-gray-900 text-center py-3 text-lg font-black uppercase border border-yellow-400 shadow-[0_0_10px_#FBC30A] rounded-lg">
          {t("hedging_deals") || "Хеджирование сделок"}
        </div>
        <div className="bg-gray-900 text-center py-3 text-lg font-black uppercase border border-yellow-400 shadow-[0_0_10px_#FBC30A] rounded-lg">
          {t("free_usage") || "Бесплатное использование"}
        </div>
        <div className="bg-gray-900 text-center py-3 text-lg font-black uppercase border border-yellow-400 shadow-[0_0_10px_#FBC30A] rounded-lg">
          {t("real_time_analysis") || "Анализ в реальном времени"}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl w-full">
        <div className="col-span-2 border border-yellow-400 shadow-[0_0_15px_#FBC30A] rounded-lg overflow-hidden">
          <TradingViewWidget />
        </div>
        <div className="bg-gray-900 p-5 border border-yellow-400 shadow-[0_0_15px_#FBC30A] rounded-lg">
          <h2 className="text-lg font-bold mb-3">
            {isRegistering
              ? t("register_title") || "Регистрация"
              : t("enter_credentials") || "Введите данные для входа"}
          </h2>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => {
              setError(t("google_login_failed") || "Ошибка входа через Google");
            }}
            text="signin_with"
            width="100%"
          />
          <p className="text-center mb-2 text-sm">{t("or") || "или"}</p>
          <input
            className="w-full p-2 border border-yellow-400 bg-gray-800 text-white rounded-md mb-2 text-sm"
            type="email"
            placeholder={t("email") || "Email"}
            value={email}
            onChange={handleEmailChange}
          />
          <input
            className="w-full p-2 border border-yellow-400 bg-gray-800 text-white rounded-md mb-2 text-sm"
            type="password"
            placeholder={t("password") || "Пароль"}
            value={password}
            onChange={handlePasswordChange}
          />
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <button
            onClick={() => handleSubmit(isRegistering)}
            className="bg-yellow-400 text-black w-full py-2 rounded-md font-bold text-sm"
          >
            {isRegistering
              ? t("register_button") || "Зарегистрироваться"
              : t("login_button") || "Войти"}
          </button>
          <p className="text-center mt-2 text-sm">
            {isRegistering
              ? t("have_account") || "Уже есть аккаунт?"
              : t("no_account") || "Нет аккаунта?"}{" "}
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-yellow-400 underline"
            >
              {isRegistering
                ? t("login_button") || "Войти"
                : t("register") || "Зарегистрируйтесь"}
            </button>
          </p>
        </div>
      </div>

      <div className="mt-4 p-5 bg-gray-900 border border-yellow-400 shadow-[0_0_15px_#FBC30A] rounded-lg text-center max-w-4xl w-full">
        <h2 className="text-2xl font-black uppercase text-yellow-400 mb-2">
          {t("backtest_statistics") || "Статистика бэктеста"}
        </h2>
        <p className="text-sm font-bold text-gray-400">
          {t("historical_data") || "Исторические данные"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          <div className="p-2 border border-yellow-400 shadow-[0_0_10px_#FBC30A] rounded-lg text-sm font-bold">
            {t("profit") || "Прибыль"}: <span className="text-green-400">+172%</span>
          </div>
          <div className="p-2 border border-yellow-400 shadow-[0_0_10px_#FBC30A] rounded-lg text-sm font-bold">
            {t("completed_trades") || "Завершенные сделки"}: 1245
          </div>
          <div className="p-2 border border-yellow-400 shadow-[0_0_10px_#FBC30A] rounded-lg text-sm font-bold">
            {t("success_rate") || "Успешность"}: 89%
          </div>
        </div>
      </div>

      <footer className="text-center text-gray-500 mt-4 text-xs">
        © 2025 TradeGuard. {t("all_rights_reserved") || "Все права защищены"}
      </footer>
    </div>
  );
};

export default Home;