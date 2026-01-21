import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Send, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Suggestion {
  id: string;
  content: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function Suggestions() {
  const { user, isAdmin, isSecondAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/user-auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching suggestions:', error);
    } else {
      setSuggestions(data || []);
    }
    setIsLoadingSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!newSuggestion.trim()) {
      toast.error('请输入建议内容');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('suggestions')
      .insert({
        user_id: user!.id,
        content: newSuggestion.trim(),
      });

    if (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('提交失败');
    } else {
      toast.success('建议已提交');
      setNewSuggestion('');
      fetchSuggestions();
    }
    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />待处理</Badge>;
      case 'approved':
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" />已采纳</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // 管理员不应该看到这个页面
  if (isAdmin || isSecondAdmin) {
    navigate('/admin');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>

        <h1 className="text-2xl font-bold mb-6">建议箱</h1>

        {/* 提交新建议 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">提交新建议</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="请输入您对网站的建议..."
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              rows={4}
            />
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !newSuggestion.trim()}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? '提交中...' : '提交建议'}
            </Button>
          </CardContent>
        </Card>

        {/* 我的建议列表 */}
        <h2 className="text-xl font-semibold mb-4">我的建议</h2>
        {isLoadingSuggestions ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : suggestions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              暂无建议记录
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(suggestion.created_at).toLocaleString('zh-CN')}
                    </span>
                    {getStatusBadge(suggestion.status)}
                  </div>
                  <p className="mb-4 whitespace-pre-wrap">{suggestion.content}</p>
                  {suggestion.admin_response && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">管理员回复：</p>
                      <p className="text-sm">{suggestion.admin_response}</p>
                      {suggestion.reviewed_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          回复时间：{new Date(suggestion.reviewed_at).toLocaleString('zh-CN')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
