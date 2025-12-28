import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./App.tsx",
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
            },
            colors: {
                accent: {
                    primary: "var(--accent-primary)",
                    secondary: "var(--accent-secondary)",
                },
            },
        },
    },
    plugins: [],
};
export default config;
