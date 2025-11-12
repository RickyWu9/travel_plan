import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import EnvironmentPlugin from 'vite-plugin-environment'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    EnvironmentPlugin({
      // 环境变量配置
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      OPENAI_API_KEY: '',
      XUNFEI_APP_ID: '',
      XUNFEI_API_KEY: '',
      XUNFEI_API_SECRET: '',
      BAIDU_MAP_API_KEY: ''
    })
  ],
  server: {
    port: 3000
  }
})