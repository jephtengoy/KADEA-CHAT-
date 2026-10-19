import type { HttpContext } from '@adonisjs/core/http'
import ConversationService from '#services/conversation_service'
import MessageService from '#services/message_service'
import { sendMessageValidator, typingValidator } from '#validators/message'

export default class MessagesController {
  #conversations = new ConversationService()
  #messages = new MessageService()

  async store({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const loaded = await this.#conversations.loadForUser(
      Number(params.conversationId),
      currentUser.id
    )

    if (!loaded) {
      return response.forbidden({ error: 'Conversation introuvable.' })
    }

    const payload = await request.validateUsing(sendMessageValidator)
    const file = request.file('attachment', {
      size: '15mb',
      extnames: [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'pdf',
        'doc',
        'docx',
        'txt',
        'zip',
        'mp3',
        'wav',
        'ogg',
        'webm',
        'm4a',
        'mp4',
      ],
    })

    if (file && !file.isValid) {
      return response.badRequest({ error: file.errors[0]?.message || 'Fichier invalide.' })
    }

    try {
      const message = await this.#messages.send(loaded.conversation, currentUser, {
        body: payload.body,
        file,
      })
      return response.ok({ message })
    } catch (error) {
      return response.badRequest({
        error: error instanceof Error ? error.message : 'Envoi impossible.',
      })
    }
  }

  async typing({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const { typing } = await request.validateUsing(typingValidator)

    const loaded = await this.#conversations.loadForUser(
      Number(params.conversationId),
      currentUser.id
    )

    if (!loaded) {
      return response.forbidden({ error: 'Conversation introuvable.' })
    }

    this.#messages.broadcastTyping(loaded.conversation.id, currentUser, typing)
    return response.noContent()
  }
}
