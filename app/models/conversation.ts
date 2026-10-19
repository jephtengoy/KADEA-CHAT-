import { ConversationSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Message from '#models/message'
import ConversationMember from '#models/conversation_member'

export default class Conversation extends ConversationSchema {
  get isGroup() {
    return this.type === 'group'
  }

  @belongsTo(() => User, {
    foreignKey: 'userOneId',
  })
  declare userOne: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'userTwoId',
  })
  declare userTwo: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  @hasMany(() => ConversationMember)
  declare members: HasMany<typeof ConversationMember>
}
