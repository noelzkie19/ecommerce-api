import { Router } from 'express'
import { requireAuth } from '../auth/auth.middleware'
import * as wishlistController from './wishlist.controller'

const router = Router()

router.use(requireAuth)

router.get('/',       wishlistController.getWishlist)
router.post('/',      wishlistController.addToWishlist)
router.delete('/:id', wishlistController.removeFromWishlist)

export default router