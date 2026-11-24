
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const changeTheme = useCallback((newTheme) => {
        if (newTheme !== "light" && newTheme !== "dark") {
            return;
        }

        setTheme(newTheme);
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                setTheme: changeTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used within a ThemeProvider"
        );
    }

    return context;
}
