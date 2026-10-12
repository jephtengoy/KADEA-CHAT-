import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import EmailVerificationToken from '#models/email_verification_token'
import User from '#models/user'
import VerifyEmailNotification from '#mails/verify_email_notification'
import mail from '@adonisjs/mail/services/main'

export default class EmailVerificationsController {
  async verify({ params, response, view }: HttpContext) {
    const verificationToken = await EmailVerificationToken
      .query()
      .where('token', params.token)
      .preload('user')
      .first()

    if (!verificationToken) {
      return response.badRequest('Lien de confirmation invalide.')
    }

    if (verificationToken.expiresAt < DateTime.now()) {
      await verificationToken.delete()
      return response.badRequest('Ce lien de confirmation a expiré.')
    }

    const user = verificationToken.user

    user.emailVerifiedAt = DateTime.now()
    await user.save()

    await verificationToken.delete()

    return view.render('pages/auth/email_verified')
  }

  async resend({ request, response }: HttpContext) {
    const email = request.input('email')

    const user = await User.findBy('email', email)

    if (!user) {
      return response.redirect().toRoute('session.create')
    }

    if (user.emailVerifiedAt) {
      return response.redirect().toRoute('session.create')
    }

    await EmailVerificationToken.query().where('userId', user.id).delete()

    const token = randomBytes(32).toString('hex')

    await EmailVerificationToken.create({
      userId: user.id,
      token,
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    const verificationUrl = `${request.protocol()}://${request.host()}/verify-email/${token}`

   await mail.send(new VerifyEmailNotification(user, verificationUrl))

    return response.redirect().toRoute('session.create')
  }
}