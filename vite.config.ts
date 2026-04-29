import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 🚀 핵심: base 경로를 레포지토리 이름으로 설정해야 합니다!
  base: '/destiny_hybrid_master/', 
})
