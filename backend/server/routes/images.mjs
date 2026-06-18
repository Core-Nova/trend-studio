import { Router } from 'express'
import { getImageVariant, streamImage } from '../services/imageService.mjs'

export const imagesRouter = Router()

/**
 * @openapi
 * /images/{category}/{filename}:
 *   get:
 *     summary: Serve a salon image, optionally resized
 *     description: >
 *       Serves images from src/assets/images with long-lived cache headers.
 *       Pass ?w= to resize (allowed widths: 320, 480, 640, 768, 1080, 1440, 1920)
 *       and ?fmt= to transcode (webp, jpeg, avif). Resized variants are cached on disk.
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hero-left, hero-right, gallery]
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: w
 *         schema:
 *           type: integer
 *         description: Target width in pixels
 *       - in: query
 *         name: fmt
 *         schema:
 *           type: string
 *           enum: [webp, jpeg, avif]
 *         description: Output format (defaults to webp when resizing)
 *     responses:
 *       200:
 *         description: Image file
 *       304:
 *         description: Not modified (ETag match)
 *       400:
 *         description: Invalid category, extension, width, or format
 *       404:
 *         description: Image not found
 */
imagesRouter.get('/:category/:filename', async (req, res, next) => {
  try {
    const width = req.query.w ? parseInt(req.query.w, 10) : undefined
    const format = req.query.fmt
    const variant = await getImageVariant(req.params.category, req.params.filename, { width, format })
    streamImage(res, req, variant)
  } catch (err) {
    next(err)
  }
})
