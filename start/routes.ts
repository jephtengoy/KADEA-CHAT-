/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import PasswordResetsController from '#controllers/password_resets_controller'
import EmailVerificationsController from '#controllers/email_verifications_controller'
router.on('/').render('pages/home').as('home')

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.on('/dashboard').render('pages/dashboard').as('dashboard')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())
  router
  .get('/verify-email/:token', [EmailVerificationsController, 'verify'])
  .as('email_verifications.verify')

router
  .post('/resend-verification', [EmailVerificationsController, 'resend'])
  .as('email_verifications.resend')

  router
  .get('/forgot-password', [PasswordResetsController, 'create'])
  .as('password_resets.create')

router
  .post('/forgot-password', [PasswordResetsController, 'store'])
  .as('password_resets.store')