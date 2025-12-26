import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AuthorBadge } from '@/components/AuthorBadge';
import { ArticleCard } from '@/components/ArticleCard';
import { Loader2, User, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Profile {
  user_id: string;
  real_name: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
  status: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_at: string;
  is_pinned: boolean;
  pinned_at: string | null;
  author_id: string;
  profiles: { 
    real_name: string;
    avatar_url: string | null;
  } | null;
  authorRole?: 'admin' | 'editor' | null;
}

export default function EditorProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<'admin' | 'editor' | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfileAndArticles();
    }
  }, [userId]);

  const fetchProfileAndArticles = async () => {
    setIsLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError || !profileData) {
        navigate('/');
        return;
      }

      setProfile(profileData);

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['admin', 'editor'])
        .maybeSingle();

      if (roleData && (roleData.role === 'admin' || roleData.role === 'editor')) {
        setRole(roleData.role);
      }

      // Fetch articles by this author
      const { data: articlesData } = await supabase
        .from('articles')
        .select(`
          *,
          profiles!articles_author_id_profiles_fkey(real_name, avatar_url)
        `)
        .eq('author_id', userId)
        .eq('published', true)
        .order('created_at', { ascending: false });

      const articlesWithRoles = (articlesData || []).map(article => ({
        ...article,
        authorRole: roleData?.role as 'admin' | 'editor' || null,
      })) as Article[];

      setArticles(articlesWithRoles);
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>

        {/* Profile Card */}
        <div className="wiki-card mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback><User className="w-10 h-10" /></AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="font-serif text-2xl font-bold">{profile.real_name}</h1>
                <AuthorBadge role={role} />
              </div>
              
              <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mb-4">
                <Calendar className="w-4 h-4" />
                加入于 {formatDate(profile.created_at)}
              </p>
              
              {profile.bio && (
                <p className="text-foreground max-w-2xl">{profile.bio}</p>
              )}
              
              {!profile.bio && (
                <p className="text-muted-foreground italic">这位编者还没有填写简介</p>
              )}
            </div>

            <div className="text-center md:text-right">
              <div className="text-3xl font-bold text-primary">{articles.length}</div>
              <div className="text-sm text-muted-foreground">篇文章</div>
            </div>
          </div>
        </div>

        {/* Articles Section */}
        <div className="mb-6">
          <h2 className="font-serif text-xl font-bold flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" />
            发布的文章
          </h2>
          
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard 
                  key={article.id} 
                  id={article.id}
                  title={article.title}
                  content={article.content}
                  coverImage={article.cover_image_url}
                  authorName={article.profiles?.real_name || '未知作者'}
                  authorRole={article.authorRole}
                  createdAt={article.created_at}
                  isPinned={article.is_pinned}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无文章</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
