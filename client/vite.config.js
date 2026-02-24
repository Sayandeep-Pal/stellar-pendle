import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Polyfills Buffer, process, global – required by @stellar/stellar-sdk XDR encoding in browser.
    // globals:true injects Buffer/process/global as actual globals into every module.
    nodePolyfills({ globals: { Buffer: true, process: true, global: true } }),
  ],
})
