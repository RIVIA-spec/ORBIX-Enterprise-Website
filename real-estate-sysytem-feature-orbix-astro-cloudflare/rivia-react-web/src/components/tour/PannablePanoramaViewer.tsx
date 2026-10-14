import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '../ui/EmptyState';
import type { PropertyPanorama } from '../../types/models';
import { normalizeViewerTourScenes, type NormalizedTourScene } from '../../services/tourService';
import { TourThumbnailRail } from './TourThumbnailRail';

type PannablePanoramaViewerProps = {
  tour: PropertyPanorama | null;
};

type PannellumHotspot = {
  id?: string;
  type: 'scene' | 'info';
  pitch: number;
  yaw: number;
  text?: string;
  sceneId?: string;
};

type PannellumSceneConfig = {
  title?: string;
  type: 'equirectangular';
  panorama: string;
  hotSpots?: PannellumHotspot[];
};

type PannellumConfig = {
  default: {
    firstScene: string;
    sceneFadeDuration: number;
    autoLoad: boolean;
    showControls: boolean;
    keyboardZoom: boolean;
    mouseZoom: boolean;
    hfov: number;
    minHfov: number;
    maxHfov: number;
    compass: boolean;
    backgroundColor: [number, number, number];
    strings: Record<string, string>;
  };
  scenes: Record<string, PannellumSceneConfig>;
};

type PannellumViewer = {
  loadScene: (sceneId: string, pitch?: number | 'same', yaw?: number | 'same' | 'sameAzimuth', hfov?: number | 'same') => PannellumViewer;
  toggleFullscreen: () => PannellumViewer;
  resize: () => void;
  destroy: () => void;
  on: (event: string, handler: (...args: unknown[]) => void) => PannellumViewer;
};

type PannellumGlobal = {
  viewer: (container: HTMLElement | string, config: PannellumConfig) => PannellumViewer;
};

declare global {
  interface Window {
    pannellum?: PannellumGlobal;
  }
}

function sceneConfig(scene: NormalizedTourScene): PannellumSceneConfig {
  return {
    title: scene.title,
    type: 'equirectangular',
    panorama: scene.imageUrl,
    hotSpots: scene.hotspots.map((hotspot) => ({
      id: hotspot.id,
      type: hotspot.type,
      pitch: hotspot.pitch,
      yaw: hotspot.yaw,
      text: hotspot.text || hotspot.label || hotspot.title,
      sceneId: hotspot.type === 'scene' ? hotspot.targetSceneId : undefined,
    })),
  };
}

function buildConfig(scenes: NormalizedTourScene[]): PannellumConfig {
  return {
    default: {
      firstScene: scenes[0].id,
      sceneFadeDuration: 450,
      autoLoad: true,
      showControls: true,
      keyboardZoom: true,
      mouseZoom: true,
      hfov: 95,
      minHfov: 45,
      maxHfov: 110,
      compass: false,
      backgroundColor: [5, 7, 13],
      strings: {
        loadingLabel: 'جاري تحميل الجولة...',
        noPanoramaError: 'لا توجد صورة بانورامية لهذا المشهد.',
        fileAccessError: 'تعذر تحميل صورة الجولة.',
        malformedURLError: 'رابط صورة الجولة غير صالح.',
        iOS8WebGLError: 'المتصفح لا يدعم عرض الجولة ثلاثية الأبعاد.',
        genericWebGLError: 'تعذر تشغيل عارض الجولة على هذا الجهاز.',
      },
    },
    scenes: Object.fromEntries(scenes.map((scene) => [scene.id, sceneConfig(scene)])),
  };
}

function preloadImage(url?: string) {
  if (!url) return;
  const image = new Image();
  image.decoding = 'async';
  image.loading = 'eager';
  image.src = url;
}

export function PannablePanoramaViewer({ tour }: PannablePanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const scenes = useMemo(() => normalizeViewerTourScenes(tour), [tour]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentIndex(0);
  }, [tour]);

  useEffect(() => {
    let active = true;
    setError(null);
    setLoading(scenes.length > 0);

    viewerRef.current?.destroy();
    viewerRef.current = null;
    if (containerRef.current) containerRef.current.innerHTML = '';

    if (scenes.length === 0 || !containerRef.current) {
      setLoading(false);
      return undefined;
    }

    preloadImage(scenes[0].imageUrl);

    Promise.all([import('pannellum/build/pannellum.css'), import('pannellum')])
      .then(() => {
        if (!active || !containerRef.current) return;
        const pannellum = window.pannellum;
        if (!pannellum?.viewer) throw new Error('Pannellum viewer is unavailable.');
        const viewer = pannellum.viewer(containerRef.current, buildConfig(scenes));
        viewerRef.current = viewer;
        viewer.on('load', () => {
          if (active) setLoading(false);
        });
        viewer.on('scenechange', (sceneId) => {
          if (!active) return;
          const index = scenes.findIndex((scene) => scene.id === String(sceneId));
          if (index >= 0) setCurrentIndex(index);
          setLoading(true);
        });
        viewer.on('error', () => {
          if (active) {
            setLoading(false);
            setError('تعذر تحميل صورة الجولة. تحقق من رابط الصورة أو صلاحيات التخزين.');
          }
        });
        window.setTimeout(() => {
          if (active) {
            viewer.resize();
            setLoading(false);
          }
        }, 1200);
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          setError('تعذر تشغيل عارض Pannellum للجولة الافتراضية.');
        }
      });

    return () => {
      active = false;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [scenes]);

  const selectScene = (index: number) => {
    const scene = scenes[index];
    if (!scene) return;
    setCurrentIndex(index);
    setError(null);
    setLoading(true);
    preloadImage(scene.imageUrl);
    viewerRef.current?.loadScene(scene.id);
  };

  const moveScene = (direction: -1 | 1) => {
    if (scenes.length <= 1) return;
    selectScene((currentIndex + direction + scenes.length) % scenes.length);
  };

  if (scenes.length === 0) {
    return <EmptyState title="لا توجد جولة افتراضية لهذا العقار بعد." />;
  }

  return (
    <div className="virtual-tour-shell pannellum-tour-shell" dir="rtl">
      <div className="virtual-tour-stage immersive-tour-stage pannellum-tour-stage">
        <div ref={containerRef} className="virtual-tour-viewer pannellum-tour-viewer" />
        {loading && <div className="pannellum-tour-skeleton" aria-live="polite"><span>جاري تحميل الجولة...</span></div>}
        {error && <div className="pannellum-tour-error"><strong>الجولة غير متاحة</strong><span>{error}</span></div>}
        <div className="virtual-tour-overlay pannellum-tour-overlay">
          <span className="eyebrow">جولة 360</span>
          <h2>{scenes[currentIndex]?.title || `المشهد ${currentIndex + 1}`}</h2>
          <p>اسحب داخل المشهد أو استخدم نقاط الانتقال للتنقل بين الغرف.</p>
        </div>
        <div className="tour-scene-controls pannellum-tour-mobile-controls" aria-label="أزرار التحكم بالجولة">
          {scenes.length > 1 && <button type="button" onClick={() => moveScene(-1)} aria-label="المشهد السابق">‹</button>}
          <button type="button" onClick={() => viewerRef.current?.toggleFullscreen()} aria-label="ملء الشاشة">⛶</button>
          <span>{currentIndex + 1} / {scenes.length}</span>
          {scenes.length > 1 && <button type="button" onClick={() => moveScene(1)} aria-label="المشهد التالي">›</button>}
        </div>
      </div>
      <TourThumbnailRail
        scenes={scenes.map((scene) => ({
          id: scene.id,
          title: scene.title,
          name: scene.title,
          url: scene.thumbnailUrl || scene.imageUrl,
          image: scene.thumbnailUrl || scene.imageUrl,
        }))}
        currentIndex={currentIndex}
        onSelectIndex={selectScene}
      />
    </div>
  );
}
