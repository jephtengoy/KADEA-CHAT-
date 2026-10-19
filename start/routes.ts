/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'

const ConversationsController = () => import('#controllers/conversations_controller')
const MessagesController = () => import('#controllers/messages_controller')
const AttachmentsController = () => import('#controllers/attachments_controller')
const EmailVerificationsController = () => import('#controllers/email_verifications_controller')
const PasswordResetsController = () => import('#controllers/password_resets_controller')
const ProfileController = () => import('#controllers/profile_controller')

router.on('/').render('pages/home').as('home')

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create']).as('new_account.create')
    router.post('signup', [controllers.NewAccount, 'store']).as('new_account.store')
    router.get('login', [controllers.Session, 'create']).as('session.create')
    router.post('login', [controllers.Session, 'store']).as('session.store')
  })
  .use(middleware.guest())

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
router
  .get('/reset-password/:token', [PasswordResetsController, 'edit'])
  .as('password_resets.edit')
router
  .post('/reset-password', [PasswordResetsController, 'update'])
  .as('password_resets.update')

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy']).as('session.destroy')

    router.get('/profile', [ProfileController, 'edit']).as('profile.edit')
    router.post('/profile', [ProfileController, 'update']).as('profile.update')
    router.get('/users/:id/avatar', [ProfileController, 'avatar']).as('users.avatar')

    router.get('/chats', [ConversationsController, 'index']).as('chats.index')
    router.get('/chats/:id', [ConversationsController, 'show']).as('chats.show')
    router
      .post('/chats/with/:userId', [ConversationsController, 'start'])
      .as('chats.start')
    router
      .post('/chats/groups', [ConversationsController, 'createGroup'])
      .as('chats.groups.store')

    router
      .post('/chats/:conversationId/messages', [MessagesController, 'store'])
      .as('messages.store')
    router
      .post('/chats/:conversationId/typing', [MessagesController, 'typing'])
      .as('messages.typing')

    router
      .get('/attachments/:messageId', [AttachmentsController, 'show'])
      .as('attachments.show')

    router.get('/dashboard', async ({ response }) => response.redirect().toPath('/chats'))
    router.get('/messages', async ({ response }) => response.redirect().toPath('/chats'))
  })
  .use(middleware.auth())

transmit.registerRoutes((route) => {
  if (route.getPattern() === '__transmit/subscribe') {
    route.middleware(middleware.auth())
  }
})
