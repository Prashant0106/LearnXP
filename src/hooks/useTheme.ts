import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light'
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.setProperty('--bg', '#0D0D14')
      document.body.style.backgroundColor = '#030712'
      document.body.style.color = '#ffffff'
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = '#f8fafc'
      document.body.style.color = '#0f172a'
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark(prev => !prev)

  return { isDark, toggleTheme }
}