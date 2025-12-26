-- 1) 给编者主页添加简介字段（公开展示，不包含敏感信息）
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';

-- 2) 评论支持图片：为评论表添加图片URL字段（仅存URL，不存文件）
ALTER TABLE public.article_comments
ADD COLUMN IF NOT EXISTS image_url text;

-- 3) 记录用户所有IP（仅管理员可查看）
CREATE TABLE IF NOT EXISTS public.user_ip_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip text NOT NULL,
  event_type text NOT NULL DEFAULT 'other',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_ip_logs_user_id_created_at
ON public.user_ip_logs (user_id, created_at DESC);

ALTER TABLE public.user_ip_logs ENABLE ROW LEVEL SECURITY;

-- 允许用户写入自己的IP记录（由前端调用后端函数写入时也会带JWT）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ip_logs' AND policyname = 'Users can insert their own ip logs'
  ) THEN
    CREATE POLICY "Users can insert their own ip logs"
    ON public.user_ip_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 仅管理员可查看所有IP记录（IP属于敏感信息）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ip_logs' AND policyname = 'Admins can view all ip logs'
  ) THEN
    CREATE POLICY "Admins can view all ip logs"
    ON public.user_ip_logs
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 管理员可删除IP记录（可选：用于清理）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ip_logs' AND policyname = 'Admins can delete ip logs'
  ) THEN
    CREATE POLICY "Admins can delete ip logs"
    ON public.user_ip_logs
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;