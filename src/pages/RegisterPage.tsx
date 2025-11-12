import React, { useState } from 'react'
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material'
import { Link } from 'react-router-dom'
import { useSupabase } from '../hooks/useSupabase'
import '../styles/RegisterPage.css'

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState('')
  const { register, loading, error } = useSupabase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证密码是否匹配
    if (password !== confirmPassword) {
      setValidationError('两次输入的密码不一致')
      return
    }
    
    setValidationError('')
    console.log('开始注册过程，邮箱:', email)
    const result = await register(email, password)
    console.log('注册结果:', result)
    
    // 显示注册结果
    if (result.success) {
      alert('注册成功！')
    } else {
      alert('注册失败: ' + (result.error || '未知错误'))
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, borderRadius: 2, boxShadow: 3, backgroundColor: 'white' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          注册
        </Typography>
        
        {(error || validationError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error?.message || validationError}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="密码长度至少8位"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="确认密码"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Typography>
              已有账号？ <Link to="/login" style={{ color: '#3f51b5', textDecoration: 'none' }}>立即登录</Link>
            </Typography>
          </Box>
        </form>
      </Box>
    </Container>
  )
}

export default RegisterPage