/**
 * Single source of truth for the salon's contact, booking, and social
 * endpoints. Import `SITE` instead of hardcoding these anywhere.
 */
export const SITE = {
  phoneDisplay: '0888 599 590',
  phoneHref: 'tel:+359888599590',
  viberUrl: 'viber://chat?number=%2B359888599590',
  // Apps Script Web App /exec URL — the booking + analytics backend. The
  // browser calls it directly, so it is public anyway; the hardcoded default
  // keeps CI/preview builds working without a build-time secret. Override with
  // VITE_BACKEND_URL (e.g. to point at a staging deployment).
  backendUrl:
    import.meta.env.VITE_BACKEND_URL ||
    'https://script.google.com/macros/s/AKfycbzxrXX3GSNbjWG7us6_8IlFHi2GB0x4t5rrC3S7DFt3Yx2q-F6BsRSaUhyiX4R9ldtF/exec',
  studio24Url: 'https://studio24.bg/hair-boutique-studio-trend-s4258',
  instagramUrl: 'https://instagram.com/trendbytedi',
  instagramHandle: 'trendbytedi',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=TREND+Hair+Boutique+Studio,+Tsar+Kaloyan+8,+Sofia,+Bulgaria&output=embed',
  // Canonical Google Maps listing by place CID — resolves to the exact place.
  // Used for every click-through "view on Google Maps" / reviews link.
  mapsUrl: 'https://maps.google.com/?cid=7087341119169206594',
}
