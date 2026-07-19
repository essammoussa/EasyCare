import './RatingStars.css';

export default function RatingStars({ rating = 0, reviewsCount, size = 'md' }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const roundUp = rating - fullStars >= 0.75;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars + (roundUp ? 1 : 0)) {
      stars.push(<span key={i} className="rating-star filled">★</span>);
    } else if (i === fullStars + 1 && hasHalf) {
      stars.push(<span key={i} className="rating-star half">★</span>);
    } else {
      stars.push(<span key={i} className="rating-star">☆</span>);
    }
  }

  return (
    <div className={`rating-stars ${size}`}>
      <div className="rating-stars-icons">{stars}</div>
      <span className="rating-value">{rating.toFixed(1)}</span>
      {reviewsCount !== undefined && (
        <span className="rating-count">({reviewsCount} reviews)</span>
      )}
    </div>
  );
}
