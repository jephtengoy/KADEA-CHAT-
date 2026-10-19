import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Conversation from '#models/conversation'
import Message from '#models/message'

/**
 * Le mixin withAuthFinder hash déjà le mot de passe (beforeSave).
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  get initials() {
    const [first, last] = this.fullName
      ? this.fullName.split(' ')
      : this.email.split('@')

    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }

    return `${first.slice(0, 2)}`.toUpperCase()
  }

  @hasMany(() => Conversation, {
    foreignKey: 'userOneId',
  })
  declare conversationsAsUserOne: HasMany<typeof Conversation>

  @hasMany(() => Conversation, {
    foreignKey: 'userTwoId',
  })
  declare conversationsAsUserTwo: HasMany<typeof Conversation>

  @hasMany(() => Message, {
    foreignKey: 'senderId',
  })
  declare sentMessages: HasMany<typeof Message>
}
