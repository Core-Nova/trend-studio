import { useAbout } from '../../hooks/useAbout'
import { AboutView } from './AboutView'

export const About = ({ showSeeAll = false }) => {
  const data = useAbout()
  return <AboutView {...data} showSeeAll={showSeeAll} />
}
