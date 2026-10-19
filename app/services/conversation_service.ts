import { DateTime } from 'luxon'
import Conversation from '#models/conversation'
import ConversationMember from '#models/conversation_member'
import Message from '#models/message'
import User from '#models/user'

export type ConversationListItem = {
  id: number
  type: 'private' | 'group'
  title: string
  initials: string
  subtitle: string
  lastMessage: Message | null
  unreadCount: number
  updatedAt: DateTime
  peer: User | null
  memberCount: number
}

export default class ConversationService {
  orderedPair(userA: number, userB: number): [number, number] {
    return userA < userB ? [userA, userB] : [userB, userA]
  }

  async ensureMember(conversationId: number, userId: number) {
    const member = await ConversationMember.query()
      .where('conversationId', conversationId)
      .where('userId', userId)
      .first()

    return Boolean(member)
  }

  async memberIds(conversationId: number) {
    const members = await ConversationMember.query()
      .where('conversationId', conversationId)
      .select('userId')

    return members.map((member) => member.userId)
  }

  async findOrCreateBetween(userA: number, userB: number): Promise<Conversation> {
    if (userA === userB) {
      throw new Error('Impossible de créer une conversation avec soi-même.')
    }

    const [userOneId, userTwoId] = this.orderedPair(userA, userB)

    let conversation = await Conversation.query()
      .where('type', 'private')
      .where('userOneId', userOneId)
      .where('userTwoId', userTwoId)
      .first()

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'private',
        userOneId,
        userTwoId,
        createdBy: userA,
      })

      await ConversationMember.createMany([
        { conversationId: conversation.id, userId: userOneId, role: 'member' },
        { conversationId: conversation.id, userId: userTwoId, role: 'member' },
      ])
    }

    return conversation
  }

  async createGroup(creator: User, name: string, memberIds: number[]) {
    const uniqueIds = [...new Set(memberIds.map(Number).filter((id) => id && id !== creator.id))]

    if (uniqueIds.length < 1) {
      throw new Error('Ajoute au moins un membre au groupe.')
    }

    const conversation = await Conversation.create({
      type: 'group',
      name: name.trim(),
      createdBy: creator.id,
      userOneId: null,
      userTwoId: null,
    })

    await ConversationMember.create({
      conversationId: conversation.id,
      userId: creator.id,
      role: 'admin',
    })

    await ConversationMember.createMany(
      uniqueIds.map((userId) => ({
        conversationId: conversation.id,
        userId,
        role: 'member',
      }))
    )

    return conversation
  }

  peerOf(conversation: Conversation, userId: number): User | null {
    if (conversation.isGroup) return null
    return conversation.userOneId === userId ? conversation.userTwo : conversation.userOne
  }

  titleOf(conversation: Conversation, userId: number) {
    if (conversation.isGroup) {
      return conversation.name || 'Groupe'
    }

    const peer = this.peerOf(conversation, userId)
    return peer?.fullName || peer?.email || 'Discussion'
  }

  initialsOf(conversation: Conversation, userId: number) {
    if (conversation.isGroup) {
      const label = conversation.name || 'GR'
      return label.slice(0, 2).toUpperCase()
    }

    return this.peerOf(conversation, userId)?.initials || '??'
  }

  async listForUser(userId: number): Promise<ConversationListItem[]> {
    const memberships = await ConversationMember.query()
      .where('userId', userId)
      .select('conversationId')

    const conversationIds = memberships.map((m) => m.conversationId)
    if (conversationIds.length === 0) return []

    const conversations = await Conversation.query()
      .whereIn('id', conversationIds)
      .preload('userOne')
      .preload('userTwo')
      .preload('members', (query) => query.preload('user'))
      .orderBy('updatedAt', 'desc')

    const items: ConversationListItem[] = []

    for (const conversation of conversations) {
      const lastMessage = await Message.query()
        .where('conversationId', conversation.id)
        .orderBy('createdAt', 'desc')
        .first()

      const unreadRow = await Message.query()
        .where('conversationId', conversation.id)
        .whereNot('senderId', userId)
        .whereNull('readAt')
        .count('* as total')
        .first()

      const peer = this.peerOf(conversation, userId)
      const memberCount = conversation.members.length

      items.push({
        id: conversation.id,
        type: conversation.isGroup ? 'group' : 'private',
        title: this.titleOf(conversation, userId),
        initials: this.initialsOf(conversation, userId),
        subtitle: conversation.isGroup
          ? `${memberCount} membres`
          : peer?.email || '',
        lastMessage,
        unreadCount: Number(unreadRow?.$extras.total ?? 0),
        updatedAt: conversation.updatedAt,
        peer,
        memberCount,
      })
    }

    return items
  }

  async loadForUser(conversationId: number, userId: number) {
    if (!(await this.ensureMember(conversationId, userId))) {
      return null
    }

    const conversation = await Conversation.query()
      .where('id', conversationId)
      .preload('userOne')
      .preload('userTwo')
      .preload('members', (query) => query.preload('user'))
      .first()

    if (!conversation) return null

    return {
      conversation,
      peer: this.peerOf(conversation, userId),
      title: this.titleOf(conversation, userId),
      initials: this.initialsOf(conversation, userId),
      memberIds: conversation.members.map((member) => member.userId),
      members: conversation.members,
    }
  }
}
