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

  it('defaults to h2 so home-page sections sit under the hero h1', () => {
    render(<SectionHeader tag="Tag" title="Services" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Services' })).toBeInTheDocument()
  })

  it('renders the level given by `as` — dedicated routes pass h1', () => {
    render(<SectionHeader tag="Tag" title="Services" as="h1" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Services' })).toBeInTheDocument()
  })

  it('keeps .section-title styling hooks at any level', () => {
    const { container } = render(<SectionHeader tag="Tag" title="Services" as="h1" />)
    expect(container.querySelector('h1.section-title')).toBeInTheDocument()
  })

  // The logo variant's accessible name is the image alt plus the sr-only line,
  // so /about reads as "TREND Hair Boutique Studio За нас" — brand then page.
  it('applies `as` to the logo variant too, keeping the sr-only name', () => {
    render(
      <SectionHeader tag="Tag" title="About us" as="h1" logo={{ webp: 'l.webp', alt: 'TREND' }} />
    )
    const heading = screen.getByRole('heading', { level: 1, name: 'TREND About us' })
    expect(heading).toHaveClass('section-title--logo')
  })
})
