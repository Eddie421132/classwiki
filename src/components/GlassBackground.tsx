import { useEffect, useState } from 'react';

export function GlassBackground() {
  const [isGlassTheme, setIsGlassTheme] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsGlassTheme(document.documentElement.classList.contains('theme-glassmorphism'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  if (!isGlassTheme) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Main gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(330 85% 60%) 0%, hsl(270 70% 55%) 25%, hsl(210 90% 55%) 50%, hsl(180 80% 50%) 75%, hsl(190 85% 55%) 100%)',
        }}
      />
      
      {/* Animated gradient orbs */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, hsl(330 90% 65% / 0.8) 0%, transparent 70%)',
          top: '-10%',
          left: '-10%',
          animation: 'float-orb-1 15s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute w-[500px] h-[500px] rounded-full opacity-50"
        style={{
          background: 'radial-gradient(circle, hsl(190 90% 60% / 0.8) 0%, transparent 70%)',
          bottom: '-5%',
          right: '-5%',
          animation: 'float-orb-2 18s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, hsl(270 80% 60% / 0.7) 0%, transparent 70%)',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'float-orb-3 20s ease-in-out infinite',
        }}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <style>{`
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, 50px) scale(1.1); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, -30px) scale(1.05); }
          66% { transform: translate(20px, -40px) scale(0.9); }
        }
        @keyframes float-orb-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }
      `}</style>
    </div>
  );
}
