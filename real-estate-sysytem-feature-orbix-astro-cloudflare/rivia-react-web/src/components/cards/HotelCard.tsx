import { Link } from 'react-router-dom';
import type { Hotel } from '../../types/models';
import { getHotelImage, getHotelLocationLabel, getHotelPrice, getHotelTitle } from '../../services/hotelService';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { hotelPath } from '../../lib/seo';

type HotelCardProps = {
  hotel: Hotel;
};

export function HotelCard({ hotel }: HotelCardProps) {
  const image = getHotelImage(hotel);
  const location = getHotelLocationLabel(hotel);
  const title = getHotelTitle(hotel);
  const price = getHotelPrice(hotel, hotel.room_types || []);
  const rating = hotel.stars || hotel.rating;
  const roomTypesCount = hotel.room_types?.length || 0;
  const countryCity = [hotel.city, hotel.country || hotel.countryCode].filter(Boolean).join('، ');
  const content = (
    <>
      <div className="card-media">
        {image ? <img src={image} alt={`${title} — ${location}`} loading="lazy" decoding="async" width="800" height="600" /> : <div className="image-placeholder">لا توجد صورة</div>}
        <span className="hotel-type-badge">فندق</span>
        {(hotel.status || hotel.isFeatured || hotel.featured || hotel.isDistinct) && (
          <div className="media-badges">
            {hotel.status && <StatusBadge status={hotel.status} />}
            {(hotel.isFeatured || hotel.featured || hotel.isDistinct) && <StatusBadge status="مميز" tone="success" />}
          </div>
        )}
      </div>
      <div className="hotel-card-body">
        <div className="property-meta-row">
          {rating ? <span className="chip">{rating} نجوم</span> : <span />}
          {countryCity && <span>{countryCity}</span>}
        </div>
        <h3>{title}</h3>
        {location && <p className="muted">{location}</p>}
        {hotel.description && <p className="line-clamp">{hotel.description}</p>}
        <div className="property-price">{price || 'السعر غير محدد'}</div>
        {roomTypesCount > 0 && <div className="property-stats"><span>{roomTypesCount} أنواع غرف</span></div>}
        <span className="hotel-card-cta">عرض التفاصيل</span>
      </div>
    </>
  );

  if (!hotel.id) {
    return <Card className="hotel-card">{content}</Card>;
  }

  return (
    <Card className="hotel-card">
      <Link to={hotelPath(hotel)} className="hotel-card-link" aria-label={title}>
        {content}
      </Link>
    </Card>
  );
}
