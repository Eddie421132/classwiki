-- 添加文章置顶字段
ALTER TABLE public.articles ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;

-- 添加置顶时间字段
ALTER TABLE public.articles ADD COLUMN pinned_at timestamp with time zone;

-- 只有管理员可以更新置顶状态
CREATE POLICY "Admins can update pinned status"
ON public.articles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 创建索引加速置顶文章查询
CREATE INDEX idx_articles_pinned ON public.articles (is_pinned DESC, pinned_at DESC NULLS LAST);