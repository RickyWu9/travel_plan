-- 更新用户设置表结构的SQL脚本

-- 添加高德地图API密钥字段（如果不存在）
-- 注：如果表中已经有amap_api_key字段，则此语句会被忽略
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS amap_api_key VARCHAR(255) DEFAULT NULL;

-- 添加高德地图安全密钥字段
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS amap_security_key VARCHAR(255) DEFAULT NULL;

-- 删除不需要的字段
ALTER TABLE user_settings
DROP COLUMN IF EXISTS xunfei_app_id,
DROP COLUMN IF EXISTS xunfei_api_key,
DROP COLUMN IF EXISTS xunfei_api_secret,
DROP COLUMN IF EXISTS baidu_map_api_key,
DROP COLUMN IF EXISTS voice_enabled,
DROP COLUMN IF EXISTS notifications_enabled;

-- 更新现有记录的默认值（如果需要）
UPDATE user_settings 
SET amap_api_key = '' 
WHERE amap_api_key IS NULL;

UPDATE user_settings 
SET amap_security_key = '' 
WHERE amap_security_key IS NULL;

-- 确保openai_api_key字段存在（用于DeepSeek）
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS openai_api_key VARCHAR(255) DEFAULT NULL;

UPDATE user_settings 
SET openai_api_key = '' 
WHERE openai_api_key IS NULL;