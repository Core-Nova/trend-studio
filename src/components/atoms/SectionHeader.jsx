import { memo } from 'react'

export const SectionHeader = memo(({ tag, title }) => (
  <div className="section-header">
    <span className="section-tag">{tag}</span>
    <h2 className="section-title">{title}</h2>
    <div className="ornament"></div>
  </div>
))
