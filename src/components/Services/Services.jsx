import { useServices } from '../../hooks/useServices'
import { ServicesView } from './ServicesView'

export const Services = ({ showSeeAll = false }) => {
  const data = useServices()
  return <ServicesView {...data} showSeeAll={showSeeAll} />
}
