import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose to network
    port: 5173,
    // Optional: Configure to always use a specific host
    // host: '0.0.0.0',
  }
})
