import { Link } from 'react-router-dom';
import { Calendar, User, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ArticleCardProps {
  id: string;
  title: string;
  content: string;
  coverImage?: string | null;
  authorName: string;
  createdAt: string;
  isPinned?: boolean;
}

export function ArticleCard({ id, title, content, coverImage, authorName, createdAt, isPinned }: ArticleCardProps) {
  // Extract text content from HTML
  const getExcerpt = (html: string, maxLength: number = 150) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Link to={`/article/${id}`} className="article-card block animate-fade-in">
      {coverImage && (
        <img
          src={coverImage}
          alt={title}
          className="article-card-image"
        />
      )}
      <div className="flex items-start gap-2 mb-1">
        {isPinned && (
          <Badge variant="secondary" className="gap-1 shrink-0">
            <Pin className="w-3 h-3" />
            置顶
          </Badge>
        )}
        <h3 className="article-card-title flex-1">{title}</h3>
      </div>
      <p className="article-card-excerpt">{getExcerpt(content)}</p>
      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {authorName}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(createdAt)}
        </span>
      </div>
    </Link>
  );
}
