import { Link } from 'react-router-dom';
import type { Property } from '../../types/models';
import { formatNumber, getLocationLabel, getPropertyPrice, imageFromList } from '../../lib/formatters';
import { isPropertyFeatured } from '../../services/propertyService';
import { extractTourImages } from '../../services/tourService';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { propertyPath } from '../../lib/seo';

type PropertyCardProps = {
  property: Property;
  isFavorite?: boolean;
  onToggleFavorite?: (propertyId: string) => void | Promise<void>;
};

export function PropertyCard({ property, isFavorite = false, onToggleFavorite }: PropertyCardProps) {
  const title = property.title || property.name || 'عقار بدون عنوان';
  const image = imageFromList(property.mainImage || property.imageUrl, property.images);
  const price = getPropertyPrice(property) || 'السعر غير محدد';
  const location = getLocationLabel(property) || 'الموقع غير محدد';
  const city = property.city || property.location?.city || 'الموقع غير محدد';
  const type = property.category || property.property_category_title || property.propertyType || property.property_type || property.type;
  const hasTour = extractTourImages(property.panorama_tour || property.panoramaTour || property.panoramaTours).length > 0;
  const featured = isPropertyFeatured(property);
  const path = propertyPath(property);

  return (
    <Card className="property-card">
      <div className="card-media-wrap">
        <Link to={path} className="card-media" aria-label={title}>
          {image ? <img src={image} alt={`${title} — ${location}`} loading="lazy" decoding="async" width="800" height="600" /> : <div className="image-placeholder">Orbix</div>}
        </Link>
        <button
          type="button"
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={() => onToggleFavorite?.(property.id)}
          aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
        {(property.status || featured || hasTour) && (
          <div className="media-badges">
            {property.status && <StatusBadge status={property.status} />}
            {featured && <StatusBadge status="إعلان مميز" tone="amber" />}
            {hasTour && <StatusBadge status="جولة 360" tone="purple" />}
          </div>
        )}
      </div>

      <div className="property-card-body">
        <div className="property-meta-row">
          {type && <span className="chip">{type}</span>}
          <span>{city}</span>
        </div>
        <Link to={path} className="property-title">
          {title}
        </Link>
        <p className="muted">{location}</p>
        <div className="property-price">{price}</div>
        <div className="property-stats">
          {property.bedrooms != null && <span>{formatNumber(property.bedrooms)} غرف</span>}
          {property.bathrooms != null && <span>{formatNumber(property.bathrooms)} حمامات</span>}
          {property.area != null && <span>{formatNumber(property.area)} م²</span>}
        </div>
      </div>
    </Card>
  );
}
