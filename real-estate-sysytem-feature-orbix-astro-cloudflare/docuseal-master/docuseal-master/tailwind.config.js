module.exports = {
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        docuseal: {
          'color-scheme': 'light',
          primary: '#0f7cff',
          secondary: '#111827',
          accent: '#14b8a6',
          neutral: '#0b1220',
          'base-100': '#f6f8fb',
          'base-200': '#ffffff',
          'base-300': '#d8e0ea',
          'base-content': '#0b1220',
          '--rounded-btn': '1.9rem',
          '--tab-border': '2px',
          '--tab-radius': '.5rem'
        }
      }
    ]
  }
}
