import type { TourScene } from '../../types/models';

type TourThumbnailRailProps = {
  scenes: TourScene[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
};

export function TourThumbnailRail({ scenes, currentIndex, onSelectIndex }: TourThumbnailRailProps) {
  if (scenes.length <= 1) return null;

  return (
    <div className="tour-thumbnail-rail">
      {scenes.map((scene, index) => {
        const image = scene.url || scene.path || scene.image || scene.imageUrl || scene.panoramaUrl || '';
        return (
          <button
            key={`${scene.id || scene.name || scene.title || 'scene'}-${index}`}
            type="button"
            className={index === currentIndex ? 'active' : ''}
            onClick={() => onSelectIndex(index)}
            aria-label={scene.name || scene.title || `المشهد ${index + 1}`}
          >
            {image ? <img src={image} alt={scene.name || scene.title || ''} /> : <span>{index + 1}</span>}
            <span>{scene.roomLabel || scene.roomName || scene.name || scene.title || `مشهد ${index + 1}`}</span>
          </button>
        );
      })}
    </div>
  );
}
