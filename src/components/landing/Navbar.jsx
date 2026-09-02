import { useState, useEffect } from 'react';
import { useApp } from '../../context/useApp';
import { Flame, Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onGetStarted }) {
  const { dark, toggleDark } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Gamification', href: '#gamification' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-bg-surface/80 dark:bg-bg-surface/70 backdrop-blur-md border-b border-line shadow-soft'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 outline-none group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-glow-amber transition-transform duration-300 group-hover:scale-110">
            <Flame className="h-6 w-6 text-white animate-pulse" />
          </div>
          <span className="font-display text-2xl font-bold text-ink-100 tracking-tight">
            Elite<span className="text-amber-500">Study</span>
          </span>
        </a>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Desktop navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-ink-200 hover:text-amber-500 transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleDark}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-bg-surface/50 text-ink-200 hover:border-amber-500/30 hover:text-amber-500 transition-all duration-200 shadow-soft"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            onClick={onGetStarted}
            className="btn-game px-5 py-2.5 text-sm"
            id="nav-cta-btn"
          >
            Start Learning Free
          </button>
        </div>

        {/* Mobile menu controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleDark}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-bg-surface/50 text-ink-200 hover:text-amber-500 transition-colors shadow-soft"
          >
            {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-bg-surface/50 text-ink-200 hover:text-amber-500 transition-colors shadow-soft"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-b border-line bg-bg-surface/95 dark:bg-bg-surface/90 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-bold text-ink-100 hover:text-amber-500 transition-colors py-2 border-b border-line-subtle"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStarted();
                }}
                className="btn-game justify-center py-3.5 mt-4 text-base w-full shadow-glow-amber"
              >
                Start Learning Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
