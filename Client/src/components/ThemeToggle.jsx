import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ size = 'md', showLabel = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizes = {
    sm: { toggle: 'w-9 h-5', thumb: 'w-3 h-3', translate: 'translate-x-4', icon: 10 },
    md: { toggle: 'w-11 h-6', thumb: 'w-4 h-4', translate: 'translate-x-5', icon: 12 },
    lg: { toggle: 'w-14 h-7', thumb: 'w-5 h-5', translate: 'translate-x-7', icon: 14 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 group"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Track */}
      <span
        className={`
          relative inline-flex items-center rounded-full border transition-all duration-300
          ${s.toggle}
          ${isDark
            ? 'bg-[var(--bg-overlay)] border-[var(--border-default)]'
            : 'bg-amber-50 border-amber-200'
          }
        `}
      >
        {/* Thumb */}
        <span
          className={`
            absolute top-[2px] left-[2px] rounded-full flex items-center justify-center
            transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${s.thumb}
            ${isDark
              ? 'bg-[var(--accent)] translate-x-0 shadow-[0_0_8px_var(--accent)]'
              : `bg-amber-400 ${s.translate} shadow-[0_0_8px_rgba(251,191,36,0.5)]`
            }
          `}
        >
          {isDark
            ? <Moon size={s.icon - 2} className="text-black" />
            : <Sun  size={s.icon - 2} className="text-white" />
          }
        </span>
      </span>

      {showLabel && (
        <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}