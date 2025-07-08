import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-solid"],
  vite: () => ({
    plugins: [tailwindcss()],
    build: { sourcemap: true },
  }),
  manifest: {
    permissions: ["storage", "activeTab", "sidePanel"],
    host_permissions: ["*://fe.afip.gob.ar/*"],
    name: "AFIP Invoice Helper",
    description:
      "Automate and streamline AFIP electronic invoice creation with saved client data and templates",
    icons: {
      "16": "icon/16.png",
      "32": "icon/32.png",
      "48": "icon/48.png",
      "96": "icon/96.png",
      "128": "icon/128.png",
    },
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';",
    },
    action: {
      default_title: "AFIP Invoice Helper",
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
    // Firefox-specific sidebar configuration
    sidebar_action: {
      default_title: "AFIP Invoice Helper",
      default_panel: "sidepanel.html",
    },
    browser_specific_settings: {
      gecko: {
        id: "afip-invoice-helper",
      },
    },
  },
});
