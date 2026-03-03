import { TheorySection } from '@/components/theory/TheorySection';
import { DemoSection } from '@/components/demo/DemoSection';
import Exercise1 from '@/components/exercises/Exercise1';
import Exercise2 from '@/components/exercises/Exercise2';
import { Exercise3 } from '@/components/exercises/Exercise3';
import { Exercise4 } from '@/components/exercises/Exercise4';
import { Exercise5 } from '@/components/exercises/Exercise5';
import { Playground } from '@/components/playground/Playground';

export default function Home() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <TheorySection />
      <DemoSection />
      <Exercise1 />
      <Exercise2 />
      <Exercise3 />
      <Exercise4 />
      <Exercise5 />
      <Playground />
    </main>
  );
}
