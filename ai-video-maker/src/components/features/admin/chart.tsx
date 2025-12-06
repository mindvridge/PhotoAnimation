'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// 차트 색상 팔레트
const COLORS = [
  '#f43f5e', // rose-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

interface ChartData {
  name: string;
  [key: string]: string | number;
}

interface ChartProps {
  title: string;
  description?: string;
  data: ChartData[];
  type?: 'line' | 'bar' | 'area' | 'pie';
  dataKeys: {
    key: string;
    name: string;
    color?: string;
  }[];
  xAxisKey?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

export function Chart({
  title,
  description,
  data,
  type = 'line',
  dataKeys,
  xAxisKey = 'name',
  height = 300,
  showLegend = true,
  showGrid = true,
}: ChartProps) {
  const renderChart = () => {
    if (type === 'pie') {
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKeys[0]?.key || 'value'}
            nameKey={xAxisKey}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={dataKeys[0]?.color || COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          />
          {showLegend && <Legend />}
        </PieChart>
      );
    }

    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    const commonAxisProps = {
      xAxis: (
        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
        />
      ),
      yAxis: (
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
        />
      ),
      grid: showGrid && (
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      ),
      tooltip: (
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        />
      ),
      legend: showLegend && <Legend />,
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {commonAxisProps.grid}
            {commonAxisProps.xAxis}
            {commonAxisProps.yAxis}
            {commonAxisProps.tooltip}
            {commonAxisProps.legend}
            {dataKeys.map((dk, index) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.name}
                fill={dk.color || COLORS[index % COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {commonAxisProps.grid}
            {commonAxisProps.xAxis}
            {commonAxisProps.yAxis}
            {commonAxisProps.tooltip}
            {commonAxisProps.legend}
            {dataKeys.map((dk, index) => (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color || COLORS[index % COLORS.length]}
                fill={dk.color || COLORS[index % COLORS.length]}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        );

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {commonAxisProps.grid}
            {commonAxisProps.xAxis}
            {commonAxisProps.yAxis}
            {commonAxisProps.tooltip}
            {commonAxisProps.legend}
            {dataKeys.map((dk, index) => (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color || COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default Chart;
