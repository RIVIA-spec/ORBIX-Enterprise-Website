import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { PanoramaScene, PropertyPanorama, TourHotspot, TourScene, TourHotspotTarget } from '../types/models';

type RecordLike = Record<string, unknown>;

function toText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    const text = toText(value);
    if (text?.trim()) return text.trim();
  }
  return undefined;
}

function normalizeFlatHotspot(item: RecordLike): TourHotspot {
  const nestedTarget = item.target && typeof item.target === 'object' ? item.target as RecordLike : {};
  const targetSceneId = firstText(
    item.targetSceneId,
    item.target_scene_id,
    item.targetScene,
    item.target_scene,
    item.nextSceneId,
    item.next_scene_id,
    nestedTarget.sceneId,
    nestedTarget.targetSceneId,
    nestedTarget.target_scene_id,
    nestedTarget.targetScene,
    nestedTarget.target_scene,
  );
  return {
    targetIndex: firstText(item.targetIndex, item.target_index),
    targetSceneId,
    target_scene_id: firstText(item.target_scene_id),
    targetScene: firstText(item.targetScene),
    target_scene: firstText(item.target_scene),
    label: firstText(item.label, item.title, item.name, nestedTarget.label),
    sceneId: firstText(item.sceneId),
    scene_id: firstText(item.scene_id),
    yaw: item.yaw != null ? (toNumber(item.yaw) ?? toText(item.yaw)) : undefined,
    pitch: item.pitch != null ? (toNumber(item.pitch) ?? toText(item.pitch)) : undefined,
    x: item.x != null ? (toNumber(item.x) ?? toText(item.x)) : item.left != null ? (toNumber(item.left) ?? toText(item.left)) : undefined,
    y: item.y != null ? (toNumber(item.y) ?? toText(item.y)) : item.top != null ? (toNumber(item.top) ?? toText(item.top)) : undefined,
    long: item.long != null ? (toNumber(item.long) ?? toText(item.long)) : item.yaw != null ? (toNumber(item.yaw) ?? toText(item.yaw)) : undefined,
    lat: item.lat != null ? (toNumber(item.lat) ?? toText(item.lat)) : item.pitch != null ? (toNumber(item.pitch) ?? toText(item.pitch)) : undefined,
    target: {
      label: firstText(nestedTarget.label, item.label),
      long: nestedTarget.long != null ? (toNumber(nestedTarget.long) ?? toText(nestedTarget.long)) : undefined,
      lat: nestedTarget.lat != null ? (toNumber(nestedTarget.lat) ?? toText(nestedTarget.lat)) : undefined,
      sceneId: firstText(nestedTarget.sceneId),
      targetSceneId: firstText(nestedTarget.targetSceneId),
      target_scene_id: firstText(nestedTarget.target_scene_id),
      targetScene: firstText(nestedTarget.targetScene),
      target_scene: firstText(nestedTarget.target_scene),
    },
  };
}

function normalizeHotspotEntry(entry: RecordLike): TourHotspot | null {
  const [targetIndex, target] = Object.entries(entry)[0] || [];
  if (!targetIndex || !target || typeof target !== 'object') return null;
  const hotspot = target as RecordLike;
  return {
    targetIndex,
    label: toText(hotspot.label),
    long: hotspot.long != null ? (toNumber(hotspot.long) ?? toText(hotspot.long)) : undefined,
    lat: hotspot.lat != null ? (toNumber(hotspot.lat) ?? toText(hotspot.lat)) : undefined,
    target: {
      label: toText(hotspot.label),
      long: hotspot.long != null ? (toNumber(hotspot.long) ?? toText(hotspot.long)) : undefined,
      lat: hotspot.lat != null ? (toNumber(hotspot.lat) ?? toText(hotspot.lat)) : undefined,
    } satisfies TourHotspotTarget,
  };
}

export function normalizeTourScene(scene: unknown): TourScene | null {
  if (typeof scene === 'string') {
    return { url: scene, path: scene, image: scene };
  }

  if (!scene || typeof scene !== 'object') return null;
  const data = scene as RecordLike;
  const buttons = Array.isArray(data.buttons)
    ? data.buttons
        .filter((item): item is RecordLike => Boolean(item) && typeof item === 'object')
        .map(normalizeHotspotEntry)
        .filter((item): item is TourHotspot => Boolean(item))
    : [];

  const hotspots = Array.isArray(data.hotspots)
    ? data.hotspots
        .filter((item): item is RecordLike => Boolean(item) && typeof item === 'object')
        .map(normalizeFlatHotspot)
    : [];

  return {
    id: firstText(data.id, data.sceneId, data.scene_id, data.index),
    name: toText(data.name) || toText(data.title) || toText(data.roomName) || toText(data.roomLabel),
    title: toText(data.title) || toText(data.name),
    roomName: toText(data.roomName),
    roomLabel: toText(data.roomLabel),
    description: toText(data.description),
    order: toNumber(data.order),
    path: firstText(data.path),
    url: firstText(data.url, data.imageUrl, data.panoramaUrl, data.panorama_url),
    image: firstText(data.image, data.imageUrl, data.panoramaUrl, data.panorama_url),
    imageUrl: firstText(data.imageUrl),
    panoramaUrl: firstText(data.panoramaUrl, data.panorama_url),
    isNetwork: typeof data.isNetwork === 'boolean' ? data.isNetwork : undefined,
    buttons: buttons.length > 0 ? buttons.map((item) => ({ [item.targetIndex || '0']: item.target || {} })) : undefined,
    hotspots: hotspots.length > 0 ? hotspots : undefined,
    nextSceneId: toText(data.nextSceneId),
    targetSceneId: toText(data.targetSceneId),
  };
}

export function extractTourScenes(tour?: PropertyPanorama | null): TourScene[] {
  if (!tour) return [];

  const rawScenes = [tour.scenes, tour.panoramas, tour.panorama_tours, tour.rooms]
    .find((items): items is TourScene[] => Array.isArray(items) && items.length > 0) || null;
  if (rawScenes) {
    return rawScenes.map(normalizeTourScene).filter((scene): scene is TourScene => Boolean(scene));
  }

  if (Array.isArray(tour.images) && tour.images.length > 0) {
    return tour.images
      .map((item) => normalizeTourScene(item))
      .filter((scene): scene is TourScene => Boolean(scene));
  }

  const fallbackImage = tour.mainImage || tour.imageUrls?.[0];
  return fallbackImage ? [{ url: fallbackImage, path: fallbackImage, image: fallbackImage, title: tour.title }] : [];
}

export function extractTourImages(tour?: PropertyPanorama | null): string[] {
  const images = new Set<string>();
  if (!tour) return [];

  if (tour.mainImage) images.add(tour.mainImage);
  for (const image of tour.imageUrls || []) {
    if (image) images.add(image);
  }

  if (Array.isArray(tour.images)) {
    for (const item of tour.images) {
      if (typeof item === 'string') {
        images.add(item);
      } else if (item && typeof item === 'object') {
        const scene = item as RecordLike;
        const candidate = firstText(scene.url, scene.path, scene.image, scene.imageUrl, scene.panoramaUrl);
        if (candidate) images.add(candidate);
      }
    }
  }

  for (const scene of extractTourScenes(tour)) {
    const candidate = scene.url || scene.path || scene.image || scene.imageUrl || scene.panoramaUrl;
    if (candidate) images.add(candidate);
  }

  return [...images];
}

export function extractTourHotspots(scene?: TourScene | null): TourHotspot[] {
  if (!scene) return [];

  const hotspots: TourHotspot[] = [];
  if (Array.isArray(scene.hotspots)) {
    hotspots.push(...scene.hotspots);
  }

  if (Array.isArray(scene.buttons)) {
    for (const entry of scene.buttons) {
      const parsed = Object.entries(entry || {}).map(([targetIndex, target]) => {
        const targetData = target && typeof target === 'object' ? (target as RecordLike) : {};
        return {
          targetIndex,
          label: toText(targetData.label),
          long: targetData.long != null ? (toNumber(targetData.long) ?? toText(targetData.long)) : undefined,
          lat: targetData.lat != null ? (toNumber(targetData.lat) ?? toText(targetData.lat)) : undefined,
          target: {
            label: toText(targetData.label),
            long: targetData.long != null ? (toNumber(targetData.long) ?? toText(targetData.long)) : undefined,
            lat: targetData.lat != null ? (toNumber(targetData.lat) ?? toText(targetData.lat)) : undefined,
          } satisfies TourHotspotTarget,
        } satisfies TourHotspot;
      });
      hotspots.push(...parsed);
    }
  }

  return hotspots;
}

export type NormalizedTourHotspot = {
  id: string;
  type: 'scene' | 'info';
  title?: string;
  label?: string;
  text?: string;
  yaw: number;
  pitch: number;
  targetSceneId?: string;
  targetIndex?: number;
};

export type NormalizedTourScene = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  hotspots: NormalizedTourHotspot[];
};

function hotspotTargetValue(hotspot: TourHotspot): string | undefined {
  const target = hotspot.target as (TourHotspotTarget & RecordLike) | undefined;
  return firstText(
    hotspot.targetIndex,
    hotspot.targetSceneId,
    hotspot.target_scene_id,
    hotspot.targetScene,
    hotspot.target_scene,
    hotspot.sceneId,
    hotspot.scene_id,
    target?.sceneId,
    target?.targetSceneId,
    target?.target_scene_id,
    target?.targetScene,
    target?.target_scene,
  );
}

function normalizedMarkerPosition(hotspot: TourHotspot): { yaw: number; pitch: number } | null {
  const yaw = toNumber(hotspot.yaw);
  const pitch = toNumber(hotspot.pitch);
  if (yaw != null && pitch != null) return { yaw, pitch };

  const longitude = toNumber(hotspot.long ?? hotspot.target?.long);
  const latitude = toNumber(hotspot.lat ?? hotspot.target?.lat);
  if (longitude != null && latitude != null) {
    return { yaw: longitude, pitch: latitude };
  }

  const x = toNumber(hotspot.x);
  const y = toNumber(hotspot.y);
  if (x != null && y != null) {
    return {
      yaw: ((x - 50) / 50) * 180,
      pitch: ((50 - y) / 50) * 90,
    };
  }

  return null;
}

export function normalizeViewerTourScenes(tour?: PropertyPanorama | null): NormalizedTourScene[] {
  const rawScenes = extractTourScenes(tour);
  const sceneEntries = rawScenes.map((scene, index) => {
    const imageUrl = firstText(scene.url, scene.path, scene.image, scene.imageUrl, scene.panoramaUrl);
    if (!imageUrl) return null;
    const title = firstText(scene.roomLabel, scene.roomName, scene.name, scene.title, scene.label) || `المشهد ${index + 1}`;
    const normalizedScene: NormalizedTourScene = {
      id: firstText(scene.id, scene.sceneId, scene.scene_id, scene.index) || `scene-${index + 1}`,
      title,
      imageUrl,
      thumbnailUrl: firstText(scene.thumbnailUrl, scene.thumbnail_url, scene.previewUrl, scene.preview_url) || imageUrl,
      hotspots: [],
    };
    return {
      sourceIndex: index,
      source: scene,
      normalized: normalizedScene,
    };
  }).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const normalized = sceneEntries.map((entry) => entry.normalized);

  sceneEntries.forEach(({ source: scene, sourceIndex, normalized: destination }) => {
    const sourceHotspots = [
      ...extractTourHotspots(scene),
      ...(sourceIndex === 0 ? extractTourHotspots({ hotspots: tour?.hotspots, buttons: tour?.buttons }) : []),
    ];

    destination.hotspots = sourceHotspots.reduce<NormalizedTourHotspot[]>((items, hotspot, hotspotIndex) => {
      const position = normalizedMarkerPosition(hotspot);
      const target = hotspotTargetValue(hotspot);
      if (!position || !target) {
        if (!position) {
          if (import.meta.env.DEV) console.warn('[tour] ignored hotspot without position', { sourceIndex, hotspotIndex });
          return items;
        }
        const label = firstText(hotspot.label, hotspot.title, hotspot.name) || `نقطة ${hotspotIndex + 1}`;
        const text = firstText((hotspot as RecordLike).text, (hotspot as RecordLike).description, (hotspot as RecordLike).content);
        items.push({
          id: firstText((hotspot as RecordLike).id) || `${destination.id}-info-${hotspotIndex + 1}`,
          type: 'info',
          title: label,
          label,
          text,
          yaw: position.yaw,
          pitch: position.pitch,
        });
        return items;
      }
      const numericTarget = Number(target);
      const targetIndex = Number.isInteger(numericTarget) && numericTarget >= 0 ? numericTarget : undefined;
      const targetScene = targetIndex != null
        ? sceneEntries.find((entry) => entry.sourceIndex === targetIndex)?.normalized
        : normalized.find((item) => item.id === target || item.title === target);
      if (!targetScene) {
        if (import.meta.env.DEV) console.warn('[tour] ignored hotspot with unknown target', { sourceIndex, hotspotIndex, target });
        return items;
      }
      const label = firstText(hotspot.label, hotspot.title, hotspot.name) || targetScene.title;
      items.push({
        id: firstText(hotspot.id) || `${destination.id}-hotspot-${hotspotIndex + 1}`,
        type: 'scene',
        title: label,
        label,
        yaw: position.yaw,
        pitch: position.pitch,
        targetSceneId: targetScene.id,
        targetIndex: normalized.indexOf(targetScene),
      });
      return items;
    }, []);
  });

  return normalized;
}

function normalizePanoramaData(data: RecordLike): PropertyPanorama {
  const sceneSource = [data.scenes, data.panoramas, data.panorama_tours]
    .find((items) => Array.isArray(items)) as unknown[] | undefined;
  const scenes = extractTourScenes({
    id: toText(data.id),
    title: toText(data.title),
    mainImage: firstText(data.mainImage, data.imageUrl, data.panoramaUrl, data.panorama_url),
    images: Array.isArray(data.images) ? data.images as PropertyPanorama['images'] : undefined,
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.filter((item): item is string => typeof item === 'string') : undefined,
    scenes: sceneSource?.map((item) => normalizeTourScene(item)).filter((item): item is TourScene => Boolean(item)),
    panoramas: Array.isArray(data.panoramas) ? data.panoramas.map((item) => normalizeTourScene(item)).filter((item): item is TourScene => Boolean(item)) : undefined,
    panorama_tours: Array.isArray(data.panorama_tours) ? data.panorama_tours.map((item) => normalizeTourScene(item)).filter((item): item is TourScene => Boolean(item)) : undefined,
    rooms: Array.isArray(data.rooms) ? data.rooms.map((item) => normalizeTourScene(item)).filter((item): item is TourScene => Boolean(item)) : undefined,
  });

  return {
    id: toText(data.id),
    title: toText(data.title),
    hasTour: typeof data.hasTour === 'boolean' ? data.hasTour : undefined,
    mainImage: firstText(data.mainImage, data.imageUrl, data.panoramaUrl, data.panorama_url),
    images: Array.isArray(data.images) ? data.images as PropertyPanorama['images'] : undefined,
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.filter((item): item is string => typeof item === 'string') : undefined,
    scenes: scenes.length > 0 ? scenes : undefined,
    panoramas: Array.isArray(data.panoramas) ? data.panoramas.map((item) => normalizeTourScene(item)).filter((item): item is TourScene => Boolean(item)) : undefined,
    panorama_tours: Array.isArray(data.panorama_tours) ? data.panorama_tours.map((item) => normalizeTourScene(item)).filter((item): item is TourScene => Boolean(item)) : undefined,
    rooms: Array.isArray(data.rooms) ? data.rooms.map((item) => normalizeTourScene(item)).filter((item): item is TourScene => Boolean(item)) : undefined,
    buttons: Array.isArray(data.buttons)
      ? data.buttons
          .filter((item): item is RecordLike => Boolean(item) && typeof item === 'object')
          .map(normalizeHotspotEntry)
          .filter((item): item is TourHotspot => Boolean(item))
          .map((item) => ({ [item.targetIndex || '0']: item.target || {} }))
      : undefined,
    hotspots: Array.isArray(data.hotspots)
      ? data.hotspots
          .filter((item): item is RecordLike => Boolean(item) && typeof item === 'object')
          .map(normalizeFlatHotspot)
      : undefined,
  };
}

export type PanoramaPayloadScene = Partial<PanoramaScene> & {
  file?: File | null;
  previewUrl?: string;
};

export function buildPanoramaTourPayload(scenes: PanoramaPayloadScene[]): PropertyPanorama | null {
  const images = scenes.reduce<PanoramaScene[]>((items, scene, index) => {
    const url = scene.url || scene.path || scene.image || '';
    const name = scene.name || scene.roomName || scene.roomLabel || `مشهد ${index + 1}`;
    if (!url) return items;

    items.push({
      id: scene.id || `scene-${index + 1}`,
      url,
      path: scene.path,
      name,
      roomName: scene.roomName || name,
      roomLabel: scene.roomLabel || name,
      description: scene.description || '',
      order: typeof scene.order === 'number' ? scene.order : index,
      buttons: Array.isArray(scene.buttons) ? scene.buttons : [],
      hotspots: Array.isArray(scene.hotspots) ? scene.hotspots : [],
    });

    return items;
  }, []);

  if (images.length === 0) return null;

  return {
    hasTour: true,
    images,
    scenes: images,
    imageUrls: images.map((scene) => scene.url || scene.path || '').filter(Boolean),
  };
}

export function getTourSceneImages(tour?: PropertyPanorama | null): string[] {
  return extractTourImages(tour);
}

export async function savePropertyTour(propertyId: string, tour: PropertyPanorama): Promise<void> {
  await setDoc(
    doc(db, 'properties', propertyId, 'panorama_tour', 'main'),
    {
      ...tour,
      images: extractTourScenes(tour),
      hasTour: extractTourScenes(tour).length > 0,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getRequestTour(requestId: string): Promise<PropertyPanorama | null> {
  const snap = await getDoc(doc(db, 'property_requests', requestId, 'panorama_tour', 'main'));
  if (!snap.exists()) return null;
  return normalizePanoramaData({ id: snap.id, ...(snap.data() as RecordLike) });
}

export async function saveRequestTour(requestId: string, tour: PropertyPanorama): Promise<void> {
  await setDoc(
    doc(db, 'property_requests', requestId, 'panorama_tour', 'main'),
    {
      ...tour,
      images: extractTourScenes(tour),
      hasTour: extractTourScenes(tour).length > 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getPropertyTour(propertyId: string): Promise<PropertyPanorama | null> {
  const propertySnap = await getDoc(doc(db, 'properties', propertyId));
  if (propertySnap.exists()) {
    const propertyData = propertySnap.data() as RecordLike;
    const inlineTour = propertyData.panorama_tour
      || propertyData.panoramaTour
      || propertyData.panoramaTours
      || propertyData.panorama_tours
      || propertyData.panoramas;
    if (Array.isArray(inlineTour)) {
      return normalizePanoramaData({ scenes: inlineTour });
    }
    if (inlineTour && typeof inlineTour === 'object') {
      return normalizePanoramaData(inlineTour as RecordLike);
    }
  }

  const candidates = [
    ['panorama_tour', 'main'],
    ['panorama_tours', 'main'],
    ['tour', 'main'],
  ] as const;

  for (const [collectionName, docId] of candidates) {
    const snap = await getDoc(doc(db, 'properties', propertyId, collectionName, docId));
    if (snap.exists()) {
      return normalizePanoramaData({ id: snap.id, ...(snap.data() as RecordLike) });
    }
  }

  return null;
}
