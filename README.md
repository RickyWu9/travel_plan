# 旅行助手应用

这是一个基于React和Supabase开发的旅行助手应用，支持行程规划、预算管理和语音交互功能。

## 技术栈

- **前端**：React 18, TypeScript, Material UI
- **后端/数据库**：Supabase
- **其他**：Chart.js (图表), OpenAI API (AI旅行计划生成)

## 快速开始

### 1. 项目设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 2. Supabase设置

1. **创建Supabase项目**
   - 访问 [Supabase官网](https://supabase.com) 并创建账户
   - 创建一个新的项目

2. **配置环境变量**
   - 复制 `.env` 文件中的示例配置
   - 将您的Supabase项目URL和匿名密钥填入相应位置：

   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **创建数据库表**
   - 打开Supabase项目的SQL编辑器
   - 复制并执行 `database_schema.sql` 文件中的SQL语句
   - 这将创建三个必要的数据表：`travel_plans`、`expenses` 和 `user_settings`

4. **配置认证**
   - 在Supabase控制台中，启用电子邮件/密码认证
   - 确保在项目设置中配置正确的站点URL（开发环境为 http://localhost:3000）

### 3. API密钥配置

如需使用AI旅行计划生成功能，请配置OpenAI API密钥：

```
VITE_OPENAI_API_KEY=your-openai-api-key
```

## 数据库结构

### 1. travel_plans 表

存储用户的旅行计划信息：

- `id`: UUID, 主键
- `user_id`: UUID, 关联到用户表
- `destination`: VARCHAR(255), 目的地
- `days`: INTEGER, 旅行天数
- `budget`: DECIMAL(12, 2), 预算金额
- `people`: INTEGER, 人数
- `preferences`: TEXT, 旅行偏好
- `plan_details`: TEXT, 生成的旅行计划详情
- `created_at`: TIMESTAMPTZ, 创建时间

### 2. expenses 表

存储用户的费用记录：

- `id`: UUID, 主键
- `user_id`: UUID, 关联到用户表
- `description`: VARCHAR(255), 费用描述
- `amount`: DECIMAL(10, 2), 金额
- `category`: VARCHAR(50), 类别（餐饮、交通、住宿等）
- `date`: DATE, 日期
- `plan_id`: UUID, 可选，关联到特定旅行计划
- `created_at`: TIMESTAMPTZ, 创建时间
- `updated_at`: TIMESTAMPTZ, 更新时间

### 3. user_settings 表

存储用户的配置信息：

- `id`: UUID, 主键
- `user_id`: UUID, 关联到用户表
- `openai_api_key`: VARCHAR(255), OpenAI API密钥
- `xunfei_app_id`: VARCHAR(255), 讯飞应用ID
- `xunfei_api_key`: VARCHAR(255), 讯飞API密钥
- `xunfei_api_secret`: VARCHAR(255), 讯飞API密钥
- `baidu_map_api_key`: VARCHAR(255), 百度地图API密钥
- `voice_enabled`: BOOLEAN, 是否启用语音功能
- `notifications_enabled`: BOOLEAN, 是否启用通知
- `created_at`: TIMESTAMPTZ, 创建时间
- `updated_at`: TIMESTAMPTZ, 更新时间

## 功能说明

### 1. 行程规划
- 输入目的地、天数、预算、人数和偏好
- 使用AI生成详细的旅行计划
- 保存和管理多个旅行计划

### 2. 预算管理
- 记录旅行中的各项支出
- 按类别统计费用
- 可视化费用分布

### 3. 用户管理
- 注册和登录
- 个人设置管理
- API密钥配置

## 注意事项

1. 本应用使用真实的Supabase数据库和OpenAI API，需要有效的配置才能正常工作
2. 默认配置仅用于开发环境，生产环境需要使用实际的API密钥和数据库连接
3. 所有API密钥应妥善保管，不要提交到版本控制系统

## 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```