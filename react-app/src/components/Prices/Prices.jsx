import { usePrices } from '../../hooks/usePrices'
import { PricesView } from './PricesView'

export const Prices = () => {
  const data = usePrices()
  return <PricesView {...data} />
}
