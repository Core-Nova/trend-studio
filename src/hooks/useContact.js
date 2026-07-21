import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'
import { SITE } from '../lib/constants'

export const useContact = () => {
  const { t } = useLanguage()

  return {
    sectionTag: t(translations.contact.sectionTag),
    title: t(translations.contact.title),
    addressLabel: t(translations.contact.address),
    addressLines: t(translations.contact.addressText).split('\n'),
    phoneLabel: t(translations.contact.phone),
    phone: SITE.phoneDisplay,
    phoneHref: SITE.phoneHref,
    viberUrl: SITE.viberUrl,
    viberText: t(translations.contact.viber),
    emailLabel: t(translations.contact.email),
    email: 'trendstudiotedi@gmail.com',
    emailHref: 'mailto:trendstudiotedi@gmail.com',
    hoursLabel: t(translations.contact.hours),
    hoursLines: t(translations.contact.hoursText).split('\n'),
    bookOnlineBtn: translations.contact.bookOnlineBtn,
    studio24Text: t(translations.contact.bookBtn),
    studio24Url: SITE.studio24Url,
    mapLink: t(translations.contact.mapLink),
    mapEmbedUrl: SITE.mapsEmbedUrl,
    mapSearchUrl: SITE.mapsSearchUrl
  }
}
