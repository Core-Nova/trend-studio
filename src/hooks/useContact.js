import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../translations'

export const useContact = () => {
  const { t } = useLanguage()

  return {
    sectionTag: t(translations.contact.sectionTag),
    title: t(translations.contact.title),
    addressLabel: t(translations.contact.address),
    addressLines: t(translations.contact.addressText).split('\n'),
    phoneLabel: t(translations.contact.phone),
    phone: '0888 599 590',
    phoneHref: 'tel:+359888599590',
    viberUrl: 'viber://chat?number=%2B359888599590',
    viberText: t(translations.contact.viber),
    emailLabel: t(translations.contact.email),
    email: 'hello@trendsalon.bg',
    emailHref: 'mailto:hello@trendsalon.bg',
    hoursLabel: t(translations.contact.hours),
    hoursLines: t(translations.contact.hoursText).split('\n'),
    bookBtn: t(translations.contact.bookBtn),
    bookUrl: 'https://studio24.bg/hair-boutique-studio-trend-s4258',
    mapLink: t(translations.contact.mapLink),
    mapEmbedUrl: 'https://www.google.com/maps?q=TREND+Hair+Boutique+Studio,+Tsar+Kaloyan+8,+Sofia,+Bulgaria&output=embed',
    mapSearchUrl: 'https://www.google.com/maps/search/TREND+Hair+Boutique+Studio+Tsar+Kaloyan+8+Sofia'
  }
}
