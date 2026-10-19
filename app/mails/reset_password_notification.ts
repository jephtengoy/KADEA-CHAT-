import { BaseMail } from '@adonisjs/mail'
import type User from '#models/user'

export default class ResetPasswordNotification extends BaseMail {
  constructor(
    private user: User,
    private resetUrl: string
  ) {
    super()
  }

  subject = 'Réinitialisation du mot de passe — Kadea Chat'

  prepare() {
    this.message.to(this.user.email).htmlView('emails/reset_password', {
      user: this.user,
      resetUrl: this.resetUrl,
    })
  }
}
