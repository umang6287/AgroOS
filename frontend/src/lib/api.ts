export const DEFAULT_API_URL = "https://agroos-production.up.railway.app";

export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
