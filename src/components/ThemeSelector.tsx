import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, themeOptions, ThemeStyle } from '@/hooks/useTheme';

interface ThemeSelectorProps {
  theme: ThemeStyle;
  onThemeChange: (theme: ThemeStyle) => void;
}

export function ThemeSelector({ theme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Palette className="w-4 h-4" />
        <span>主题风格</span>
      </div>
      <div className="grid gap-3">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onThemeChange(option.value)}
            className={cn(
              "w-full p-4 rounded-xl border-2 text-left transition-all duration-300",
              "hover:scale-[1.02] active:scale-[0.98]",
              theme === option.value
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    getThemePreviewClass(option.value)
                  )}
                >
                  {getThemeIcon(option.value)}
                </div>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </div>
              {theme === option.value && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function getThemePreviewClass(theme: ThemeStyle): string {
  switch (theme) {
    case 'glassmorphism':
      return 'bg-gradient-to-br from-white/60 to-white/20 backdrop-blur border border-white/30';
    case 'aurora':
      return 'bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500';
    case 'minimal':
      return 'bg-foreground';
    case 'warm':
      return 'bg-gradient-to-br from-orange-400 to-amber-300';
    default:
      return 'bg-gradient-to-br from-primary to-accent';
  }
}

function getThemeIcon(theme: ThemeStyle): React.ReactNode {
  switch (theme) {
    case 'glassmorphism':
      return <span className="text-lg">🍎</span>;
    case 'aurora':
      return <span className="text-lg">🌌</span>;
    case 'minimal':
      return <span className="text-lg text-background">◯</span>;
    case 'warm':
      return <span className="text-lg">☀️</span>;
    default:
      return <span className="text-lg">📚</span>;
  }
}
