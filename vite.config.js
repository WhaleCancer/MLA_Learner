import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** GitHub project Pages URL: /<repo>/ */
const GH_PAGES_BASE = "/MLA_Learner/";

export default defineConfig({
  plugins: [react()],
  base: process.env.GH_PAGES === "true" ? GH_PAGES_BASE : "./",
});
