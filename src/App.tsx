import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TravelPlanPage from './pages/TravelPlanPage'
import BudgetPage from './pages/BudgetPage'
import SettingsPage from './pages/SettingsPage'
import Navbar from './components/Navbar'
import { useSupabase } from './hooks/useSupabase'

function App() {
  const { user, loading } = useSupabase()
  const [isDarkMode, setIsDarkMode] = useState(false)

  // 添加useEffect来监听用户状态变化并打印日志，帮助调试
  useEffect(() => {
    console.log('用户状态更新:', user ? '已登录' : '未登录')
  }, [user])

  useEffect(() => {
    // 检查系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(prefersDark)
  }, [])

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/plan" element={user ? <TravelPlanPage /> : <Navigate to="/login" />} />
          <Route path="/budget" element={user ? <BudgetPage /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App