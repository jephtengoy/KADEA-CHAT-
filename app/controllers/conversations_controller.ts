import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import ConversationService from '#services/conversation_service'
import MessageService from '#services/message_service'
import { createGroupValidator } from '#validators/message'

export default class ConversationsController {
  #conversations = new ConversationService()
  #messages = new MessageService()

  async index({ auth, view }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const [conversations, users] = await Promise.all([
      this.#conversations.listForUser(currentUser.id),
      User.query().whereNot('id', currentUser.id).orderBy('fullName', 'asc'),
    ])

    return view.render('pages/chats/index', {
      currentUser,
      conversations,
      users,
      activeConversation: null,
      peer: null,
      title: null,
      initials: null,
      members: [],
      messages: [],
    })
  }

  async show({ auth, params, response, view }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const loaded = await this.#conversations.loadForUser(Number(params.id), currentUser.id)

    if (!loaded) {
      return response.redirect().toRoute('chats.index')
    }

    const [conversations, users, messages] = await Promise.all([
      this.#conversations.listForUser(currentUser.id),
      User.query().whereNot('id', currentUser.id).orderBy('fullName', 'asc'),
      this.#messages.listForConversation(loaded.conversation.id, currentUser.id),
    ])

    await this.#messages.markRead(loaded.conversation.id, currentUser.id)

    return view.render('pages/chats/index', {
      currentUser,
      conversations,
      users,
      activeConversation: loaded.conversation,
      peer: loaded.peer,
      title: loaded.title,
      initials: loaded.initials,
      members: loaded.members,
      messages,
    })
  }

  async start({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const peerId = Number(params.userId)

    const peer = await User.find(peerId)
    if (!peer || peer.id === currentUser.id) {
      return response.redirect().toRoute('chats.index')
    }

    const conversation = await this.#conversations.findOrCreateBetween(
      currentUser.id,
      peer.id
    )

    return response.redirect().toRoute('chats.show', { id: conversation.id })
  }

  async createGroup({ auth, request, response, session }: HttpContext) {
    const currentUser = auth.getUserOrFail()

    const rawMembers = request.input('memberIds', [])
    const memberIds = (Array.isArray(rawMembers) ? rawMembers : rawMembers ? [rawMembers] : [])
      .map(Number)
      .filter((id) => Number.isFinite(id) && id > 0)

    try {
      const { name } = await request.validateUsing(createGroupValidator, {
        data: {
          name: request.input('name'),
          memberIds,
        },
      })
      const conversation = await this.#conversations.createGroup(
        currentUser,
        name,
        memberIds
      )
      return response.redirect().toRoute('chats.show', { id: conversation.id })
    } catch (error) {
      session.flash(
        'error',
        error instanceof Error ? error.message : 'Impossible de créer le groupe.'
      )
      return response.redirect().toRoute('chats.index')
    }
  }
}
