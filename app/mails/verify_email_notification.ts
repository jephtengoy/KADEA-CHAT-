import { BaseMail } from '@adonisjs/mail'
import type User from '#models/user'

export default class VerifyEmailNotification extends BaseMail {
constructor(
private user: User,
private verificationUrl: string
) {
super()
}

subject = 'Confirme ton adresse e-mail — Kadea Chat'

prepare() {
this.message
.to(this.user.email)
.htmlView('emails/verify_email', {
user: this.user,
verificationUrl: this.verificationUrl,
})
}
}
