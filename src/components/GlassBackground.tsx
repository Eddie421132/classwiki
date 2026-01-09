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
      {/* Liquid gradient mesh background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(120, 180, 255, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(200, 160, 255, 0.35) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 60% 80%, rgba(100, 220, 255, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 10% 90%, rgba(180, 140, 255, 0.25) 0%, transparent 50%),
            linear-gradient(135deg, #e8f0ff 0%, #f0e8ff 25%, #e8faff 50%, #fff0f8 75%, #e8f4ff 100%)
          `,
        }}
      />
      
      {/* Liquid flowing orbs */}
      <div 
        className="absolute rounded-full"
        style={{
          width: '50vw',
          height: '50vw',
          maxWidth: '600px',
          maxHeight: '600px',
          background: 'radial-gradient(circle at 30% 30%, rgba(180, 220, 255, 0.6) 0%, rgba(140, 180, 255, 0.3) 40%, transparent 70%)',
          filter: 'blur(40px)',
          top: '-15%',
          left: '-10%',
          animation: 'liquid-flow-1 12s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />
      <div 
        className="absolute rounded-full"
        style={{
          width: '45vw',
          height: '45vw',
          maxWidth: '500px',
          maxHeight: '500px',
          background: 'radial-gradient(circle at 70% 40%, rgba(200, 170, 255, 0.5) 0%, rgba(170, 140, 255, 0.25) 40%, transparent 70%)',
          filter: 'blur(50px)',
          top: '20%',
          right: '-10%',
          animation: 'liquid-flow-2 15s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />
      <div 
        className="absolute rounded-full"
        style={{
          width: '40vw',
          height: '40vw',
          maxWidth: '450px',
          maxHeight: '450px',
          background: 'radial-gradient(circle at 50% 60%, rgba(140, 220, 255, 0.5) 0%, rgba(100, 200, 255, 0.2) 40%, transparent 70%)',
          filter: 'blur(45px)',
          bottom: '-10%',
          left: '20%',
          animation: 'liquid-flow-3 18s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />
      <div 
        className="absolute rounded-full"
        style={{
          width: '30vw',
          height: '30vw',
          maxWidth: '350px',
          maxHeight: '350px',
          background: 'radial-gradient(circle at 40% 50%, rgba(255, 180, 220, 0.4) 0%, rgba(255, 150, 200, 0.15) 40%, transparent 70%)',
          filter: 'blur(35px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'liquid-flow-4 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />

      {/* Subtle light refraction layer */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 100px,
              rgba(255, 255, 255, 0.03) 100px,
              rgba(255, 255, 255, 0.03) 200px
            )
          `,
        }}
      />

      <style>{`
        @keyframes liquid-flow-1 {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.7;
          }
          25% { 
            transform: translate(5vw, 3vh) scale(1.1) rotate(5deg);
            opacity: 0.8;
          }
          50% { 
            transform: translate(2vw, 6vh) scale(0.95) rotate(-3deg);
            opacity: 0.6;
          }
          75% { 
            transform: translate(-3vw, 2vh) scale(1.05) rotate(2deg);
            opacity: 0.75;
          }
        }
        @keyframes liquid-flow-2 {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.6;
          }
          33% { 
            transform: translate(-4vw, 4vh) scale(1.08) rotate(-4deg);
            opacity: 0.7;
          }
          66% { 
            transform: translate(3vw, -3vh) scale(0.92) rotate(3deg);
            opacity: 0.55;
          }
        }
        @keyframes liquid-flow-3 {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.65;
          }
          40% { 
            transform: translate(6vw, -2vh) scale(1.12) rotate(6deg);
            opacity: 0.75;
          }
          70% { 
            transform: translate(-2vw, 3vh) scale(0.9) rotate(-2deg);
            opacity: 0.55;
          }
        }
        @keyframes liquid-flow-4 {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 0.5;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
            opacity: 0.65;
          }
        }
      `}</style>
    </div>
  );
}
