
import { useState } from "react";
import LanguageContext from "./LanguageContext";
import en from "../locales/en/translation";
import vi from "../locales/vi/translation";

const translations = {
    en,
    vi,
};

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem("language");

        return translations[savedLanguage]
            ? savedLanguage
            : "en";
    });

    const changeLanguage = (languageCode) => {
        if (!translations[languageCode]) {
            return;
        }

        setLanguage(languageCode);
        localStorage.setItem("language", languageCode);
    };

    const t = (key) => {
        const keys = key.split(".");
        let value = translations[language];

        for (const part of keys) {
            value = value?.[part];
        }

        return typeof value === "string" ? value : key;
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                changeLanguage,
                t,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}
