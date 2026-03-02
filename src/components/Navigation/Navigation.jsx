import { useNavigation } from '../../hooks/useNavigation'
import { NavigationView } from './NavigationView'

export const Navigation = () => {
  const data = useNavigation()
  return <NavigationView {...data} />
}
