import { Link } from 'react-router-dom';
import { Calendar, User } from 'lucide-react';

interface ArticleCardProps {
  id: string;
  title: string;
  content: string;
  coverImage?: string | null;
  authorName: string;
  createdAt: string;
}

export function ArticleCard({ id, title, content, coverImage, authorName, createdAt }: ArticleCardProps) {
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
      <h3 className="article-card-title">{title}</h3>
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
