import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        soil: "#5b4636",
        leaf: "#2f6f3e",
        field: "#edf5e8",
        ink: "#172016"
      }
    }
  },
  plugins: []
};

export default config;
