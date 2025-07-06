import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    permissions: ['storage', 'activeTab'],
    host_permissions: ['*://fe.afip.gob.ar/*'],
    name: 'AFIP Invoice Helper',
    description: 'Automate and streamline AFIP electronic invoice creation with saved client data and templates',
  },
});
