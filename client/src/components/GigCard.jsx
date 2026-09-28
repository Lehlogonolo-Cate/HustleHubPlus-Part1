import { Link } from 'react-router';

import { capitalise, formatCurrency } from '../utils/format';

export default function GigCard({ gig }) {
  return (
    <article className="gig-card">
      <div className="gig-card__top">
        <span className={`category category--${gig.category}`}>{capitalise(gig.category)}</span>
        <span className="gig-card__days">{gig.deliveryDays}-day delivery</span>
      </div>
      <h3 className="gig-card__title">
        <Link to={`/gigs/${gig.id}`}>{gig.title}</Link>
      </h3>
      <p className="gig-card__description">{gig.description}</p>
      <div className="gig-card__footer">
        <span className="gig-card__seller">by {gig.freelancer?.name || 'Freelancer'}</span>
        <span className="gig-card__price">{formatCurrency(gig.price)}</span>
      </div>
    </article>
  );
}
