import { useState, useMemo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../translations'
import { getBookableCategories, formatMinutes } from '../../lib/bookingUtils'

const OptionRow = ({ item, option, selected, onSelect }) => {
  const { t } = useLanguage()
  return (
    <button
      type="button"
      className={`bk-option ${selected ? 'bk-option--selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(item, option)}
    >
      <span className="bk-check" aria-hidden="true" />
      <span className="bk-option__name">{t(option.name)}</span>
      <span className="bk-option__meta">
        <span className="bk-option__duration">{option.duration}</span>
        <span className="bk-option__price">{option.priceEur.toFixed(2)} EUR</span>
      </span>
    </button>
  )
}

const ItemRow = ({ item, selection, toggleItem, selectOption }) => {
  const { t } = useLanguage()
  const b = translations.booking
  const hasOptions = Boolean(item.options)
  const selected = Boolean(selection)
  const [expanded, setExpanded] = useState(false)
  const open = hasOptions && (expanded || selected)

  return (
    <div className={`bk-item ${selected ? 'bk-item--selected' : ''}`}>
      <button
        type="button"
        className="bk-item__row"
        aria-pressed={hasOptions ? undefined : selected}
        aria-expanded={hasOptions ? open : undefined}
        onClick={hasOptions ? () => setExpanded((p) => !p) : () => toggleItem(item)}
      >
        {!hasOptions && <span className="bk-check" aria-hidden="true" />}
        <span className="bk-item__info">
          <span className="bk-item__name">{t(item.name)}</span>
          <span className="bk-item__duration">
            {selection && selection.option ? selection.option.duration : t(item.duration)}
          </span>
        </span>
        <span className="bk-item__trailing">
          <span className="bk-item__price">
            {item.priceNote && !selection?.option && (
              <span className="bk-item__note">{t(item.priceNote)} </span>
            )}
            {(selection?.option ? selection.option.priceEur : item.priceEur).toFixed(2)} EUR
          </span>
          {hasOptions && (
            <svg
              className={`bk-item__chevron ${open ? 'bk-item__chevron--open' : ''}`}
              width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </button>
      {open && (
        <div className="bk-item__options">
          <span className="bk-item__options-hint">{t(b.chooseOption)}</span>
          {item.options.map((option) => (
            <OptionRow
              key={option.key}
              item={item}
              option={option}
              selected={Boolean(selection && selection.option && selection.option.key === option.key)}
              onSelect={selectOption}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const ServicesStep = ({ flow }) => {
  const { t } = useLanguage()
  const b = translations.booking
  const categories = useMemo(() => getBookableCategories(), [])
  const { selections, selectionList, totals, toggleItem, selectOption, goToStep } = flow

  return (
    <div className="booking-step">
      <p className="booking-hint">{t(b.servicesHint)}</p>
      <div className="bk-categories">
        {categories.map((cat) => (
          <section key={cat.id} className="bk-category" aria-label={t(cat.name)}>
            <h3 className="bk-category__name">{t(cat.name)}</h3>
            {cat.items.map((item) => (
              <ItemRow
                key={item.key}
                item={item}
                selection={selections[item.key]}
                toggleItem={toggleItem}
                selectOption={selectOption}
              />
            ))}
          </section>
        ))}
      </div>
      <div className="booking-summary" aria-live="polite">
        <div className="booking-summary__totals">
          <span className="booking-summary__count">
            {t(b.total)}: {selectionList.length ? formatMinutes(totals.minutes, t(b.hourShort), t(b.minShort)) : '—'}
          </span>
          {selectionList.length > 0 && (
            <span className="booking-summary__price">{totals.priceEur.toFixed(2)} EUR</span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary booking-btn--fluid"
          disabled={!selectionList.length}
          onClick={() => goToStep('time')}
        >
          {t(b.continueBtn)}
        </button>
      </div>
    </div>
  )
}
