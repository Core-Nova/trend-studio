import { useContact } from '../../hooks/useContact'
import { ContactView } from './ContactView'

export const Contact = () => {
  const data = useContact()
  return <ContactView {...data} />
}
