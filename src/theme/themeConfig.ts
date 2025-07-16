// theme/themeConfig.ts
import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    // Brand colors
    colorPrimary: '#4f46e5', // Indigo
    colorSuccess: '#10b981', // Green
    colorWarning: '#f59e42', // Orange
    colorError: '#ef4444',   // Red

    // Typography
    fontFamily: 'Inter, Montserrat, Arial, sans-serif',

    // Border and radius
    borderRadius: 14,

    // Shadows
    boxShadow: '0 4px 32px 0 rgba(49, 0, 120, 0.07)',

    // Spacing, etc. (customize as you like)
  },
  components: {
    Button: {
      colorPrimary: '#6366f1',
      borderRadius: 14,
      fontWeight: 600,
      controlHeight: 44,
    },
    Card: {
      borderRadius: 18,
      boxShadow: '0 2px 24px 0 rgba(49, 0, 120, 0.07)'
    },
    Input: {
      borderRadius: 12,
      colorBorder: '#ddd',
      controlHeight: 44,
    },
    // ...add more per-component if you want
  },
};
export default theme;
