import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, IconButton, Box, Switch } from '@mui/material'
import { Home, CalendarToday, AccountBalance, Settings, Logout, Menu } from '@mui/icons-material'
import { useSupabase } from '../hooks/useSupabase'
import '../styles/Navbar.css'

interface NavbarProps {
  isDarkMode: boolean
  setIsDarkMode: (isDark: boolean) => void
}

const Navbar: React.FC<NavbarProps> = ({ isDarkMode, setIsDarkMode }) => {
  const { user, logout } = useSupabase()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsDarkMode(event.target.checked)
  }

  return (
    <AppBar position="static" sx={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#3f51b5' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>旅行规划助手</Link>
        </Typography>
        
        {/* 桌面菜单 */}
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Button startIcon={<Home />} color="inherit" component={Link} to="/">首页</Button>
          {user && (
            <>
              <Button startIcon={<CalendarToday />} color="inherit" component={Link} to="/plan">行程规划</Button>
              <Button startIcon={<AccountBalance />} color="inherit" component={Link} to="/budget">费用管理</Button>
              <Button startIcon={<Settings />} color="inherit" component={Link} to="/settings">设置</Button>
              <Button startIcon={<Logout />} color="inherit" onClick={handleLogout}>退出</Button>
            </>
          )}
          {!user && (
            <>
              <Button color="inherit" component={Link} to="/login">登录</Button>
              <Button color="inherit" component={Link} to="/register">注册</Button>
            </>
          )}
          <Switch
            checked={isDarkMode}
            onChange={handleThemeChange}
            color="default"
            aria-label="主题切换"
          />
        </Box>

        {/* 移动端菜单按钮 */}
        <IconButton
          edge="end"
          color="inherit"
          aria-label="menu"
          sx={{ display: { xs: 'flex', md: 'none' } }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu />
        </IconButton>
      </Toolbar>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <Box sx={{ display: { xs: 'block', md: 'none' }, padding: 2, backgroundColor: isDarkMode ? '#1a1a1a' : '#3f51b5' }}>
          <Button fullWidth color="inherit" component={Link} to="/" onClick={() => setMobileMenuOpen(false)}>首页</Button>
          {user && (
            <>
              <Button fullWidth color="inherit" component={Link} to="/plan" onClick={() => setMobileMenuOpen(false)}>行程规划</Button>
              <Button fullWidth color="inherit" component={Link} to="/budget" onClick={() => setMobileMenuOpen(false)}>费用管理</Button>
              <Button fullWidth color="inherit" component={Link} to="/settings" onClick={() => setMobileMenuOpen(false)}>设置</Button>
              <Button fullWidth color="inherit" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>退出</Button>
            </>
          )}
          {!user && (
            <>
              <Button fullWidth color="inherit" component={Link} to="/login" onClick={() => setMobileMenuOpen(false)}>登录</Button>
              <Button fullWidth color="inherit" component={Link} to="/register" onClick={() => setMobileMenuOpen(false)}>注册</Button>
            </>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Switch
              checked={isDarkMode}
              onChange={handleThemeChange}
              color="default"
              aria-label="主题切换"
            />
          </Box>
        </Box>
      )}
    </AppBar>
  )
}

export default Navbar