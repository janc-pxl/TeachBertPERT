'use client';
import { useEffect, useRef, useState } from 'react';
import { Ben, type BenPose } from './Ben';

interface Props {
  /** Existing feedback text from the check (empty = not checked yet). */
  message: string;
  /** Existing feedback class, e.g. 'ex1-feedback success'. */
  cls: string;
  /** Pose when the check fully succeeds: 'completed' for a whole exercise, 'encouraging' for a partial step. */
  successPose: BenPose;
  /** Selector(s) of the answer area. Any change there hides Ben until the next check (no stale success). */
  watch: string;
  /** Hide Ben (text stays), e.g. step-1 success once the whole exercise is completed. */
  suppress?: boolean;
}

/**
 * Feedback panel under the check buttons. Must be placed directly after the
 * `.ex1-controls` row: the Controleer button there re-enables Ben.
 */
export function BenFeedback({ message, cls, successPose, watch, suppress = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => { setStale(false); }, [message, cls]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const checkBtn = root.previousElementSibling?.querySelector('.ex1-check-btn');
    const onCheck = () => setStale(false);
    const onChange = () => setStale(true);
    const targets = Array.from(document.querySelectorAll(watch));
    checkBtn?.addEventListener('click', onCheck);
    targets.forEach((t) => {
      t.addEventListener('input', onChange);
      t.addEventListener('pointerdown', onChange);
    });
    return () => {
      checkBtn?.removeEventListener('click', onCheck);
      targets.forEach((t) => {
        t.removeEventListener('input', onChange);
        t.removeEventListener('pointerdown', onChange);
      });
    };
  }, [watch]);

  const success = cls.includes('success');
  const pose: BenPose = success ? successPose : 'explaining';
  const showBen = !!message && !stale && !suppress;

  return (
    <div ref={ref} className={`ben-feedback${message ? ' has-message' : ''}`} role="status" aria-live="polite">
      {showBen && <Ben pose={pose} size="feedback" />}
      <div className={cls}>{message}</div>
    </div>
  );
}
