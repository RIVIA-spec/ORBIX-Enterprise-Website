import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import type { PanoramaPayloadScene } from '../../services/tourService';

type PanoramaSceneUploaderProps = {
  scene: PanoramaPayloadScene;
  index: number;
  total: number;
  onChange: (scene: PanoramaPayloadScene) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
};

const roomSuggestions = ['المدخل', 'الصالون', 'غرفة النوم', 'المطبخ', 'الحمام', 'الشرفة'];

export function PanoramaSceneUploader({ scene, index, total, onChange, onRemove, onMove }: PanoramaSceneUploaderProps) {
  const preview = scene.previewUrl || scene.url || scene.path || scene.image || '';
  const label = scene.roomLabel || scene.roomName || scene.name || '';

  const updateLabel = (value: string) => {
    onChange({
      ...scene,
      name: value,
      roomName: value,
      roomLabel: value,
    });
  };

  return (
    <article className="panorama-scene-card">
      <div className="panorama-scene-preview">
        {preview ? <img src={preview} alt={label || `مشهد ${index + 1}`} /> : <span>360</span>}
      </div>

      <div className="panorama-scene-fields">
        <Input
          label="اسم الغرفة أو المشهد"
          value={label}
          onChange={(event) => updateLabel(event.target.value)}
          placeholder={roomSuggestions[index] || 'مثال: الصالون'}
        />
        <Input
          label="الترتيب"
          value={String(scene.order ?? index + 1)}
          onChange={(event) => onChange({ ...scene, order: Number(event.target.value) || index + 1 })}
        />
        <TextArea
          label="وصف اختياري"
          value={scene.description || ''}
          onChange={(event) => onChange({ ...scene, description: event.target.value })}
          placeholder="تفاصيل قصيرة عن هذه المساحة"
        />
      </div>

      <div className="panorama-scene-actions">
        <button type="button" className="btn btn-ghost" onClick={() => onMove(-1)} disabled={index === 0}>
          أعلى
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onMove(1)} disabled={index === total - 1}>
          أسفل
        </button>
        <button type="button" className="btn btn-danger" onClick={onRemove}>
          حذف
        </button>
      </div>
    </article>
  );
}
