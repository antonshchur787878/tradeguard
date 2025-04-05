import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import ua from "./locales/ua.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      ua: { translation: ua },
    },
    lng: localStorage.getItem("language") || "ru", // Читаем язык из localStorage, по умолчанию "ru"
    fallbackLng: "ru", // Язык по умолчанию, если перевод отсутствует
    interpolation: { escapeValue: false }, // Отключаем экранирование значений
  });

// Функция для смены языка
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  localStorage.setItem("language", lng); // Сохраняем выбранный язык
};

export default i18n;