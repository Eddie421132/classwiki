import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Sparkles, Bug, Wrench } from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'feature' | 'fix' | 'improvement';
  changes: string[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '1.5.0',
    date: '2025-01-27',
    type: 'feature',
    changes: [
      '新增第二管理员角色系统',
      '第二管理员可使用用户名密码登录',
      '新增更新日志页面',
      '评论区显示用户角色标签（管理员/第二管理员/编者）',
    ],
  },
  {
    version: '1.4.0',
    date: '2025-01-26',
    type: 'feature',
    changes: [
      '新增图片点击放大查看功能',
      '添加查看全部文章按钮',
      '移除IP记录功能',
    ],
  },
  {
    version: '1.3.0',
    date: '2025-01-25',
    type: 'feature',
    changes: [
      '新增文章评论功能',
      '支持评论图片上传',
      '新增文章点赞功能',
    ],
  },
  {
    version: '1.2.0',
    date: '2025-01-24',
    type: 'feature',
    changes: [
      '新增AI智能搜索功能',
      '优化搜索结果展示',
    ],
  },
  {
    version: '1.1.0',
    date: '2025-01-23',
    type: 'improvement',
    changes: [
      '优化编辑器体验',
      '新增文章草稿功能',
      '支持封面图片上传',
    ],
  },
  {
    version: '1.0.0',
    date: '2025-01-22',
    type: 'feature',
    changes: [
      '7班Wiki正式上线',
      '支持用户注册和审核',
      '支持文章发布和管理',
      '管理员后台系统',
    ],
  },
];

const getTypeIcon = (type: ChangelogEntry['type']) => {
  switch (type) {
    case 'feature':
      return <Sparkles className="w-4 h-4" />;
    case 'fix':
      return <Bug className="w-4 h-4" />;
    case 'improvement':
      return <Wrench className="w-4 h-4" />;
  }
};

const getTypeBadge = (type: ChangelogEntry['type']) => {
  switch (type) {
    case 'feature':
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">新功能</Badge>;
    case 'fix':
      return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">修复</Badge>;
    case 'improvement':
      return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">优化</Badge>;
  }
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background pb-safe md:pb-0">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-serif text-3xl font-bold mb-2">更新日志</h1>
            <p className="text-muted-foreground">了解7班Wiki的最新更新与改进</p>
          </div>

          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4 pr-4">
              {changelog.map((entry, index) => (
                <Card key={index} className="wiki-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {getTypeIcon(entry.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            v{entry.version}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{entry.date}</p>
                        </div>
                      </div>
                      {getTypeBadge(entry.type)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {entry.changes.map((change, changeIndex) => (
                        <li key={changeIndex} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
