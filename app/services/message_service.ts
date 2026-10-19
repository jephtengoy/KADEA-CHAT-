import { mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import transmit from '@adonisjs/transmit/services/main'
import Conversation from '#models/conversation'
import Message from '#models/message'
import User from '#models/user'
import ConversationService from '#services/conversation_service'

export type MessageType = 'text' | 'image' | 'file' | 'audio'

export type SerializedMessage = {
  id: number
  body: string | null
  type: MessageType
  senderId: number
  conversationId: number
  createdAt: string
  readAt: string | null
  mine: boolean
  senderName: string
  attachmentUrl: string | null
  attachmentName: string | null
  attachmentMime: string | null
  attachmentSize: number | null
}

export default class MessageService {
  #conversations = new ConversationService()

  previewText(message: Pick<Message, 'type' | 'body' | 'attachmentName'>) {
    if (message.type === 'image') return '📷 Photo'
    if (message.type === 'audio') return '🎤 Message vocal'
    if (message.type === 'file') return `📎 ${message.attachmentName || 'Fichier'}`
    return message.body || ''
  }

  serialize(message: Message, currentUserId: number): SerializedMessage {
    return {
      id: message.id,
      body: message.body,
      type: message.type as MessageType,
      senderId: message.senderId,
      conversationId: message.conversationId,
      createdAt: message.createdAt.toISO()!,
      readAt: message.readAt?.toISO() ?? null,
      mine: message.senderId === currentUserId,
      senderName: message.sender?.fullName || message.sender?.email || 'Utilisateur',
      attachmentUrl: message.attachmentPath
        ? `/attachments/${message.id}`
        : null,
      attachmentName: message.attachmentName,
      attachmentMime: message.attachmentMime,
      attachmentSize: message.attachmentSize,
    }
  }

  async listForConversation(conversationId: number, currentUserId: number, limit = 100) {
    const messages = await Message.query()
      .where('conversationId', conversationId)
      .preload('sender')
      .orderBy('createdAt', 'asc')
      .limit(limit)

    return messages.map((message) => this.serialize(message, currentUserId))
  }

  detectType(file: MultipartFile): MessageType {
    const mime = file.headers['content-type'] || ''
    const name = (file.clientName || '').toLowerCase()

    if (file.type === 'image' || mime.startsWith('image/')) return 'image'

    const isAudio =
      file.type === 'audio' ||
      mime.startsWith('audio/') ||
      mime.includes('webm') ||
      mime.includes('ogg') ||
      name.endsWith('.webm') ||
      name.endsWith('.ogg') ||
      name.endsWith('.mp3') ||
      name.endsWith('.wav') ||
      name.endsWith('.m4a')

    if (isAudio) return 'audio'
    return 'file'
  }

  async storeAttachment(file: MultipartFile) {
    const folder = app.makePath('storage/uploads/messages')
    await mkdir(folder, { recursive: true })

    const extension = extname(file.clientName || '') || ''
    const fileName = `${Date.now()}-${randomBytes(8).toString('hex')}${extension}`
    await file.move(folder, { name: fileName, overwrite: true })

    return {
      path: join('storage/uploads/messages', fileName).replaceAll('\\', '/'),
      name: file.clientName || fileName,
      mime: file.headers['content-type'] || 'application/octet-stream',
      size: file.size,
    }
  }

  async send(
    conversation: Conversation,
    sender: User,
    options: {
      body?: string | null
      file?: MultipartFile | null
    }
  ) {
    let type: MessageType = 'text'
    let attachment: Awaited<ReturnType<MessageService['storeAttachment']>> | null = null
    const body = options.body?.trim() || null

    if (options.file && options.file.isValid) {
      type = this.detectType(options.file)
      attachment = await this.storeAttachment(options.file)
    }

    if (!body && !attachment) {
      throw new Error('Message vide.')
    }

    const message = await Message.create({
      conversationId: conversation.id,
      senderId: sender.id,
      type,
      body,
      attachmentPath: attachment?.path ?? null,
      attachmentName: attachment?.name ?? null,
      attachmentMime: attachment?.mime ?? null,
      attachmentSize: attachment?.size ?? null,
    })

    await message.load('sender')

    conversation.updatedAt = DateTime.now()
    await conversation.save()

    const serialized = this.serialize(message, sender.id)
    const memberIds = await this.#conversations.memberIds(conversation.id)
    const preview = this.previewText(message)

    transmit.broadcast(`conversations/${conversation.id}`, {
      type: 'message.created',
      message: serialized,
    })

    for (const memberId of memberIds) {
      transmit.broadcast(`users/${memberId}/inbox`, {
        type: 'inbox.updated',
        conversationId: conversation.id,
        preview,
        message: this.serialize(message, memberId),
      })
    }

    return serialized
  }

  async markRead(conversationId: number, readerId: number) {
    await Message.query()
      .where('conversationId', conversationId)
      .whereNot('senderId', readerId)
      .whereNull('readAt')
      .update({ readAt: DateTime.now().toSQL({ includeOffset: false }) })

    transmit.broadcast(`conversations/${conversationId}`, {
      type: 'messages.read',
      readerId,
    })
  }

  broadcastTyping(conversationId: number, user: User, typing: boolean) {
    transmit.broadcast(`conversations/${conversationId}`, {
      type: 'typing',
      userId: user.id,
      userName: user.fullName || user.email,
      typing,
    })
  }
}
