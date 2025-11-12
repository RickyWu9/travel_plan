import React, { useState } from 'react'
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { useSupabase } from '../hooks/useSupabase'
import '../styles/LoginPage.css'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useSupabase()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('开始登录过程，邮箱:', email)
    const result = await login(email, password)
    console.log('登录结果:', result)
    
    // 登录成功后跳转到行程规划页
    if (result.success) {
      console.log('登录成功，跳转到行程规划页')
      navigate('/plan')
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, borderRadius: 2, boxShadow: 3, backgroundColor: 'white' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          登录
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="邮箱"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="密码"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Typography>
              还没有账号？ <Link to="/register" className="link">立即注册</Link>
            </Typography>
          </Box>
        </form>
      </Box>
    </Container>
  )
}

export default LoginPage