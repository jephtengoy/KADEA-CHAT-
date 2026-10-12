import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.dropTable('fix_email_verification_tokens')
  }

  async down() {
    this.schema.createTable('fix_email_verification_tokens', (table) => {
      table.increments('id').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }
}