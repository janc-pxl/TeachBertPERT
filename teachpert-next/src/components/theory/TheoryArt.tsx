import Image, { type StaticImageData } from 'next/image';
import projectplanning from '@/assets/theorie/pert-projectplanning.webp';
import tijdsschattingen from '@/assets/theorie/pert-tijdsschattingen.webp';
import wachttijd from '@/assets/theorie/pert-wachttijd.webp';
import kritiekeRoute from '@/assets/theorie/pert-kritieke-route.webp';

export type TheoryArtName = 'projectplanning' | 'tijdsschattingen' | 'wachttijd' | 'kritieke-route';

// Imported as modules so the basePath is applied in the static export (GitHub Pages)
const ART: Record<TheoryArtName, StaticImageData> = {
  projectplanning,
  tijdsschattingen,
  wachttijd,
  'kritieke-route': kritiekeRoute,
};

/**
 * Decorative spot illustration for the theory section. Conceptual only — never a
 * technical PERT diagram or exact time measurement. The adjacent text explains the concept.
 */
export function TheoryArt({ name, eager = false }: { name: TheoryArtName; eager?: boolean }) {
  return (
    <Image
      src={ART[name]}
      alt=""
      className={`theory-art theory-art-${name}`}
      loading={eager ? 'eager' : 'lazy'}
    />
  );
}
