import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, TextField, Button, Paper, Divider, Alert } from '@mui/material'
import { useSupabase } from '../hooks/useSupabase'
import '../styles/SettingsPage.css'

interface UserSettings {
  openai_api_key?: string;
  amap_api_key?: string;
  amap_security_key?: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    amap_api_key: '',
    amap_security_key: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  const { supabase, user } = useSupabase()

  // 加载用户设置
  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        // 如果没有设置记录，使用默认值
        if (error.code === 'PGRST116') {
          return
        }
        throw error
      }
      
      setSettings({
        openai_api_key: data.openai_api_key || '',
        amap_api_key: data.amap_api_key || '',
        amap_security_key: data.amap_security_key || ''
      })
    } catch (err) {
      console.error('加载设置失败:', err)
    }
  }

  const saveSettings = async () => {
    if (!user) return
    
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(null)
    
    try {
      // 先检查是否已存在设置记录
      const { data: existingData } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      let result
      
      if (existingData) {
        // 如果存在记录，则更新
        result = await supabase
          .from('user_settings')
          .update({
            ...settings
          })
          .eq('user_id', user.id)
      } else {
        // 如果不存在记录，则插入
        result = await supabase
          .from('user_settings')
          .insert([{
            user_id: user.id,
            ...settings
          }])
      }
      
      if (result.error) throw result.error
      
      setSaveSuccess(true)
      // 3秒后隐藏成功提示
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('保存设置失败:', err)
      setSaveError(err instanceof Error ? err.message : '保存设置时发生错误')
      // 5秒后隐藏错误提示
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof UserSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          设置
        </Typography>
        
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            设置已保存成功！
          </Alert>
        )}
        {saveError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            保存设置失败: {saveError}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            API密钥设置
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            请输入您的API密钥以启用相应功能。所有密钥将安全存储在您的账户中。
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
            <TextField
              fullWidth
              label="DeepSeek API Key (用于行程规划)"
              value={settings.openai_api_key || ''}
              onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
              variant="outlined"
              type="password"
              InputProps={{
                endAdornment: (
                  <Button variant="text" size="small" onClick={() => handleInputChange('openai_api_key', '')}>
                    清除
                  </Button>
                ),
              }}
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
              高德地图API配置（可选）
            </Typography>
            <TextField
              fullWidth
              label="高德地图 API Key"
              value={settings.amap_api_key || ''}
              onChange={(e) => handleInputChange('amap_api_key', e.target.value)}
              variant="outlined"
              type="password"
            />
            <TextField
              fullWidth
              label="高德地图 安全密钥"
              value={settings.amap_security_key || ''}
              onChange={(e) => handleInputChange('amap_security_key', e.target.value)}
              variant="outlined"
              type="password"
            />
          </Box>
          
          <Button
            variant="contained"
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存设置'}
          </Button>
        </Paper>



        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            关于
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="body2" paragraph>
            旅行规划助手 v1.0.0
          </Typography>
          <Typography variant="body2" paragraph>
            一个基于AI的智能旅行规划应用，帮助您轻松规划旅行行程，管理旅行预算。
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default SettingsPage