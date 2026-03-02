import { memo } from 'react'

export const StoriesHighlights = memo(({ groups, onOpen }) => (
  <div className="stories-highlights">
    {groups.map((group, i) => (
      <button
        key={i}
        className="stories-highlight"
        onClick={() => onOpen(group.startIndex)}
      >
        <div className="stories-highlight__ring">
          <img
            src={group.thumbnail}
            alt={group.label}
            className="stories-highlight__img"
          />
        </div>
        <span className="stories-highlight__label">{group.label}</span>
      </button>
    ))}
  </div>
))
