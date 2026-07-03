import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base '/scrum-poker/' passt zum gh-pages Deploy-Pfad
export default defineConfig({
  plugins: [react()],
  base: './',
  // Preview-Harness weist den Port via PORT-Env zu; sonst Vite-Default.
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
})
