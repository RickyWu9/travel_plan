import { useState, useEffect } from 'react'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

// 创建Supabase客户端实例
// 使用真实的环境变量配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('错误：缺少必要的Supabase配置。请确保.env文件中设置了VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY。')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

interface UseSupabaseReturn {
  supabase: SupabaseClient
  user: User | null
  loading: boolean
  error: Error | null
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>
  register: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>
  logout: () => Promise<{ success: boolean; error?: string }>
}

export function useSupabase(): UseSupabaseReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // 检查用户会话
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        setUser(data.session?.user || null)
      } catch (err) {
        console.error('检查用户会话失败:', err)
        setError(err instanceof Error ? err : new Error('未知错误'))
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // 监听认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // 实际模式下的登录处理
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      setUser(data.user)
      return { success: true, user: data.user || undefined }
    } catch (err) {
      console.error('登录失败:', err)
      const errorMessage = err instanceof Error ? err.message : '登录失败'
      setError(err instanceof Error ? err : new Error('登录失败'))
      return { success: false, error: errorMessage, user: undefined }
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // 实际模式下的注册处理
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      if (error) throw error
      setUser(data.user)
      return { success: true, user: data.user || undefined }
    } catch (err) {
      console.error('注册失败:', err)
      const errorMessage = err instanceof Error ? err.message : '注册失败'
      setError(err instanceof Error ? err : new Error('注册失败'))
      return { success: false, error: errorMessage, user: undefined }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 实际模式下的登出处理
      await supabase.auth.signOut()
      setUser(null)
      return { success: true }
    } catch (err) {
      console.error('登出失败:', err)
      const errorMessage = err instanceof Error ? err.message : '登出失败'
      setError(err instanceof Error ? err : new Error('登出失败'))
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    supabase,
    user,
    loading,
    error,
    login,
    register,
    logout
  }
}