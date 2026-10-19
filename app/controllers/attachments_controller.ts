import { createReadStream } from 'node:fs'
import { access } from 'node:fs/promises'
import { basename } from 'node:path'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import Message from '#models/message'
import ConversationService from '#services/conversation_service'

export default class AttachmentsController {
  #conversations = new ConversationService()

  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const message = await Message.find(Number(params.messageId))

    if (!message?.attachmentPath) {
      return response.notFound('Fichier introuvable.')
    }

    const allowed = await this.#conversations.ensureMember(
      message.conversationId,
      currentUser.id
    )

    if (!allowed) {
      return response.forbidden('Accès refusé.')
    }

    const absolutePath = app.makePath(message.attachmentPath)

    try {
      await access(absolutePath)
    } catch {
      return response.notFound('Fichier introuvable.')
    }

    response.header(
      'Content-Type',
      message.attachmentMime || 'application/octet-stream'
    )
    response.header(
      'Content-Disposition',
      `inline; filename="${basename(message.attachmentName || message.attachmentPath)}"`
    )

    return response.stream(createReadStream(absolutePath))
  }
}
