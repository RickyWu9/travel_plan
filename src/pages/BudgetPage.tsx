import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, TextField, Button, Paper, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Alert } from '@mui/material'
import { Mic, Add, Delete, Edit, Save, Cancel, CalendarToday, FilterList, Coffee, Train, Hotel, EventSeat, ShoppingBag, MoreHoriz } from '@mui/icons-material'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { useSupabase } from '../hooks/useSupabase'
import Chart from 'chart.js/auto'
import '../styles/BudgetPage.css'

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  planId: string | null;
}

const BudgetPage: React.FC = () => {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('餐饮')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [chart, setChart] = useState<Chart | null>(null)
  // 添加日期范围筛选相关状态
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  
  const { isListening, transcript, startListening, stopListening, error: voiceError } = useVoiceRecognition()
  const { supabase, user } = useSupabase()

  const categories = ['餐饮', '交通', '住宿', '门票', '购物', '其他']

  // 加载用户的费用记录
  useEffect(() => {
    if (user) {
      loadExpenses()
    }
  }, [user])

  // 初始化图表
  useEffect(() => {
    if (filteredExpenses.length > 0) {
      initChart()
    }
    return () => {
      if (chart) {
        chart.destroy()
      }
    }
  }, [filteredExpenses])

  // 应用日期筛选
  useEffect(() => {
    if (!startDate && !endDate) {
      // 没有筛选条件，显示所有费用
      setFilteredExpenses(expenses)
    } else {
      // 应用日期筛选
      const filtered = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        const start = startDate ? new Date(startDate) : null
        const end = endDate ? new Date(endDate) : null
        
        if (start && expenseDate < start) return false
        if (end && expenseDate > end) return false
        
        return true
      })
      setFilteredExpenses(filtered)
    }
  }, [expenses, startDate, endDate])

  const loadExpenses = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      
      if (error) throw error
      setExpenses(data as Expense[])
    } catch (err) {
      console.error('加载费用记录失败:', err)
    }
  }

  const handleFilter = () => {
    // 筛选逻辑已在useEffect中处理
    console.log('应用筛选:', { startDate, endDate })
  }

  const clearFilter = () => {
    setStartDate('')
    setEndDate('')
  }

  const initChart = () => {
    const ctx = document.getElementById('expenseChart') as HTMLCanvasElement
    if (!ctx) return

    // 计算各类别的总支出
    const categoryTotals: { [key: string]: number } = {}
    filteredExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount
    })

    const labels = Object.keys(categoryTotals)
    const values = Object.values(categoryTotals)

    if (chart) {
      chart.destroy()
    }

    const newChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '支出金额',
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + '元'
              }
            }
          }
        }
      }
    })

    setChart(newChart)
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

  const parseVoiceInput = (text: string) => {
    // 简单的语音输入解析
    // 例如："午餐50元"
    const amountMatch = text.match(/(\d+)元/)
    const descMatch = text.match(/(.+?)\d+/)
    
    if (amountMatch) setAmount(amountMatch[1])
    if (descMatch) setDescription(descMatch[1].trim())
  }

  const addOrUpdateExpense = async () => {
    if (!description || !amount || !user) return
    
    try {
      const expenseData = {
        description,
        amount: parseFloat(amount),
        category,
        date,
        plan_id: null // 可以关联到特定旅行计划
      }
      
      if (editingId) {
        // 更新现有记录
        await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingId)
        setEditingId(null)
      } else {
        // 添加新记录
        await supabase
          .from('expenses')
          .insert([{
            ...expenseData,
            user_id: user.id
          }])
      }
      
      // 重置表单
      setDescription('')
      setAmount('')
      setCategory('餐饮')
      setDate(new Date().toISOString().split('T')[0])
      
      // 重新加载数据
      await loadExpenses()
    } catch (err) {
      console.error('保存费用记录失败:', err)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!user) return
    
    try {
      await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
      await loadExpenses()
    } catch (err) {
      console.error('删除费用记录失败:', err)
    }
  }

  const editExpense = (expense: Expense) => {
    setEditingId(expense.id)
    setDescription(expense.description)
    setAmount(expense.amount.toString())
    setCategory(expense.category)
    setDate(expense.date)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDescription('')
    setAmount('')
    setCategory('餐饮')
    setDate(new Date().toISOString().split('T')[0])
  }

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0)
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          费用管理
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            记录新支出
          </Typography>
          
          {voiceError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {voiceError}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              label="描述"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="outlined"
              sx={{ flex: 1 }}
            />
            <TextField
              label="金额（元）"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              variant="outlined"
              sx={{ width: 150 }}
            />
            <TextField
              select
              label="类别"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              variant="outlined"
              SelectProps={{
                native: true,
              }}
              sx={{ width: 120 }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </TextField>
            <TextField
              label="日期"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              variant="outlined"
              sx={{ width: 150 }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Mic />}
              onClick={handleVoiceInput}
            >
              {isListening ? '停止录音' : '语音输入'}
            </Button>
            {editingId ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={addOrUpdateExpense}
                >
                  保存
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={cancelEdit}
                >
                  取消
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={addOrUpdateExpense}
                disabled={!description || !amount}
              >
                添加支出
              </Button>
            )}
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {/* 费用列表 */}
          <Paper elevation={3} sx={{ p: 2, flex: 2, minWidth: 300 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                费用记录
              </Typography>
              <IconButton color="primary" onClick={() => {}}>
                <FilterList />
              </IconButton>
            </Box>
            
            {/* 日期范围筛选器 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
              <TextField
                label="开始日期"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <TextField
                label="结束日期"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FilterList fontSize="small" />}
                  onClick={handleFilter}
                >
                  筛选
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={clearFilter}
                >
                  清除
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              总支出：{getTotalExpenses()}元
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>描述</TableCell>
                    <TableCell>金额</TableCell>
                    <TableCell>类别</TableCell>
                    <TableCell>日期</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.amount}元</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getCategoryIcon(expense.category)}
                        <Box sx={{ ml: 1 }}>{expense.category}</Box>
                      </Box>
                    </TableCell>
                    <TableCell>{expense.date}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => editExpense(expense)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteExpense(expense.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {expenses.length === 0 && (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
                暂无费用记录
              </Typography>
            )}
          </Paper>

          {/* 费用统计图表 */}
          <Paper elevation={3} sx={{ p: 3, flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, width: '100%' }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" sx={{ mb: 0 }}>
                <CalendarToday sx={{ mr: 1 }} /> 费用统计
              </Typography>
            </Box>
            <Divider sx={{ width: '100%', mb: 2 }} />
            {expenses.length > 0 ? (
              <canvas id="expenseChart" width="400" height="300"></canvas>
            ) : (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
                添加费用记录后查看统计图表
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  )
}

// 获取类别对应的图标
function getCategoryIcon(category: string) {
  switch(category) {
    case '餐饮':
      return <Coffee fontSize="small" color="error" />;
    case '交通':
      return <Train fontSize="small" color="primary" />;
    case '住宿':
      return <Hotel fontSize="small" color="success" />;
    case '门票':
      return <EventSeat fontSize="small" color="warning" />;
    case '购物':
      return <ShoppingBag fontSize="small" color="info" />;
    case '其他':
    default:
      return <MoreHoriz fontSize="small" color="secondary" />;
  }
}

export default BudgetPage