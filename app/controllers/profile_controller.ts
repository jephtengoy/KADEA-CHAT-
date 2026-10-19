import { createReadStream } from 'node:fs'
import { access, mkdir } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import User from '#models/user'
import { profileValidator } from '#validators/user'

const avatarMimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export default class ProfileController {
  async edit({ auth, view }: HttpContext) {
    return view.render('pages/profile', {
      currentUser: auth.getUserOrFail(),
    })
  }

  async update({ auth, request, response, session }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    const { fullName } = await request.validateUsing(profileValidator)
    const avatar = request.file('avatar', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (avatar && !avatar.isValid) {
      session.flash('error', avatar.errors[0]?.message || 'Photo invalide.')
      return response.redirect().toRoute('profile.edit')
    }

    if (avatar) {
      const folder = app.makePath('storage/uploads/avatars')
      await mkdir(folder, { recursive: true })

      const extension = extname(avatar.clientName || '').toLowerCase()
      const fileName = `${currentUser.id}-${randomBytes(12).toString('hex')}${extension}`
      await avatar.move(folder, { name: fileName, overwrite: true })
      currentUser.avatar = fileName
    }

    currentUser.fullName = fullName || null
    await currentUser.save()

    session.flash('success', 'Profil mis à jour.')
    return response.redirect().toRoute('profile.edit')
  }

  async avatar({ params, response }: HttpContext) {
    const user = await User.find(Number(params.id))

    if (!user?.avatar) {
      return response.notFound('Photo de profil introuvable.')
    }

    const fileName = basename(user.avatar)
    const absolutePath = app.makePath('storage/uploads/avatars', fileName)

    try {
      await access(absolutePath)
    } catch {
      return response.notFound('Photo de profil introuvable.')
    }

    const mimeType = avatarMimeTypes[extname(fileName).toLowerCase()]
    if (!mimeType) {
      return response.notFound('Photo de profil introuvable.')
    }

    response.header('Content-Type', mimeType)
    response.header('Cache-Control', 'private, max-age=3600')
    return response.stream(createReadStream(absolutePath))
  }
}
