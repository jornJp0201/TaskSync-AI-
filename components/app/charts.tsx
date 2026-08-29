'use client';

import dynamic from 'next/dynamic';

const ChartsLoader = dynamic(
  () => import('./charts-inner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        読み込み中...
      </div>
    ),
  }
);

interface WeeklyDataPoint {
  day: string;
  minutes: number;
  target: number;
}

interface CategoryDataPoint {
  name: string;
  value: number;
  color: string;
}

interface ProductivityDataPoint {
  week: string;
  estimated: number;
  actual: number;
}

export function WeeklyStudyChart({ data }: { data: WeeklyDataPoint[] }) {
  return <ChartsLoader chart="weekly" weeklyData={data} />;
}

export function CategoryChart({ data }: { data: CategoryDataPoint[] }) {
  return <ChartsLoader chart="category" categoryData={data} />;
}

export function ProductivityChart({ data }: { data: ProductivityDataPoint[] }) {
  return <ChartsLoader chart="productivity" productivityData={data} />;
}
