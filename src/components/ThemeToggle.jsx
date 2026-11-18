import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function synchronize() {
      let saved;
      try { saved = localStorage.getItem('nac-theme'); } catch { /* Armazenamento indisponível. */ }
      const next = saved === 'dark' || saved === 'light' ? saved : media.matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      setTheme(next);
    }
    media.addEventListener('change', synchronize);
    window.addEventListener('storage', synchronize);
    return () => {
      media.removeEventListener('change', synchronize);
      window.removeEventListener('storage', synchronize);
    };
  }, []);
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem('nac-theme', next); } catch { /* Mantém a escolha nesta página. */ }
  }
  const label = theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
  return <button className="iconbtn theme-toggle" type="button" onClick={toggle} aria-label={label} title={label}>
    {theme === 'dark' ? <Sun size={21} aria-hidden="true" /> : <Moon size={21} aria-hidden="true" />}
  </button>;
}
