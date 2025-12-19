import { useState } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SearchBoxProps {
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  className?: string;
  size?: 'default' | 'large';
}

export function SearchBox({ onSearch, isLoading = false, className = '', size = 'default' }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const inputClass = size === 'large' 
    ? 'search-input pr-24'
    : 'h-10 pl-10 pr-20';

  return (
    <form onSubmit={handleSearch} className={`search-container ${className}`}>
      <div className="relative">
        {size !== 'large' && (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <Input
          type="text"
          placeholder="输入关键词来检索文章..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={inputClass}
        />
        <Button
          type="submit"
          size={size === 'large' ? 'lg' : 'sm'}
          disabled={isLoading || !query.trim()}
          className={`absolute right-2 top-1/2 -translate-y-1/2 gap-2 ${
            size === 'large' ? 'px-6' : ''
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span className={size === 'large' ? '' : 'sr-only'}>AI搜索</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
