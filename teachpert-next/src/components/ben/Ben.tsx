import Image, { type StaticImageData } from 'next/image';
import welcoming from '@/assets/ben/ben-welcoming.webp';
import thinking from '@/assets/ben/ben-thinking.webp';
import explaining from '@/assets/ben/ben-explaining.webp';
import encouraging from '@/assets/ben/ben-encouraging.webp';
import completed from '@/assets/ben/ben-completed.webp';

export type BenPose = 'welcoming' | 'thinking' | 'explaining' | 'encouraging' | 'completed';

// Imported as modules so the basePath is applied in the static export (GitHub Pages)
const POSES: Record<BenPose, StaticImageData> = { welcoming, thinking, explaining, encouraging, completed };

/** Ben, the guide. Decorative: the accompanying HTML text always carries the message. */
export function Ben({ pose, size, eager = false }: { pose: BenPose; size: 'intro' | 'aside' | 'feedback'; eager?: boolean }) {
  return (
    <Image
      src={POSES[pose]}
      alt=""
      className={`ben ben-size-${size}`}
      loading={eager ? 'eager' : 'lazy'}
      data-pose={pose}
    />
  );
}
