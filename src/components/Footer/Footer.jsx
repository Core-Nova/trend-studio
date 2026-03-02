import { useFooter } from '../../hooks/useFooter'
import { FooterView } from './FooterView'

export const Footer = () => {
  const data = useFooter()
  return <FooterView {...data} />
}
