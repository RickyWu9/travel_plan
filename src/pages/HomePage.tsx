import React from 'react'
import { Container, Typography, Button, Box, Grid, Card, CardContent } from '@mui/material'
import { Link } from 'react-router-dom'
import { CalendarToday, AccountBalance, Mic, Map } from '@mui/icons-material'
import { useSupabase } from '../hooks/useSupabase'
import '../styles/HomePage.css'

const HomePage: React.FC = () => {
  const { user } = useSupabase()
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', my: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          智能旅行规划助手
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          通过AI了解您的需求，自动生成详细的旅行路线和建议，让旅行更加轻松愉快
        </Typography>
        {!user && (
          <Box sx={{ mt: 4 }}>
            <Button 
              variant="contained" 
              size="large"
              component={Link} 
              to="/register"
              sx={{ mr: 2 }}
            >
              开始使用
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              component={Link} 
              to="/login"
            >
              登录
            </Button>
          </Box>
        )}
        {user && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              欢迎回来！
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              component={Link} 
              to="/plan"
            >
              开始规划您的行程
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={4} sx={{ mt: 8 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', boxShadow: 3 }}>
            <CardContent>
              <div className="feature-icon">
                <CalendarToday fontSize="large" />
              </div>
              <Typography variant="h5" component="h3" gutterBottom>
                智能行程规划
              </Typography>
              <Typography color="textSecondary">
                输入目的地、日期、预算和偏好，AI将为您生成个性化的旅行路线，包括交通、住宿、景点和餐厅推荐。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', boxShadow: 3 }}>
            <CardContent>
              <div className="feature-icon">
                <AccountBalance fontSize="large" />
              </div>
              <Typography variant="h5" component="h3" gutterBottom>
                费用预算与管理
              </Typography>
              <Typography color="textSecondary">
                AI进行预算分析，记录旅行开销，帮助您更好地控制旅行花费，提供详细的费用统计。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', boxShadow: 3 }}>
            <CardContent>
              <div className="feature-icon">
                <Mic fontSize="large" />
              </div>
              <Typography variant="h5" component="h3" gutterBottom>
                语音交互
              </Typography>
              <Typography color="textSecondary">
                支持语音输入功能，让您可以通过语音快速描述旅行需求，更便捷地规划行程。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 12, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          为什么选择我们？
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Box className="advantage-item">
              <Map className="advantage-icon" />
              <Typography variant="h6" gutterBottom>
                地图化展示
              </Typography>
              <Typography color="textSecondary">
                直观的地图界面，清晰展示行程路线和景点分布，让您对旅行一目了然。
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box className="advantage-item">
              <Mic className="advantage-icon" />
              <Typography variant="h6" gutterBottom>
                智能语音助手
              </Typography>
              <Typography color="textSecondary">
                通过语音输入快速规划行程，记录费用，让旅行规划更加便捷。
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default HomePage