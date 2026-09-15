"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

type ThemeContextValue = {
	theme?: string;
	setTheme: (theme: string) => void;
	resolvedTheme?: string;
	systemTheme?: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue>({
	setTheme: () => {},
});

export function useTheme() {
	return useContext(ThemeContext);
}

function applyClass(resolved: "light" | "dark", disableTransition: boolean) {
	const root = document.documentElement;
	let restore: (() => void) | undefined;
	if (disableTransition) {
		const style = document.createElement("style");
		style.appendChild(
			document.createTextNode(
				"*,*::before,*::after{-webkit-transition:none!important;transition:none!important}",
			),
		);
		document.head.appendChild(style);
		restore = () => {
			window.getComputedStyle(document.body);
			setTimeout(() => style.remove(), 1);
		};
	}
	root.classList.remove("light", "dark");
	root.classList.add(resolved);
	root.style.colorScheme = resolved;
	restore?.();
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
	enableSystem = true,
	disableTransitionOnChange = false,
}: {
	children: ReactNode;
	attribute?: string;
	defaultTheme?: string;
	enableSystem?: boolean;
	disableTransitionOnChange?: boolean;
}) {
	const [theme, setThemeState] = useState(defaultTheme);
	const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		try {
			const stored = localStorage.getItem("theme");
			if (stored) setThemeState(stored);
		} catch {
			/* private mode */
		}
	}, []);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const sync = () => setSystemTheme(mq.matches ? "dark" : "light");
		sync();
		mq.addEventListener("change", sync);
		return () => mq.removeEventListener("change", sync);
	}, []);

	const resolvedTheme: "light" | "dark" =
		theme === "system" && enableSystem
			? systemTheme
			: theme === "dark"
				? "dark"
				: "light";

	useEffect(() => {
		applyClass(resolvedTheme, disableTransitionOnChange);
	}, [resolvedTheme, disableTransitionOnChange]);

	const setTheme = useCallback((next: string) => {
		setThemeState(next);
		try {
			localStorage.setItem("theme", next);
		} catch {
			/* private mode */
		}
	}, []);

	const value = useMemo(
		() => ({ theme, setTheme, resolvedTheme, systemTheme }),
		[theme, setTheme, resolvedTheme, systemTheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}
