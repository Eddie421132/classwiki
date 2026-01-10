import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Ban, Trash2, Loader2, Plus, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface BannedIp {
  id: string;
  ip: string;
  reason: string | null;
  created_at: string;
  banned_by: string;
}

export function IpBanManager() {
  const { user, isAdmin, isSecondAdmin } = useAuth();
  const [bannedIps, setBannedIps] = useState<BannedIp[]>([]);
  const [newIp, setNewIp] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const canManage = isAdmin || isSecondAdmin;

  useEffect(() => {
    if (canManage) {
      fetchBannedIps();
    }
  }, [canManage]);

  const fetchBannedIps = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('banned_ips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBannedIps(data || []);
    } catch (error) {
      console.error('Failed to fetch banned IPs:', error);
      toast.error('加载封禁IP列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBan = async () => {
    if (!newIp.trim()) {
      toast.error('请输入IP地址');
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIp.trim())) {
      toast.error('请输入有效的IP地址格式');
      return;
    }

    if (!user?.id) return;

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('banned_ips')
        .insert({
          ip: newIp.trim(),
          reason: reason.trim() || null,
          banned_by: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('该IP已被封禁');
        } else {
          throw error;
        }
        return;
      }

      toast.success(`已封禁IP: ${newIp}`);
      setNewIp('');
      setReason('');
      fetchBannedIps();
    } catch (error) {
      console.error('Failed to ban IP:', error);
      toast.error('封禁IP失败');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveBan = async (ip: BannedIp) => {
    try {
      const { error } = await supabase
        .from('banned_ips')
        .delete()
        .eq('id', ip.id);

      if (error) throw error;

      toast.success(`已解封IP: ${ip.ip}`);
      fetchBannedIps();
    } catch (error) {
      console.error('Failed to unban IP:', error);
      toast.error('解封IP失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!canManage) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ban className="w-5 h-5" />
          IP封禁管理
        </CardTitle>
        <CardDescription>封禁指定IP地址，阻止其访问网站</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new ban form */}
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ban-ip">IP地址</Label>
              <Input
                id="ban-ip"
                placeholder="例如: 192.168.1.1"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ban-reason">封禁原因 (可选)</Label>
              <Input
                id="ban-reason"
                placeholder="输入封禁原因"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleAddBan}
            disabled={isAdding || !newIp.trim()}
            className="w-full md:w-auto gap-2"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            添加封禁
          </Button>
        </div>

        {/* Banned IPs list */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" />
            已封禁的IP ({bannedIps.length})
          </h4>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : bannedIps.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无封禁的IP</p>
          ) : (
            <div className="space-y-2">
              {bannedIps.map((ip) => (
                <div
                  key={ip.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-mono font-medium">{ip.ip}</p>
                    <p className="text-sm text-muted-foreground">
                      {ip.reason || '无原因'} · 封禁于 {formatDate(ip.created_at)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveBan(ip)}
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    解封
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
