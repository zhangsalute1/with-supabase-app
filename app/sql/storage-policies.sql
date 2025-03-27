-- 为my-todo存储桶创建权限策略

-- 确保存储桶存在
INSERT INTO storage.buckets (id, name, public)
VALUES ('my-todo', 'my-todo', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 创建策略：允许所有已验证用户查看存储桶中的文件（公开读取）
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
USING (bucket_id = 'my-todo');

-- 创建策略：允许用户向以自己ID命名的文件夹中上传文件
CREATE POLICY "User Upload" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'my-todo' AND auth.uid()::text = storage.foldername(name));

-- 创建策略：允许用户更新自己上传的文件
CREATE POLICY "User Update" ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'my-todo' AND auth.uid()::text = storage.foldername(name));

-- 创建策略：允许用户删除自己上传的文件
CREATE POLICY "User Delete" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'my-todo' AND auth.uid()::text = storage.foldername(name));

-- 可选：如果你希望限制只有已认证用户可以查看文件（而不是公开）
-- 请使用下面的策略替换上面的"Public Access"策略
/*
CREATE POLICY "Authenticated Users Only" ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'my-todo');
*/ 