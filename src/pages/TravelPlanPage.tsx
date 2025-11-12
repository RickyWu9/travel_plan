import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, TextField, Button, Paper, Divider, CircularProgress, Alert } from '@mui/material'
import { Mic, Send, Edit, Save, Cancel, Delete, Map } from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { useSupabase } from '../hooks/useSupabase'
import OpenAI from 'openai'
import { Link } from 'react-router-dom'
import MapComponent from '../components/MapComponent'
import '../styles/TravelPlanPage.css'
import '../styles/MapComponent.css'

interface TravelPlan {
  id: string;
  destination: string;
  days: number;
  budget: number;
  people: number;
  preferences: string;
  planDetails: string;
  createdAt: string;
}

interface UserSettings {
  openai_api_key?: string;
  amap_api_key?: string;
  amap_security_key?: string;
}

const TravelPlanPage: React.FC = () => {
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState('')
  const [budget, setBudget] = useState('')
  const [people, setPeople] = useState('')
  const [preferences, setPreferences] = useState('')
  const [plans, setPlans] = useState<TravelPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<TravelPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editDestination, setEditDestination] = useState('')
  const [editDays, setEditDays] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [editPeople, setEditPeople] = useState('')
  const [editPreferences, setEditPreferences] = useState('')
  const [editPlanDetails, setEditPlanDetails] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings>({})
  const [showMap, setShowMap] = useState<boolean>(false)
  
  const { isListening, transcript, startListening, stopListening, error: voiceError } = useVoiceRecognition()
  const { supabase, user } = useSupabase()

  // 加载用户的旅行计划和设置
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    
    // 并行加载用户计划和设置
    await Promise.all([
      loadTravelPlans(),
      loadUserSettings()
    ])
  }

  const loadUserSettings = async () => {
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
      
      setUserSettings({
        openai_api_key: data.openai_api_key || '',
        amap_api_key: data.amap_api_key || '',
        amap_security_key: data.amap_security_key || ''
      })
    } catch (err) {
      console.error('加载用户设置失败:', err)
    }
  }

  const loadTravelPlans = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // 将数据库字段映射到接口定义的字段
      const formattedPlans: TravelPlan[] = data.map((plan: any) => ({
        id: plan.id,
        destination: plan.destination,
        days: plan.days,
        budget: plan.budget,
        people: plan.people,
        preferences: plan.preferences,
        planDetails: plan.plan_details || '', // 映射plan_details到planDetails
        createdAt: plan.created_at
      }))
      
      setPlans(formattedPlans)
    } catch (err) {
      console.error('加载旅行计划失败:', err)
    }
  }

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening()
      // 分析语音输入并填充表单
      parseVoiceInput(transcript)
    } else {
      startListening()
    }
  }

 
  // 仅在开发环境中自动运行测试
  useEffect(() => {
    // 注释掉以下行可以禁用自动测试，或仅在需要时手动调用testParseVoiceInput()
    // testParseVoiceInput();
  }, []);
  
  const parseVoiceInput = (text: string) => {
    // 增强的语音输入解析，支持更多样化的表达方式
    
    // 中文数字映射表
    const chineseNumbers: Record<string, number> = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      '百': 100, '千': 1000, '万': 10000
    };
    
    // 将中文数字转换为阿拉伯数字
    const convertChineseNumber = (chineseNum: string): number | null => {
      // 尝试直接转换单个数字
      if (chineseNumbers[chineseNum]) return chineseNumbers[chineseNum];
      
      // 尝试处理复合数字，如"十五"、"二十"等
      const complexPattern = /([一二三四五六七八九十])([十百千万])([一二三四五六七八九]?)/;
      const match = chineseNum.match(complexPattern);
      if (match) {
        const [, prefix, unit, suffix] = match;
        let result = 0;
        
        if (prefix && unit) {
          result += chineseNumbers[prefix] * chineseNumbers[unit];
        } else if (unit) {
          result += chineseNumbers[unit];
        }
        
        if (suffix) {
          result += chineseNumbers[suffix];
        }
        
        return result;
      }
      
      return null;
    };
    
    // 处理口语化的范围表达，如"3-5天"、"三到五天"
    const handleRangeExpression = (text: string, _type: 'days' | 'budget' | 'people'): string | null => {
      // 处理数字范围，如"3-5"、"3到5"
      const numberRangePattern = /(\d+)[-到](\d+)/;
      const numberRangeMatch = text.match(numberRangePattern);
      if (numberRangeMatch) {
        const [, min, max] = numberRangeMatch;
        // 返回中间值
        const avg = Math.round((parseInt(min) + parseInt(max)) / 2);
        return avg.toString();
      }
      
      // 处理中文数字范围，如"三到五"
      const chineseRangePattern = /([一二三四五六七八九十百千])([到至])([一二三四五六七八九十百千])/;
      const chineseRangeMatch = text.match(chineseRangePattern);
      if (chineseRangeMatch) {
        const [, min, , max] = chineseRangeMatch;
        const minNum = convertChineseNumber(min);
        const maxNum = convertChineseNumber(max);
        
        if (minNum !== null && maxNum !== null) {
          const avg = Math.round((minNum + maxNum) / 2);
          return avg.toString();
        }
      }
      
      return null;
    };
    
    // 目的地提取 - 支持多种表达形式
    const destinationPatterns = [
      /想去(.+?)[，。、；]/,
      /要去(.+?)[，。、；]/,
      /计划去(.+?)[，。、；]/,
      /打算去(.+?)[，。、；]/,
      /想去(.+?)[的待停]/,
      /想去(\w+)/, // 简单匹配
      /目的地是(.+?)[，。、；]/,
      /前往(.+?)[，。、；]/,
      /到(.+?)[旅游旅行游玩]/,
      /旅游去(.+?)[，。、；]/,
      /旅行去(.+?)[，。、；]/,
      /游玩去(.+?)[，。、；]/
    ];
    
    // 天数提取 - 支持更多表达方式
    const daysPatterns = [
      /(\d+)天/,
      /待(\d+)天/,
      /停留(\d+)天/,
      /玩(\d+)天/,
      /旅游(\d+)天/,
      /旅行(\d+)天/,
      /需要(\d+)天/,
      /大概(\d+)天/,
      /大约(\d+)天/,
      /([一二三四五六七八九十百千]+)天/ // 中文数字
    ];
    
    // 预算提取 - 支持更多单位和表达形式
    const budgetPatterns = [
      /预算(\d+)([万千百])?元/,
      /预算(\d+)([万千百])?块/,
      /预算(\d+)([万千百])?块钱/,
      /(\d+)([万千百])?元/,
      /(\d+)([万千百])?块/,
      /(\d+)([万千百])?块钱/,
      /大约(\d+)([万千百])?元/,
      /大约(\d+)([万千百])?块/,
      /大约(\d+)([万千百])?块钱/,
      /预算(\d+)([万千百])?人民币/,
      /(\d+)([万千百])?人民币/,
      /([一二三四五六七八九十百千万]+)元/,
      /([一二三四五六七八九十百千万]+)块/,
      /([一二三四五六七八九十百千万]+)块钱/,
      // 口语化表达，如"一两千"、"两三百"
      /(\d+)到(\d+)([万千百])?/,
      /(\d+)多(\d+)([万千百])?/,
      /大概(\d+)([万千百])?左右/,
      /大约(\d+)([万千百])?左右/
    ];
    
    // 人数提取 - 支持多种表达形式
    const peoplePatterns = [
      /(\d+)人/,
      /我们(\d+)人/,
      /共(\d+)人/,
      /总共(\d+)人/,
      /一起去(\d+)人/,
      /(\d+)个人/,
      /我们(\d+)个人/,
      /共(\d+)个人/,
      /总共(\d+)个人/,
      /有(\d+)人/,
      /一行(\d+)人/,
      /([一二三四五六七八九十百千]+)人/, // 中文数字
      /([一二三四五六七八九十百千]+)个人/ // 中文数字
    ];
    
    // 偏好提取 - 支持更多关键词
    const preferencesPatterns = [
      /喜欢(.+?)[，。、；]/,
      /想(.+?)[，。、；]/,
      /希望(.+?)[，。、；]/,
      /偏好(.+?)[，。、；]/,
      /想玩(.+?)[，。、；]/,
      /想去(.+?)[，。、；]玩/,
      /对(.+?)感兴趣/,
      /喜欢(\w+)/, // 简单匹配
      /想(\w+)/,    // 简单匹配
      /希望(\w+)/, // 简单匹配
      /偏好(\w+)/,  // 简单匹配
      /爱好(.+?)[，。、；]/,
      /倾向于(.+?)[，。、；]/,
      /想要(.+?)[，。、；]/,
      /需要(.+?)[，。、；]/,
      /偏爱(.+?)[，。、；]/,
      /特别喜欢(.+?)[，。、；]/,
      /最喜欢(.+?)[，。、；]/
    ];
    
    // 遍历所有可能的模式，直到找到匹配项
    // 目的地提取
    for (const pattern of destinationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        setDestination(match[1].trim());
        break;
      }
    }
    
    // 天数提取 - 尝试范围表达
    const daysRange = handleRangeExpression(text, 'days');
    if (daysRange) {
      setDays(daysRange);
    } else {
      // 遍历所有天数模式
      for (const pattern of daysPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          let daysValue;
          
          // 检查是否是中文数字
          if (/[一二三四五六七八九十百千]/.test(match[1])) {
            const chineseDays = convertChineseNumber(match[1]);
            daysValue = chineseDays !== null ? chineseDays.toString() : match[1];
          } else {
            daysValue = match[1];
          }
          
          setDays(daysValue);
          break;
        }
      }
    }
    
    // 预算提取 - 尝试范围表达
    const budgetRange = handleRangeExpression(text, 'budget');
    if (budgetRange) {
      setBudget(budgetRange);
    } else {
      // 遍历所有预算模式
      for (const pattern of budgetPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          let budgetValue;
          
          // 检查是否是中文数字
          if (/[一二三四五六七八九十百千万]/.test(match[1])) {
            const chineseBudget = convertChineseNumber(match[1]);
            budgetValue = chineseBudget !== null ? chineseBudget : 0;
          } else {
            budgetValue = parseInt(match[1]);
          }
          
          // 处理万、千、百单位
          if (match[2]) {
            if (match[2] === '万') budgetValue *= 10000;
            else if (match[2] === '千') budgetValue *= 1000;
            else if (match[2] === '百') budgetValue *= 100;
          }
          
          // 处理口语化的范围，如"3到5千"
          if (match[3]) {
            if (match[3] === '万') budgetValue *= 10000;
            else if (match[3] === '千') budgetValue *= 1000;
            else if (match[3] === '百') budgetValue *= 100;
          }
          
          setBudget(budgetValue.toString());
          break;
        }
      }
    }
    
    // 人数提取 - 尝试范围表达
    const peopleRange = handleRangeExpression(text, 'people');
    if (peopleRange) {
      setPeople(peopleRange);
    } else {
      // 遍历所有人數模式
      for (const pattern of peoplePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          let peopleValue;
          
          // 检查是否是中文数字
          if (/[一二三四五六七八九十百千]/.test(match[1])) {
            const chinesePeople = convertChineseNumber(match[1]);
            peopleValue = chinesePeople !== null ? chinesePeople.toString() : match[1];
          } else {
            peopleValue = match[1];
          }
          
          setPeople(peopleValue);
          break;
        }
      }
    }
    
    // 偏好提取
    for (const pattern of preferencesPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        // 清理偏好文本中的常见结尾词
        const preferences = match[1]
          .replace(/[，。、；]$/, '')
          .replace(/等[。，]$/, '')
          .trim();
        setPreferences(preferences);
        break;
      }
    }
  }

  const generateTravelPlan = async () => {
    setIsGenerating(true)
    setError('')
    
    try {
      // 从用户设置中获取API密钥
      const deepseekApiKey = userSettings.openai_api_key
      
      // 检查API密钥是否配置
      if (!deepseekApiKey) {
        setError('API_KEY_NOT_CONFIGURED')
        return
      }
      
      // 使用OpenAI SDK调用DeepSeek AI API
      const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: deepseekApiKey,
        dangerouslyAllowBrowser: true,
      })
      
      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的旅行规划师，擅长根据用户需求制定详细的旅行计划。请输出markdown格式的旅行计划，包括日程安排、预算明细和实用建议。'
          },
          {
            role: 'user',
            content: `请为我制定一个${days}天的${destination}旅行计划。我们一行${people}人，预算${budget}元。我的偏好是：${preferences}。请提供详细的日程安排、景点推荐、住宿建议、餐饮推荐和预算明细。`
          }
        ],
        temperature: 0.7
      })
      
      const planDetails = completion.choices[0].message.content || ''
      
      // 保存到数据库
      if (user) {
        const { data, error } = await supabase
          .from('travel_plans')
          .insert([{
            user_id: user.id,
            destination,
            days: parseInt(days),
            budget: parseFloat(budget),
            people: parseInt(people),
            preferences,
            plan_details: planDetails
          }])
          .select()
        
        if (error) throw error
        
        // 格式化新创建的计划
        const newPlan: TravelPlan = {
          id: data[0].id,
          destination: data[0].destination,
          days: data[0].days,
          budget: data[0].budget,
          people: data[0].people,
          preferences: data[0].preferences,
          planDetails: data[0].plan_details || '', // 映射plan_details到planDetails
          createdAt: data[0].created_at
        }
        setSelectedPlan(newPlan)
        await loadTravelPlans()
      }
    } catch (err) {
      console.error('生成旅行计划失败:', err)
      setError('生成旅行计划失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectPlan = (plan: TravelPlan) => {
    setSelectedPlan(plan)
    setIsEditing(false) // 取消编辑模式
  }

  const handleEditPlan = (plan: TravelPlan) => {
    setSelectedPlan(plan)
    // 填充编辑表单
    setEditDestination(plan.destination)
    setEditDays(plan.days.toString())
    setEditBudget(plan.budget.toString())
    setEditPeople(plan.people.toString())
    setEditPreferences(plan.preferences || '')
    setEditPlanDetails(plan.planDetails || '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // 清空编辑表单
    setEditDestination('')
    setEditDays('')
    setEditBudget('')
    setEditPeople('')
    setEditPreferences('')
    setEditPlanDetails('')
  }

  const handleDeletePlan = async (planId: string) => {
    if (!user) return
    
    if (!window.confirm('确定要删除这个旅行计划吗？此操作不可撤销。')) {
      return
    }
    
    setIsDeleting(true)
    setError('')
    
    try {
      const { error } = await supabase
        .from('travel_plans')
        .delete()
        .eq('id', planId)
      
      if (error) throw error
      
      // 重新加载旅行计划
      await loadTravelPlans()
      
      // 如果删除的是当前选中的计划，则清除选中状态
      if (selectedPlan && selectedPlan.id === planId) {
        setSelectedPlan(null)
        setIsEditing(false)
      }
    } catch (err) {
      console.error('删除旅行计划失败:', err)
      setError('删除旅行计划失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdatePlan = async () => {
    if (!selectedPlan || !user) return
    
    setIsUpdating(true)
    setError('')
    
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .update({
          destination: editDestination,
          days: parseInt(editDays),
          budget: parseFloat(editBudget),
          people: parseInt(editPeople),
          preferences: editPreferences,
          plan_details: editPlanDetails
        })
        .eq('id', selectedPlan.id)
        .select()
      
      if (error) throw error
      
      // 重新加载旅行计划
      await loadTravelPlans()
      
      // 格式化更新后的计划
      const updatedPlan: TravelPlan = {
        id: data[0].id,
        destination: data[0].destination,
        days: data[0].days,
        budget: data[0].budget,
        people: data[0].people,
        preferences: data[0].preferences,
        planDetails: data[0].plan_details || '',
        createdAt: data[0].created_at
      }
      
      setSelectedPlan(updatedPlan)
      setIsEditing(false)
    } catch (err) {
      console.error('更新旅行计划失败:', err)
      setError('更新旅行计划失败，请重试')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Container maxWidth={false} sx={{ width: '100%', p: 0 }}>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          行程规划
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            输入您的旅行需求
          </Typography>
          
          {voiceError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {voiceError}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="目的地"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              variant="outlined"
            />
            <TextField
              label="天数"
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              variant="outlined"
              sx={{ width: 120 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="预算（元）"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              variant="outlined"
              sx={{ width: 150 }}
            />
            <TextField
              label="人数"
              type="number"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              variant="outlined"
              sx={{ width: 120 }}
            />
            <TextField
              fullWidth
              label="偏好（美食、购物、景点等）"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Mic />}
              onClick={handleVoiceInput}
              sx={{ flex: 1 }}
            >
              {isListening ? '停止录音' : '语音输入'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={generateTravelPlan}
              disabled={!destination || !days || !budget || isGenerating}
              sx={{ flex: 1 }}
            >
              {isGenerating ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                '生成计划'
              )}
            </Button>
          </Box>
        </Paper>

        {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error === 'API_KEY_NOT_CONFIGURED' ? (
                  <>
                    请先在 <Link to="/settings" style={{ color: 'white', textDecoration: 'underline' }}>设置页面</Link> 配置DeepSeek API密钥
                  </>
                ) : (
                  error
                )}
              </Alert>
            )}

        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* 计划列表 */}
          <Paper elevation={3} className="plan-list-container" sx={{ p: 2, flex: 1, minWidth: 300, maxHeight: '60vh', overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              我的旅行计划
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {plans.map((plan) => (
              <Paper
              key={plan.id}
              elevation={1}
              className="plan-card"
              sx={{
                p: 2,
                mb: 1,
                minWidth: '100%',
                backgroundColor: selectedPlan?.id === plan.id ? '#e3f2fd' : 'inherit',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%'
              }}>
              <Box onClick={() => handleSelectPlan(plan)} sx={{ cursor: 'pointer' }}>
                <Typography variant="subtitle1">
                  {plan.destination} - {plan.days}天
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  预算：{plan.budget}元 | 人数：{plan.people}人
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  size="small" 
                  startIcon={<Edit fontSize="small" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPlan(plan);
                  }}
                  disabled={isDeleting}
                >
                  编辑
                </Button>
                <Button 
                  size="small" 
                  startIcon={<Delete fontSize="small" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlan(plan.id);
                  }}
                  color="error"
                  disabled={isDeleting}
                >
                  删除
                </Button>
              </Box>
            </Paper>
            ))}
            {plans.length === 0 && (
              <Typography variant="body2" color="textSecondary" align="center">
                暂无旅行计划，生成一个新的吧！
              </Typography>
            )}
          </Paper>

          {/* 计划详情 */}
          <Paper elevation={3} sx={{ p: 3, flex: 2, maxHeight: '60vh', overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                计划详情
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {selectedPlan ? (
              <Box className="plan-details">
                {isEditing ? (
                  // 编辑模式
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      编辑旅行计划
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                      <TextField
                        fullWidth
                        label="目的地"
                        value={editDestination}
                        onChange={(e) => setEditDestination(e.target.value)}
                        variant="outlined"
                      />
                      <TextField
                        label="天数"
                        type="number"
                        value={editDays}
                        onChange={(e) => setEditDays(e.target.value)}
                        variant="outlined"
                        sx={{ width: 120 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                      <TextField
                        label="预算（元）"
                        type="number"
                        value={editBudget}
                        onChange={(e) => setEditBudget(e.target.value)}
                        variant="outlined"
                        sx={{ width: 150 }}
                      />
                      <TextField
                        label="人数"
                        type="number"
                        value={editPeople}
                        onChange={(e) => setEditPeople(e.target.value)}
                        variant="outlined"
                        sx={{ width: 120 }}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      label="偏好（美食、购物、景点等）"
                      value={editPreferences}
                      onChange={(e) => setEditPreferences(e.target.value)}
                      variant="outlined"
                      multiline
                      rows={3}
                      sx={{ mb: 3 }}
                    />
                    <TextField
                      fullWidth
                      label="计划详情（支持Markdown格式）"
                      value={editPlanDetails}
                      onChange={(e) => setEditPlanDetails(e.target.value)}
                      variant="outlined"
                      multiline
                      rows={8}
                      sx={{ mb: 3 }}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleUpdatePlan}
                        disabled={!editDestination || !editDays || !editBudget || !editPeople || isUpdating}
                      >
                        {isUpdating ? (
                          <CircularProgress size={24} sx={{ color: 'white' }} />
                        ) : (
                          '保存修改'
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                      >
                        取消
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  // 查看模式
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h5">
                        {selectedPlan.destination} {selectedPlan.days}天旅行计划
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<Map />}
                        onClick={() => setShowMap(!showMap)}
                      >
                        {showMap ? '隐藏地图' : '查看地图'}
                      </Button>
                    </Box>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: 1, 
                      maxHeight: 400,
                      overflowY: 'auto',
                      width: '100%',
                      minWidth: 700,
                      maxWidth: '100%',
                      '& h1': { fontSize: '1.5rem', marginTop: '1rem', marginBottom: '0.5rem' },
                      '& h2': { fontSize: '1.3rem', marginTop: '1rem', marginBottom: '0.5rem' },
                      '& h3': { fontSize: '1.1rem', marginTop: '1rem', marginBottom: '0.5rem' },
                      '& p': { marginBottom: '0.5rem' },
                      '& ul, & ol': { paddingLeft: '1.5rem', marginBottom: '0.5rem' },
                      '& blockquote': { borderLeft: '4px solid #2196f3', paddingLeft: '1rem', marginLeft: 0 },
                      '& code': { backgroundColor: '#e0e0e0', padding: '0.2rem 0.4rem', borderRadius: '0.2rem' },
                      '&::-webkit-scrollbar': { width: 6 },
                      '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
                      '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: 3 },
                      '&::-webkit-scrollbar-thumb:hover': { background: '#555' }
                    }}>
                      {showMap ? (
                      <Box sx={{ height: 400, mb: 3, borderRadius: 1, overflow: 'hidden', width: '100%', minWidth: 700, maxWidth: '100%' }}>
                        <MapComponent 
                          destination={selectedPlan.destination} 
                          apiKey={userSettings.amap_api_key || ''} 
                          securityKey={userSettings.amap_security_key || ''} 
                        />
                      </Box>
                    ) : (
                      <ReactMarkdown>
                        {selectedPlan.planDetails}
                      </ReactMarkdown>
                    )}
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 4 }}>
                选择一个旅行计划查看详情
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  )
}

export default TravelPlanPage