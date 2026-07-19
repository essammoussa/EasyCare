import { useTheme } from '../context/ThemeContext';
import './ThemeToggleButton.css';

export default function ThemeToggleButton({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`.trim()}
      onClick={toggleTheme}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className="material-symbols-outlined theme-toggle-icon">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
      <span className="theme-toggle-label">
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </span>
    </button>
  );
}
