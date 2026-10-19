import Alpine from 'alpinejs'
import { createChatApp } from './chat.js'

Alpine.data('alert', function () {
  return {
    isVisible: false,
    dismiss() {
      this.isVisible = false
    },
    init() {
      setTimeout(() => {
        this.isVisible = true
      }, 80)
      setTimeout(() => {
        this.dismiss()
      }, 5000)
    },
  }
})

Alpine.data('themeToggle', function () {
  return {
    theme: 'light',
    observer: null,
    init() {
      this.theme = this.$el.dataset.initialTheme || 'light'
      this.observer = new MutationObserver(() => {
        this.theme = document.documentElement.dataset.theme || 'light'
      })
      this.observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      })
    },
    toggle() {
      const next = this.theme === 'dark' ? 'light' : 'dark'
      this.theme = next
      document.documentElement.setAttribute('data-theme', next)
      document.cookie = `app_theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    },
    destroy() {
      this.observer?.disconnect()
    },
  }
})

Alpine.data('chatApp', createChatApp())

Alpine.start()
