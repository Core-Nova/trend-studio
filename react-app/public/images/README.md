# Image Folders

This directory contains folders for each slider on the website.

## Folder Structure

- `hero-left/` - Images for the left hero sidebar slider
- `hero-right/` - Images for the right hero sidebar slider  
- `gallery/` - Images for the gallery section (4 sliders with staggered cycling)

## How to Add Images

1. Add your images to the appropriate folder:
   - For hero sidebars: Place images in `hero-left/` or `hero-right/`
   - For gallery: Place images in `gallery/`

2. **Important**: After adding images, you must update `data/images.json` to include the paths to your new images.

3. Edit `data/images.json` and add the image paths in the format:
   ```json
   {
     "hero_left": [
       "images/hero-left/your-image-1.jpg",
       "images/hero-left/your-image-2.jpg"
     ],
     "hero_right": [
       "images/hero-right/your-image-1.jpg"
     ],
     "gallery": [
       "images/gallery/your-image-1.jpg",
       "images/gallery/your-image-2.jpg"
     ]
   }
   ```

## Image Recommendations

- **Format**: JPG, PNG, or WebP
- **Hero Sidebars**: 600x900px (portrait orientation)
- **Gallery**: 600x900px (portrait orientation)
- **File size**: Optimize images for web (under 500KB recommended)

## Note

Images are loaded from the paths specified in `data/images.json`. Simply adding files to folders is not enough - you must update the JSON file for them to appear.
