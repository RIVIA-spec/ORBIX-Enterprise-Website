import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import type { Property } from '../../types/models';
import { formatNumber, getLocationLabel, getPropertyPrice, imageFromList } from '../../lib/formatters';
import { isPropertyFeatured } from '../../services/propertyService';
import { extractTourImages } from '../../services/tourService';

type MapPropertyCardProps = {
  property: Property | null;
  isFavorite?: boolean;
  onToggleFavorite?: (propertyId: string) => void | Promise<void>;
};

export function MapPropertyCard({ property, isFavorite = false, onToggleFavorite }: MapPropertyCardProps) {
  if (!property) {
    return (
      <Card className="map-property-card empty">
        <p className="muted">اختر عقارا على الخريطة لعرض التفاصيل.</p>
      </Card>
    );
  }

  const image = imageFromList(property.mainImage || property.imageUrl, property.images);
  const price = getPropertyPrice(property);
  const location = getLocationLabel(property);
  const type = property.category || property.property_category_title || property.propertyType || property.type || property.property_type;
  const hasTour = extractTourImages(property.panorama_tour || property.panoramaTour || property.panoramaTours).length > 0;
  const featured = isPropertyFeatured(property);

  return (
    <Card className="map-property-card">
      <div className="card-media-wrap">
        <Link to={`/properties/${property.id}`} className="card-media map-card-media" aria-label={property.title || 'تفاصيل العقار'}>
          {image ? <img src={image} alt={property.title || 'صورة العقار'} /> : <div className="image-placeholder">Orbix</div>}
        </Link>
        {(property.status || featured || hasTour) && (
          <div className="media-badges">
            {property.status && <StatusBadge status={property.status} />}
            {featured && <StatusBadge status="إعلان مميز" tone="amber" />}
            {hasTour && <StatusBadge status="جولة 360" tone="purple" />}
          </div>
        )}
      </div>

      <div className="map-property-card-body">
        <div className="property-meta-row">
          {type && <span className="chip">{type}</span>}
          {property.city && <span>{property.city}</span>}
        </div>
        <Link to={`/properties/${property.id}`} className="property-title">
          {property.title || property.name || 'عقار بدون عنوان'}
        </Link>
        {location && <p className="muted">{location}</p>}
        {price && <div className="property-price">{price}</div>}
        <div className="property-stats">
          {property.bedrooms != null && <span>{formatNumber(property.bedrooms)} غرف</span>}
          {property.bathrooms != null && <span>{formatNumber(property.bathrooms)} حمامات</span>}
          {property.area != null && <span>{formatNumber(property.area)} م²</span>}
        </div>
        <div className="map-card-actions">
          <Button as={Link} to={`/properties/${property.id}`} variant="outline">
            عرض التفاصيل
          </Button>
          {hasTour && (
            <Button as={Link} to={`/properties/${property.id}/tour`} variant="secondary">
              الجولة
            </Button>
          )}
          {onToggleFavorite && (
            <Button type="button" variant={isFavorite ? 'secondary' : 'ghost'} onClick={() => onToggleFavorite(property.id)}>
              {isFavorite ? 'إزالة من المفضلة' : 'المفضلة'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
