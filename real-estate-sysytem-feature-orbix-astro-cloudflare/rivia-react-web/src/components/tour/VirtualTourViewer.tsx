import type { PropertyPanorama } from '../../types/models';
import { PannablePanoramaViewer } from './PannablePanoramaViewer';

type VirtualTourViewerProps = {
  tour: PropertyPanorama | null;
};

export function VirtualTourViewer({ tour }: VirtualTourViewerProps) {
  return <PannablePanoramaViewer tour={tour} />;
}
