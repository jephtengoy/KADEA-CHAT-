import { Transmit } from '@adonisjs/transmit-client'

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

function xsrfHeaders() {
  const token = getCookie('XSRF-TOKEN')
  return token ? { 'X-XSRF-TOKEN': token } : {}
}

export function createChatApp() {
  return (config) => ({
    currentUserId: config.currentUserId,
    conversationId: config.conversationId,
    messages: config.initialMessages || [],
    sendUrl: config.sendUrl,
    typingUrl: config.typingUrl,
    draft: '',
    sending: false,
    query: '',
    statusLabel: 'connexion…',
    typingUsers: {},
    showGroupModal: false,
    recording: false,
    recordSeconds: 0,
    mediaRecorder: null,
    recordChunks: [],
    recordTimer: null,
    typingTimer: null,
    typingActive: false,
    transmit: null,
    conversationSub: null,
    inboxSub: null,

    get typingText() {
      const names = Object.values(this.typingUsers)
      if (!names.length) return ''
      if (names.length === 1) return `${names[0]} est en train d’écrire…`
      return 'Plusieurs personnes écrivent…'
    },

    get headerStatus() {
      return this.typingText || this.statusLabel
    },

    async init() {
      this.$nextTick(() => this.scrollToBottom())

      this.transmit = new Transmit({
        baseUrl: window.location.origin,
        beforeSubscribe(request) {
          const token = getCookie('XSRF-TOKEN')
          if (token) request.headers.set('X-XSRF-TOKEN', token)
        },
      })

      this.transmit.on('connected', () => {
        this.statusLabel = 'en ligne · temps réel'
      })
      this.transmit.on('disconnected', () => {
        this.statusLabel = 'hors ligne'
      })
      this.transmit.on('reconnecting', () => {
        this.statusLabel = 'reconnexion…'
      })

      this.inboxSub = this.transmit.subscription(`users/${this.currentUserId}/inbox`)
      await this.inboxSub.create()
      this.inboxSub.onMessage((payload) => this.onInbox(payload))

      if (this.conversationId) {
        this.conversationSub = this.transmit.subscription(
          `conversations/${this.conversationId}`
        )
        await this.conversationSub.create()
        this.conversationSub.onMessage((payload) => this.onConversation(payload))
      }
    },

    matchContact(name) {
      if (!this.query.trim()) return true
      return name.toLowerCase().includes(this.query.trim().toLowerCase())
    },

    formatTime(iso) {
      try {
        return new Intl.DateTimeFormat('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(iso))
      } catch {
        return ''
      }
    },

    formatSize(bytes) {
      if (!bytes) return ''
      if (bytes < 1024) return `${bytes} o`
      if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
      return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
    },

    scrollToBottom() {
      const el = this.$refs.scroller
      if (el) el.scrollTop = el.scrollHeight
    },

    onConversation(payload) {
      if (payload?.type === 'message.created' && payload.message) {
        const msg = {
          ...payload.message,
          mine: payload.message.senderId === this.currentUserId,
        }
        if (!this.messages.some((m) => m.id === msg.id)) {
          this.messages.push(msg)
          this.$nextTick(() => this.scrollToBottom())
        }
        if (payload.message.senderId !== this.currentUserId) {
          delete this.typingUsers[payload.message.senderId]
        }
      }

      if (payload?.type === 'typing' && payload.userId !== this.currentUserId) {
        if (payload.typing) {
          this.typingUsers[payload.userId] = payload.userName
        } else {
          delete this.typingUsers[payload.userId]
        }
        this.typingUsers = { ...this.typingUsers }
      }
    },

    onInbox(payload) {
      if (payload?.type !== 'inbox.updated' || !payload.message) return

      const preview = document.querySelector(
        `[data-preview-for="${payload.conversationId}"]`
      )
      if (preview) {
        preview.textContent =
          payload.preview || payload.message.body || 'Nouveau message'
      }

      const row = document.querySelector(
        `[data-conversation-id="${payload.conversationId}"]`
      )
      const list = row?.closest('.wa__list')
      const li = row?.closest('li')
      if (list && li) list.prepend(li)

      if (
        payload.conversationId !== this.conversationId &&
        payload.message.senderId !== this.currentUserId
      ) {
        let badge = document.querySelector(
          `[data-badge-for="${payload.conversationId}"]`
        )
        if (!badge && row) {
          badge = document.createElement('span')
          badge.className = 'wa__badge'
          badge.dataset.badgeFor = String(payload.conversationId)
          badge.textContent = '1'
          row.appendChild(badge)
        } else if (badge) {
          badge.textContent = String(Number(badge.textContent || '0') + 1)
        }
      }
    },

    async notifyTyping(typing) {
      if (!this.typingUrl) return
      if (this.typingActive === typing) return
      this.typingActive = typing
      try {
        await fetch(this.typingUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...xsrfHeaders(),
          },
          credentials: 'same-origin',
          body: JSON.stringify({ typing }),
        })
      } catch {
        // ignore network blips for typing
      }
    },

    onDraftInput() {
      this.notifyTyping(true)
      clearTimeout(this.typingTimer)
      this.typingTimer = setTimeout(() => this.notifyTyping(false), 1200)
    },

    async sendMessage() {
      const body = this.draft.trim()
      if (!body || !this.sendUrl || this.sending) return
      await this.uploadPayload({ body })
    },

    async onFileSelected(event) {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      await this.uploadPayload({
        body: this.draft.trim() || '',
        file,
      })
      this.draft = ''
    },

    async uploadPayload({ body = '', file = null }) {
      if (!this.sendUrl || this.sending) return
      if (!body && !file) return

      this.sending = true
      await this.notifyTyping(false)

      try {
        const form = new FormData()
        if (body) form.append('body', body)
        if (file) form.append('attachment', file)

        const response = await fetch(this.sendUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            ...xsrfHeaders(),
          },
          credentials: 'same-origin',
          body: form,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Envoi impossible')
        }

        const data = await response.json()
        if (data.message && !this.messages.some((m) => m.id === data.message.id)) {
          this.messages.push(data.message)
        }
        this.draft = ''
        this.$nextTick(() => this.scrollToBottom())
      } catch (error) {
        console.error(error)
        alert(error.message || "Impossible d'envoyer le message.")
      } finally {
        this.sending = false
      }
    },

    async toggleRecording() {
      if (this.recording) {
        this.stopRecording()
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'

        this.recordChunks = []
        this.mediaRecorder = new MediaRecorder(stream, { mimeType })
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) this.recordChunks.push(event.data)
        }
        this.mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop())
          clearInterval(this.recordTimer)
          const blob = new Blob(this.recordChunks, { type: mimeType })
          this.recordSeconds = 0
          if (blob.size < 500) return
          const file = new File([blob], `vocal-${Date.now()}.webm`, {
            type: mimeType,
          })
          await this.uploadPayload({ file })
        }

        this.mediaRecorder.start()
        this.recording = true
        this.recordSeconds = 0
        this.recordTimer = setInterval(() => {
          this.recordSeconds += 1
        }, 1000)
      } catch (error) {
        console.error(error)
        alert('Micro inaccessible. Autorise le micro dans le navigateur.')
      }
    },

    stopRecording() {
      if (!this.mediaRecorder || !this.recording) return
      this.recording = false
      this.mediaRecorder.stop()
      this.mediaRecorder = null
    },
  })
}
