
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import mail from '@adonisjs/mail/services/main'
import hash from '@adonisjs/core/services/hash'
import vine from '@vinejs/vine'

const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string(),
    password: vine.string().minLength(8).maxLength(32).confirmed(),
  })
)

export default class PasswordResetsController {
  async create({ view }: HttpContext) {
    return view.render('pages/auth/forgot_password')
  }

  async store({ request, response, session }: HttpContext) {
    const email = request.input('email')

    if (typeof email !== 'string' || !email.trim()) {
      session.flash('error', 'Saisis une adresse e-mail valide.')
      return response.redirect().back()
    }

    const user = await User.findBy('email', email.trim().toLowerCase())

    if (!user || !user.emailVerifiedAt) {
      session.flash(
        'success',
        'Si un compte confirmé correspond à cette adresse, un lien sera envoyé.'
      )
      return response.redirect().back()
    }

    await PasswordResetToken.query().where('userId', user.id).delete()

    const token = randomBytes(32).toString('hex')

    await PasswordResetToken.create({
      userId: user.id,
      token,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const resetUrl = `${request.protocol()}://${request.host()}/reset-password/${token}`

    await mail.send((message) => {
      message
        .to(user.email)
        .subject('Réinitialisation du mot de passe — Kadea Chat')
        .html(`
          <h1>Réinitialiser ton mot de passe</h1>
          <p>Tu as demandé à modifier ton mot de passe Kadea Chat.</p>
          <p><a href="${resetUrl}">Choisir un nouveau mot de passe</a></p>
          <p>Ce lien expire dans une heure. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.</p>
        `)
    })

    session.flash(
      'success',
      'Si un compte confirmé correspond à cette adresse, un lien sera envoyé.'
    )

    return response.redirect().back()
  }

  async edit({ params, view, response }: HttpContext) {
    const resetToken = await PasswordResetToken.findBy('token', params.token)

    if (!resetToken || resetToken.expiresAt < DateTime.now()) {
      if (resetToken) {
        await resetToken.delete()
      }

      return response.badRequest(
        'Ce lien de réinitialisation est invalide ou expiré.'
      )
    }

    return view.render('pages/auth/reset_password', { token: params.token })
  }

  async update({ request, response, session }: HttpContext) {
    const { token, password } = await request.validateUsing(
      resetPasswordValidator
    )

    const resetToken = await PasswordResetToken.findBy('token', token)

    if (!resetToken || resetToken.expiresAt < DateTime.now()) {
      if (resetToken) {
        await resetToken.delete()
      }

      session.flash(
        'error',
        'Ce lien est invalide ou a expiré. Demande-en un nouveau.'
      )

      return response.redirect().toPath('/forgot-password')
    }

    const user = await User.findOrFail(resetToken.userId)

    user.password = await hash.make(password)
    await user.save()

    await PasswordResetToken.query().where('userId', user.id).delete()

    session.flash(
      'success',
      'Ton mot de passe a été modifié. Tu peux te connecter.'
    )

    return response.redirect().toRoute('session.create')
  }
}

