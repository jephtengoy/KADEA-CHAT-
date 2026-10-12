import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import EmailVerificationToken from '#models/email_verification_token'
import VerifyEmailNotification from '#mails/verify_email_notification'
import mail from '@adonisjs/mail/services/main'
import { signupValidator } from '#validators/user'

export default class NewAccountController {
  async create({ view }: HttpContext) {
    return view.render('pages/auth/signup')
  }

  async store({ request, response, session }: HttpContext) {
    const { fullName, email, password } =
      await request.validateUsing(signupValidator)

    const user = await User.create({
      fullName,
      email,
      password,
    })

    const token = randomBytes(32).toString('hex')

    await EmailVerificationToken.create({
      userId: user.id,
      token,
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    const verificationUrl =
      `${request.protocol()}://${request.host()}/verify-email/${token}`

    await mail.send(
      new VerifyEmailNotification(user, verificationUrl)
    )

    session.flash(
      'success',
      'Compte créé ! Consulte ta boîte e-mail pour confirmer ton adresse avant de te connecter.'
    )

    return response.redirect().toRoute('session.create')
  }
}