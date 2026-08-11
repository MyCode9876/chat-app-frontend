import { useState, useEffect } from "react";
import en from "../app/languages/en.json";
import gu from "../app/languages/gu.json";
import hi from "../app/languages/hi.json";

const translations = { en, gu, hi };

export function useTranslation() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("appLanguage") || "en";
      setLang(saved);

      const handleStorageChange = () => {
        const current = localStorage.getItem("appLanguage") || "en";
        setLang(current);
      };
      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("languageChanged", handleStorageChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("languageChanged", handleStorageChange);
      };
    }
  }, []);

  const t = (key, defaultText) => {
    const dict = translations[lang] || translations["en"];
    return dict[key] || defaultText || key;
  };

  return { t, lang, setLang };
}
