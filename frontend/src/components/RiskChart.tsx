'use client';

import { useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RiskChartProps {
  simulationPaths: number[][];
  percentiles: {
    '5th': number;
    '25th': number;
    '50th': number;
    '75th': number;
    '95th': number;
  };
  timeHorizon: number;
}

const RiskChart: React.FC<RiskChartProps> = ({
  simulationPaths,
  percentiles,
  timeHorizon
}) => {
  const timeLabels = useMemo(() => {
    const labels = [];
    const interval = timeHorizon / 12; // Monthly intervals
    for (let i = 0; i <= timeHorizon; i += interval) {
      labels.push(`Month ${Math.round(i / interval)}`);
    }
    return labels;
  }, [timeHorizon]);

  // Calculate mean path and confidence intervals
  const chartData = useMemo(() => {
    if (!simulationPaths || simulationPaths.length === 0) return null;

    const numPoints = simulationPaths[0].length;
    const meanPath = new Array(numPoints).fill(0);
    const upperBound = new Array(numPoints).fill(0);
    const lowerBound = new Array(numPoints).fill(0);

    // Calculate mean path
    for (let i = 0; i < numPoints; i++) {
      const values = simulationPaths.map(path => path[i]);
      meanPath[i] = values.reduce((a, b) => a + b, 0) / values.length;
      
      // Sort values for percentile calculation
      const sortedValues = values.sort((a, b) => a - b);
      const lowerIdx = Math.floor(values.length * 0.05);
      const upperIdx = Math.floor(values.length * 0.95);
      
      lowerBound[i] = sortedValues[lowerIdx];
      upperBound[i] = sortedValues[upperIdx];
    }

    return {
      labels: timeLabels,
      datasets: [
        {
          label: 'Expected Path',
          data: meanPath,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.4,
        },
        {
          label: '95% Confidence Upper Bound',
          data: upperBound,
          borderColor: 'rgba(255, 99, 132, 0.5)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderDash: [5, 5],
          tension: 0.4,
        },
        {
          label: '95% Confidence Lower Bound',
          data: lowerBound,
          borderColor: 'rgba(255, 99, 132, 0.5)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderDash: [5, 5],
          tension: 0.4,
          fill: {
            target: 1,
            above: 'rgba(255, 99, 132, 0.1)',
          },
        },
      ],
    };
  }, [simulationPaths, timeLabels]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Portfolio Value Monte Carlo Simulation',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: $${value.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time Horizon',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Portfolio Value ($)',
        },
        ticks: {
          callback: (value) => 
            `$${value.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`,
        },
      },
    },
  };

  if (!chartData) return null;

  return (
    <div className="w-full h-full min-h-[400px]">
      <Line data={chartData} options={options} />
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold">5th Percentile</div>
          <div className="text-red-500">
            ${percentiles['5th'].toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold">Median</div>
          <div className="text-blue-500">
            ${percentiles['50th'].toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold">95th Percentile</div>
          <div className="text-green-500">
            ${percentiles['95th'].toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskChart;