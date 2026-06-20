'use client'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
      style={{
        backgroundColor: theme === 'dark' ? '#3b82f6' : '#e2e8f0'
      }}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-300 shadow-sm"
        style={{
          left: theme === 'dark' ? '26px' : '2px',
          backgroundColor: 'white',
        }}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </div>
    </button>
  )
}