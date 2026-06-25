import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'

export const FAQ = () => {
  const { t } = useLanguage()
  const items = translations.faq.items

  return (
    <section className="faq" aria-labelledby="faq-title">
      <div className="faq__inner">
        <p className="section-tag">{t(translations.faq.sectionTag)}</p>
        <h2 id="faq-title" className="section-title">{t(translations.faq.title)}</h2>
        <div className="faq__list">
          {items.map((item, i) => (
            <details key={i} className="faq__item">
              <summary className="faq__question">{t(item.q)}</summary>
              <div className="faq__answer">{t(item.a)}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
