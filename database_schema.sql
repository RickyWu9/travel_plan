-- 创建用户表（如果使用Supabase的认证系统，这部分可能不需要手动创建）
-- 以下是针对PostgreSQL的SQL语句

-- 创建旅行计划表
CREATE TABLE travel_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  destination VARCHAR(255) NOT NULL,
  days INTEGER NOT NULL CHECK (days > 0),
  budget DECIMAL(12, 2) NOT NULL CHECK (budget >= 0),
  people INTEGER NOT NULL CHECK (people > 0),
  preferences TEXT,
  plan_details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建费用记录表
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  plan_id UUID REFERENCES travel_plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建用户设置表
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  openai_api_key VARCHAR(255),
  xunfei_app_id VARCHAR(255),
  xunfei_api_key VARCHAR(255),
  xunfei_api_secret VARCHAR(255),
  baidu_map_api_key VARCHAR(255),
  voice_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX idx_travel_plans_user_id ON travel_plans(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_plan_id ON expenses(plan_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- 如果使用的是其他数据库系统，可能需要调整语法
-- 例如，MySQL版本：
/*
CREATE TABLE travel_plans (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  days INT NOT NULL CHECK (days > 0),
  budget DECIMAL(12, 2) NOT NULL CHECK (budget >= 0),
  people INT NOT NULL CHECK (people > 0),
  preferences TEXT,
  plan_details TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE expenses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  plan_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE SET NULL
);

CREATE TABLE user_settings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  openai_api_key VARCHAR(255),
  xunfei_app_id VARCHAR(255),
  xunfei_api_key VARCHAR(255),
  xunfei_api_secret VARCHAR(255),
  baidu_map_api_key VARCHAR(255),
  voice_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_travel_plans_user_id ON travel_plans(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_plan_id ON expenses(plan_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
*/