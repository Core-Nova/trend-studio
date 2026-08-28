import { useAbout } from '../../hooks/useAbout'
import { AboutView } from './AboutView'

export const About = ({ showSeeAll = false, showProducts = false, as, title }) => {
  const data = useAbout()
  return <AboutView {...data} showSeeAll={showSeeAll} showProducts={showProducts} as={as} title={title} />
}
