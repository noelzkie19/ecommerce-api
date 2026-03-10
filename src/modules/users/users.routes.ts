import { Router } from 'express'
import { requireAuth } from '../auth/auth.middleware'
import * as usersController from './users.controller'

const router = Router()

router.use(requireAuth)

router.get('/me',      usersController.getProfile)
router.patch('/me',    usersController.updateProfile)

export default router