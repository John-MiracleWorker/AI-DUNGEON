import { Router } from 'express';
import { generateJWTToken, generateAnonymousToken } from '../middleware/auth';
import { HTTP_STATUS } from '../../../shared/constants';

const router = Router();

/**
 * @swagger
 * /api/auth/anonymous:
 *   post:
 *     summary: Create anonymous session
 *     tags: [Authentication]
 *     responses:
 *       201:
 *         description: Anonymous token created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     isAnonymous:
 *                       type: boolean
 */
router.post('/anonymous', (req, res) => {
  const anonymousId = generateAnonymousToken();
  const token = generateJWTToken(anonymousId, true);

  res.status(HTTP_STATUS.CREATED).json({
    token,
    user: {
      id: anonymousId,
      isAnonymous: true,
    },
  });
});

export default router;