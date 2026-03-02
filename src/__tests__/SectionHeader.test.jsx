import { render, screen } from '@testing-library/react'
import { SectionHeader } from '../components/atoms/SectionHeader'

describe('SectionHeader', () => {
  it('renders tag and title', () => {
    render(<SectionHeader tag="Our Work" title="Gallery" />)
    expect(screen.getByText('Our Work')).toBeInTheDocument()
    expect(screen.getByText('Gallery')).toBeInTheDocument()
  })

  it('renders the ornament', () => {
    const { container } = render(<SectionHeader tag="Tag" title="Title" />)
    expect(container.querySelector('.ornament')).toBeInTheDocument()
  })
})
