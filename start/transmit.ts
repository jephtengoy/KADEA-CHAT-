import transmit from '@adonisjs/transmit/services/main'
import ConversationService from '#services/conversation_service'

const conversations = new ConversationService()

transmit.authorize<{ id: string }>('users/:id/inbox', (ctx, { id }) => {
  return ctx.auth.user?.id === Number(id)
})

transmit.authorize<{ id: string }>('conversations/:id', async (ctx, { id }) => {
  const user = ctx.auth.user
  if (!user) return false
  return conversations.ensureMember(Number(id), user.id)
})
