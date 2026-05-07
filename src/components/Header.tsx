'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { useAppContext } from '@/context/AppContext'
import type { Theme } from '@/lib/types'

export default function Header() {
  const { theme, setTheme } = useTheme()
  const { dispatch, thoughts } = useAppContext()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  return (
    <header ref={headerRef} className="app-header">
      <div className="logo">Huuu</div>
      <button
        className="menu-btn"
        onClick={() => setIsMenuOpen(prev => !prev)}
        aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
        aria-expanded={isMenuOpen}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7"/>
        </svg>
      </button>
      {isMenuOpen && (
        <div className="header-menu" role="menu">
          {/* Theme switcher */}
          <div className="menu-section">
            <p className="menu-label">主题</p>
            <div className="theme-options">
              {(['dark', 'light', 'system'] as Theme[]).map(t => (
                <button
                  key={t}
                  className={`theme-btn ${theme === t ? 'active' : ''}`}
                  onClick={() => setTheme(t)}
                  role="menuitemradio"
                  aria-checked={theme === t}
                >
                  {t === 'dark' ? '深色' : t === 'light' ? '浅色' : '系统'}
                </button>
              ))}
            </div>
          </div>
          {/* Clear all */}
          <button
            className="menu-item menu-item-danger"
            role="menuitem"
            onClick={() => {
              if (thoughts.length > 0 && window.confirm('确定要清除所有想法吗？')) {
                dispatch({ type: 'CLEAR' })
                setIsMenuOpen(false)
              }
            }}
          >
            清除所有想法
          </button>
        </div>
      )}
    </header>
  )
}
