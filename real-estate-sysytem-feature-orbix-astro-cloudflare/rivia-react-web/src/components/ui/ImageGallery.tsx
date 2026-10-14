import { useMemo, useState } from 'react';
import { imageFromList } from '../../lib/formatters';

type ImageGalleryProps = {
  images: string[];
  title?: string;
};

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const normalized = useMemo(() => [...new Set(images.filter(Boolean))], [images]);
  const [selected, setSelected] = useState<string | null>(null);
  const active = selected || imageFromList(normalized);

  return (
    <div className="details-gallery advanced-gallery">
      <div className="details-main-image">
        {active ? <img src={active} alt={title || 'صورة العقار'} /> : <div className="image-placeholder">Orbix</div>}
      </div>
      {normalized.length > 1 && (
        <div className="thumbnail-row">
          {normalized.map((image) => (
            <button key={image} type="button" className={image === active ? 'active' : ''} onClick={() => setSelected(image)} aria-label="اختيار صورة">
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

