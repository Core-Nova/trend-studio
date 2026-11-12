import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { localePath } from '../../lib/routes'

/**
 * Router <Link> that stays in the current language's URL space: pass a path
 * from PATHS ("/gallery/") and an English visitor is sent to "/en/gallery/".
 * Use it for every internal link — a plain <Link to={PATHS.x}> drops English
 * visitors back onto the Bulgarian URL.
 */
export const LangLink = ({ to, ...rest }) => {
  const { lang } = useLanguage()
  return <Link to={typeof to === 'string' ? localePath(to, lang) : to} {...rest} />
}
