import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'email_verifications.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'email_verifications.resend': { paramsTuple?: []; params?: {} }
    'password_resets.create': { paramsTuple?: []; params?: {} }
    'password_resets.store': { paramsTuple?: []; params?: {} }
    'password_resets.edit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password_resets.update': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'profile.edit': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'users.avatar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'chats.index': { paramsTuple?: []; params?: {} }
    'chats.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'chats.start': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'chats.groups.store': { paramsTuple?: []; params?: {} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'conversationId': ParamValue} }
    'messages.typing': { paramsTuple: [ParamValue]; params: {'conversationId': ParamValue} }
    'attachments.show': { paramsTuple: [ParamValue]; params: {'messageId': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'email_verifications.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password_resets.create': { paramsTuple?: []; params?: {} }
    'password_resets.edit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'profile.edit': { paramsTuple?: []; params?: {} }
    'users.avatar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'chats.index': { paramsTuple?: []; params?: {} }
    'chats.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attachments.show': { paramsTuple: [ParamValue]; params: {'messageId': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'email_verifications.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password_resets.create': { paramsTuple?: []; params?: {} }
    'password_resets.edit': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'profile.edit': { paramsTuple?: []; params?: {} }
    'users.avatar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'chats.index': { paramsTuple?: []; params?: {} }
    'chats.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'attachments.show': { paramsTuple: [ParamValue]; params: {'messageId': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'email_verifications.resend': { paramsTuple?: []; params?: {} }
    'password_resets.store': { paramsTuple?: []; params?: {} }
    'password_resets.update': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'chats.start': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'chats.groups.store': { paramsTuple?: []; params?: {} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'conversationId': ParamValue} }
    'messages.typing': { paramsTuple: [ParamValue]; params: {'conversationId': ParamValue} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}