import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/index.css'
import { applyThemeColors } from './theme/colors.ts'
import { applyTheme, loadTheme } from './theme/theme.ts'
import { SettingsProvider } from './settings/SettingsContext.tsx'
import App from './App.tsx'

applyThemeColors()
applyTheme(loadTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
)
