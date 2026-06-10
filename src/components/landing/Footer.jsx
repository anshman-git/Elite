import { Flame, Github, Twitter, Mail, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <footer className="relative border-t border-line-subtle bg-bg-inset/50 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-glow-amber">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-ink-100">
                Elite<span className="text-amber-500">Study</span>
              </span>
            </div>
            <p className="max-w-xs text-center text-sm text-ink-400 md:text-left">
              The gamified study platform that turns daily practice into lasting knowledge.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 md:gap-8" aria-label="Footer navigation">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-ink-400 transition-colors hover:text-amber-500"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a
              href="mailto:support@elitestudy.app"
              aria-label="Email support"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-bg-surface text-ink-400 transition-all hover:border-amber-500/30 hover:text-amber-500"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-bg-surface text-ink-400 transition-all hover:border-cyan-400/30 hover:text-cyan-400"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-bg-surface text-ink-400 transition-all hover:border-ink-100 hover:text-ink-100"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-line-subtle pt-8 md:flex-row md:justify-between">
          <p className="text-xs text-ink-600">
            &copy; {currentYear} EliteStudy. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-ink-600">
            Made with <Heart className="h-3 w-3 text-danger" /> for students everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
