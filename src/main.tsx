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

// Убираем прелоадер первичной загрузки после первого кадра отрисовки React.
const loader = document.getElementById('app-loader')
if (loader) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      loader.classList.add('is-hidden')
      loader.addEventListener('transitionend', () => loader.remove(), { once: true })
    }),
  )
}
