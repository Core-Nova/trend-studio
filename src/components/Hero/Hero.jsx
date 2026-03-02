import { useHero } from '../../hooks/useHero'
import { HeroView } from './HeroView'

export const Hero = () => {
  const data = useHero()
  return <HeroView {...data} />
}
