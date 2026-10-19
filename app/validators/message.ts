import vine from '@vinejs/vine'

export const sendMessageValidator = vine.create({
  body: vine.string().trim().maxLength(4000).optional(),
})

export const typingValidator = vine.create({
  typing: vine.boolean(),
})

export const createGroupValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(120),
  memberIds: vine
    .array(vine.number().withoutDecimals())
    .minLength(1)
    .maxLength(50),
})
