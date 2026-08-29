'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

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

interface ChartsInnerProps {
  chart: 'weekly' | 'category' | 'productivity';
  weeklyData?: WeeklyDataPoint[];
  categoryData?: CategoryDataPoint[];
  productivityData?: ProductivityDataPoint[];
}

const CATEGORY_COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'];

export default function ChartsInner({
  chart,
  weeklyData = [],
  categoryData = [],
  productivityData = [],
}: ChartsInnerProps) {
  if (chart === 'weekly') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            unit="分"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Bar dataKey="target" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="目標" />
          <Bar dataKey="minutes" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="実績" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart === 'category') {
    const data =
      categoryData.length > 0
        ? categoryData
        : [{ name: 'データなし', value: 1, color: '#e2e8f0' }];

    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={productivityData}>
        <defs>
          <linearGradient id="estGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          unit="分"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            fontSize: '12px',
          }}
        />
        <Area type="monotone" dataKey="estimated" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#estGrad)" name="見積もり" />
        <Area type="monotone" dataKey="actual" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#actGrad)" name="実績" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
