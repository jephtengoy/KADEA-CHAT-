import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)

    if (!user.emailVerifiedAt) {
      session.flash(
        'error',
        'Tu dois confirmer ton adresse e-mail (lien reçu sur Gmail) avant de te connecter.'
      )

      return response.redirect().toRoute('session.create')
    }

    await auth.use('web').login(user)

    return response.redirect().toRoute('chats.index')
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('session.create')
  }
}
