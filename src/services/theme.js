/**
 * Monager Appearance & Theme Management Service
 * Controls Theme (Dark, Light, System), Accent Colors, Typography, Density, and Accessibility.
 */

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system'
};

export const ACCENT_COLORS = {
  emerald: { name: 'Emerald', hex: '#10b981', hoverHex: '#34d399', class: 'text-emerald-400', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-500/30' },
  blue: { name: 'Ocean Blue', hex: '#3b82f6', hoverHex: '#60a5fa', class: 'text-blue-400', bgClass: 'bg-blue-500', borderClass: 'border-blue-500/30' },
  violet: { name: 'Royal Violet', hex: '#8b5cf6', hoverHex: '#a78bfa', class: 'text-purple-400', bgClass: 'bg-purple-500', borderClass: 'border-purple-500/30' },
  amber: { name: 'Solar Amber', hex: '#f59e0b', hoverHex: '#fbbf24', class: 'text-amber-400', bgClass: 'bg-amber-500', borderClass: 'border-amber-500/30' },
  rose: { name: 'Crimson Rose', hex: '#f43f5e', hoverHex: '#fb7185', class: 'text-rose-400', bgClass: 'bg-rose-500', borderClass: 'border-rose-500/30' },
  cyan: { name: 'Cyber Cyan', hex: '#06b6d4', hoverHex: '#22d3ee', class: 'text-cyan-400', bgClass: 'bg-cyan-500', borderClass: 'border-cyan-500/30' }
};

export const FONTS = {
  sans: { id: 'sans', name: 'Modern Sans', family: "'Inter', system-ui, -apple-system, sans-serif" },
  mono: { id: 'mono', name: 'Developer Mono', family: "'JetBrains Mono', 'Fira Code', monospace" },
  system: { id: 'system', name: 'Clean System', family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
};

export const DENSITIES = {
  compact: { id: 'compact', name: 'Compact', scale: '0.92', spacing: 'tight' },
  comfortable: { id: 'comfortable', name: 'Comfortable', scale: '1.0', spacing: 'normal' },
  spacious: { id: 'spacious', name: 'Spacious', scale: '1.08', spacing: 'relaxed' }
};

class ThemeService {
  constructor() {
    this.mediaQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (this.mediaQuery) {
      this.mediaQuery.addEventListener('change', () => {
        this.applyFromCurrentState();
      });
    }
  }

  apply(profile = {}) {
    const root = document.documentElement;
    const body = document.body;
    if (!root || !body) return;

    // 1. Theme (Dark / Light / System)
    const themePref = profile.theme || THEMES.DARK;
    let effectiveTheme = themePref;
    if (themePref === THEMES.SYSTEM) {
      effectiveTheme = this.mediaQuery && this.mediaQuery.matches ? THEMES.DARK : THEMES.LIGHT;
    }

    if (effectiveTheme === THEMES.LIGHT) {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }

    // 2. Accent Color
    const accent = profile.accentTheme || 'emerald';
    const accentData = ACCENT_COLORS[accent] || ACCENT_COLORS.emerald;
    root.setAttribute('data-accent', accent);
    root.style.setProperty('--color-brand-primary', accentData.hex);
    root.style.setProperty('--color-brand-hover', accentData.hoverHex);

    // 3. Font Family
    const font = profile.fontFamily || 'sans';
    const fontData = FONTS[font] || FONTS.sans;
    root.setAttribute('data-font', font);
    body.style.fontFamily = fontData.family;

    // 4. Density
    const density = profile.density || 'comfortable';
    root.setAttribute('data-density', density);
    if (density === 'compact') {
      root.style.setProperty('--app-density-scale', '0.92');
      body.classList.add('density-compact');
      body.classList.remove('density-spacious');
    } else if (density === 'spacious') {
      root.style.setProperty('--app-density-scale', '1.08');
      body.classList.add('density-spacious');
      body.classList.remove('density-compact');
    } else {
      root.style.setProperty('--app-density-scale', '1.0');
      body.classList.remove('density-compact', 'density-spacious');
    }

    // 5. Reduced Motion
    if (profile.reducedMotion) {
      root.classList.add('reduced-motion');
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.classList.remove('reduced-motion');
      root.removeAttribute('data-reduced-motion');
    }

    // 6. High Contrast
    if (profile.highContrast) {
      root.classList.add('high-contrast');
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.classList.remove('high-contrast');
      root.removeAttribute('data-high-contrast');
    }
  }

  applyFromCurrentState() {
    try {
      const raw = localStorage.getItem('gapflow_v3_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        this.apply(parsed.profile || {});
      }
    } catch (e) {
      console.warn('Failed to apply theme from state:', e);
    }
  }
}

export const themeService = new ThemeService();
