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
    phone: '+359 2 987 6543',
    phoneHref: 'tel:+35929876543',
    emailLabel: t(translations.contact.email),
    email: 'hello@trendsalon.bg',
    emailHref: 'mailto:hello@trendsalon.bg',
    hoursLabel: t(translations.contact.hours),
    hoursLines: t(translations.contact.hoursText).split('\n'),
    bookBtn: t(translations.contact.bookBtn),
    bookUrl: 'https://studio24.bg',
    mapLink: t(translations.contact.mapLink),
    mapEmbedUrl: 'https://www.google.com/maps?q=TREND+Hair+Boutique+Studio,+Tsar+Kaloyan+8,+Sofia,+Bulgaria&output=embed',
    mapSearchUrl: 'https://www.google.com/maps/search/TREND+Hair+Boutique+Studio+Tsar+Kaloyan+8+Sofia'
  }
}
