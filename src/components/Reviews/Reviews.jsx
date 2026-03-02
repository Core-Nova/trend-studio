import { useReviews } from '../../hooks/useReviews'
import { ReviewsView } from './ReviewsView'

export const Reviews = () => {
  const data = useReviews()
  return <ReviewsView {...data} />
}
