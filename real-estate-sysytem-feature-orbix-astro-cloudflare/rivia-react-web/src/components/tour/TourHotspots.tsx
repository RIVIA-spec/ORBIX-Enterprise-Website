import type { TourHotspot, TourScene } from '../../types/models';

type TourHotspotsProps = {
  scene?: TourScene | null;
  hotspots: TourHotspot[];
  onSelectScene: (sceneId: string) => boolean;
};

export function getHotspotTargetId(hotspot: TourHotspot): string | null {
  const target = hotspot.target as (TourHotspot['target'] & Record<string, unknown>) | undefined;
  const value = hotspot.targetIndex
    ?? hotspot.targetSceneId
    ?? hotspot.target_scene_id
    ?? hotspot.targetScene
    ?? hotspot.target_scene
    ?? target?.sceneId
    ?? target?.targetSceneId
    ?? target?.target_scene_id
    ?? target?.targetScene
    ?? target?.target_scene;
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

function coordinateToPercent(value: number | string | undefined, range: number, invert = false) {
  if (value == null || value === '') return 50;
  const number = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(number)) return 50;
  const normalized = ((number + range / 2) / range) * 100;
  return Math.max(0, Math.min(100, invert ? 100 - normalized : normalized));
}

export function TourHotspots({ scene, hotspots, onSelectScene }: TourHotspotsProps) {
  if (!scene || hotspots.length === 0) return null;

  return (
    <div className="tour-hotspots">
      {hotspots.map((hotspot, index) => {
        const targetId = getHotspotTargetId(hotspot);
        if (!targetId) return null;
        const left = coordinateToPercent(hotspot.long ?? hotspot.yaw ?? hotspot.target?.long, 360);
        const top = coordinateToPercent(hotspot.lat ?? hotspot.pitch ?? hotspot.target?.lat, 180, true);
        return (
          <button
            key={`${targetId}-${index}`}
            type="button"
            className="tour-hotspot"
            style={{ left: `${left}%`, top: `${top}%` }}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              if (import.meta.env.DEV) console.info('[tour] hotspot clicked', { targetSceneId: targetId });
              onSelectScene(targetId);
            }}
            aria-label={hotspot.label || 'الانتقال إلى المشهد'}
            title={hotspot.label || 'الانتقال إلى المشهد'}
          >
            <span className="tour-hotspot-dot" />
            {hotspot.label && <span className="tour-hotspot-label">{hotspot.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
