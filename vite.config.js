import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` is configurable for project-style static hosts (e.g. GitHub Pages
// project sites need "/<repo>/"). Defaults to "/" for root-served hosts
// (Netlify, Vercel, GitHub Pages user/org sites). Set VITE_BASE at build time.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
});
