import heroLeft1 from '../assets/images/hero-left/1-story.jpg'
import heroLeft2 from '../assets/images/hero-left/2-story.jpg'
import heroLeft3 from '../assets/images/hero-left/evastoryedit3.jpg'
import heroLeft4 from '../assets/images/hero-left/girl1-story.jpg'

import heroRight1 from '../assets/images/hero-right/1-diana.jpg'
import heroRight2 from '../assets/images/hero-right/1-story.jpg'
import heroRight3 from '../assets/images/hero-right/5-story.jpg'
import heroRight4 from '../assets/images/hero-right/danielastory.jpg'

import gallery1 from '../assets/images/gallery/1-post.jpg'
import gallery2 from '../assets/images/gallery/3-post.jpg'
import gallery3 from '../assets/images/gallery/BS5A9854editmogi.jpg'
import gallery4 from '../assets/images/gallery/evapostedit3.jpg'

export const imageData = {
  hero_left: [heroLeft1, heroLeft2, heroLeft3, heroLeft4],
  hero_right: [heroRight1, heroRight2, heroRight3, heroRight4],
  gallery: [gallery1, gallery2, gallery3, gallery4]
}

export const allImages = [...imageData.hero_left, ...imageData.hero_right, ...imageData.gallery]

export const STORY_GROUPS = [
  { label: 'Hair', thumbnail: imageData.hero_left[0], startIndex: 0 },
  { label: 'Style', thumbnail: imageData.hero_right[0], startIndex: 4 },
  { label: 'Gallery', thumbnail: imageData.gallery[0], startIndex: 8 },
]
