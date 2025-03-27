-- 创建 todos 表
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT, -- 存储上传图片的URL
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 启用行级安全策略
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 创建用于自动更新updated_at字段的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON todos
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- 创建RLS策略：允许已认证用户查看自己的todos
CREATE POLICY "Users can view their own todos" ON todos
  FOR SELECT
  USING (auth.uid() = user_id);

-- 创建RLS策略：允许已认证用户添加自己的todos
CREATE POLICY "Users can insert their own todos" ON todos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建RLS策略：允许已认证用户更新自己的todos
CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建RLS策略：允许已认证用户删除自己的todos
CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE
  USING (auth.uid() = user_id);

-- 创建索引以提高查询性能
CREATE INDEX todos_user_id_idx ON todos(user_id);
CREATE INDEX todos_completed_idx ON todos(user_id, completed);