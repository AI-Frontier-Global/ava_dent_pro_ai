/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
        cairo: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      colors: {
        // ── Brand: Teal (Material 3 primary tonal palette) ──
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // ── Accent: Cyan (secondary tonal palette) ──
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // ── Semantic: Success ──
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // ── Semantic: Warning ──
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // ── Semantic: Error ──
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // ── Semantic: Info ──
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      // ── Material 3 Elevation System (5 levels) ──
      boxShadow: {
        // Level 1 — resting cards, subtle lift
        'elev-1': '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.05)',
        // Level 2 — raised cards, hover state
        'elev-2': '0 2px 4px -1px rgba(15, 23, 42, 0.06), 0 4px 6px -1px rgba(15, 23, 42, 0.08)',
        // Level 3 — floating elements, dropdowns
        'elev-3': '0 4px 8px -2px rgba(15, 23, 42, 0.08), 0 10px 20px -4px rgba(15, 23, 42, 0.10)',
        // Level 4 — modals, dialogs
        'elev-4': '0 8px 16px -4px rgba(15, 23, 42, 0.10), 0 20px 40px -8px rgba(15, 23, 42, 0.12)',
        // Level 5 — overlays, command palette
        'elev-5': '0 16px 32px -8px rgba(15, 23, 42, 0.14), 0 32px 64px -16px rgba(15, 23, 42, 0.16)',
        // Brand-tinted glow
        'brand-glow': '0 0 24px -4px rgba(20, 184, 166, 0.25)',
        'brand-glow-lg': '0 0 48px -8px rgba(20, 184, 166, 0.30)',
      },
      // ── Motion: Material 3 + Fluent easing ──
      transitionTimingFunction: {
        // Material 3 standard easing
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        // Material 3 emphasized easing (entrance)
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
        // Material 3 decelerated easing (exit)
        decelerate: 'cubic-bezier(0, 0, 0, 1)',
        // Fluent 2 subtle ease
        fluent: 'cubic-bezier(0.33, 0, 0.1, 1)',
      },
      transitionDuration: {
        // M3 small component motion
        'xs': '100ms',
        'sm': '150ms',
        // M3 medium component motion
        'md': '250ms',
        // M3 large container motion
        'lg': '300ms',
        'xl': '500ms',
      },
      // ── Border radius (M3 shape scale) ──
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        'full': '9999px',
      },
      // ── Typography scale (M3 type scale) ──
      fontSize: {
        'label': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'body': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'title': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }],
        'title-lg': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'headline': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'headline-lg': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'display': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
      },
      // ── Spacing (8px base grid, M3 density) ──
      spacing: {
        '0.5': '2px',
        '1.5': '6px',
        '2.5': '10px',
        '3.5': '14px',
        '4.5': '18px',
        '5.5': '22px',
        '7': '28px',
        '9': '36px',
        '11': '44px',
        '13': '52px',
        '15': '60px',
        '18': '72px',
      },
      // ── Z-index scale ──
      zIndex: {
        'base': '0',
        'content': '10',
        'sticky': '20',
        'nav': '30',
        'overlay': '40',
        'modal': '50',
        'toast': '60',
      },
    },
  },
  plugins: [],
};
