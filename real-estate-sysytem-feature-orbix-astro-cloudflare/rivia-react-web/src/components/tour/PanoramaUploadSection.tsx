import { useRef } from 'react';
import { PanoramaSceneUploader } from './PanoramaSceneUploader';
import type { PanoramaPayloadScene } from '../../services/tourService';

type PanoramaUploadSectionProps = {
  scenes: PanoramaPayloadScene[];
  onChange: (scenes: PanoramaPayloadScene[]) => void;
};

const defaultRoomNames = ['المدخل', 'الصالون', 'غرفة النوم', 'المطبخ', 'الحمام', 'الشرفة'];

function makeScene(file: File, index: number): PanoramaPayloadScene {
  const name = defaultRoomNames[index] || `مشهد ${index + 1}`;
  return {
    id: `local-${Date.now()}-${index}`,
    file,
    previewUrl: URL.createObjectURL(file),
    name,
    roomName: name,
    roomLabel: name,
    order: index + 1,
    buttons: [],
    hotspots: [],
  };
}

export function PanoramaUploadSection({ scenes, onChange }: PanoramaUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    onChange([...scenes, ...files.map((file, fileIndex) => makeScene(file, scenes.length + fileIndex))]);
  };

  const updateScene = (index: number, scene: PanoramaPayloadScene) => {
    onChange(scenes.map((item, itemIndex) => (itemIndex === index ? scene : item)));
  };

  const removeScene = (index: number) => {
    onChange(scenes.filter((_, itemIndex) => itemIndex !== index).map((scene, itemIndex) => ({ ...scene, order: itemIndex + 1 })));
  };

  const moveScene = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= scenes.length) return;
    const nextScenes = [...scenes];
    const [scene] = nextScenes.splice(index, 1);
    nextScenes.splice(nextIndex, 0, scene);
    onChange(nextScenes.map((item, itemIndex) => ({ ...item, order: itemIndex + 1 })));
  };

  return (
    <section className="card form-section panorama-upload-section">
      <div className="form-section-heading">
        <h2>الجولة الافتراضية / صور 360</h2>
        <p>أضف صور بانورامية لكل غرفة أو مساحة</p>
      </div>

      <button type="button" className="panorama-upload-tile" onClick={() => inputRef.current?.click()}>
        <span className="panorama-upload-plus">+</span>
        <span>إضافة صورة بانورامية</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="visually-hidden-input"
        onChange={(event) => {
          addFiles(Array.from(event.target.files || []));
          event.target.value = '';
        }}
      />

      {scenes.length > 0 ? (
        <div className="panorama-scenes-list">
          {scenes.map((scene, index) => (
            <PanoramaSceneUploader
              key={scene.id || scene.previewUrl || scene.url || index}
              scene={scene}
              index={index}
              total={scenes.length}
              onChange={(nextScene) => updateScene(index, nextScene)}
              onRemove={() => removeScene(index)}
              onMove={(direction) => moveScene(index, direction)}
            />
          ))}
        </div>
      ) : (
        <p className="muted panorama-empty-note">لا توجد صور بانورامية مضافة بعد.</p>
      )}
    </section>
  );
}
