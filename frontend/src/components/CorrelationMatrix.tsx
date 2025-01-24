'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions,
  ScatterDataPoint,
  ChartData
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface CorrelationMatrixProps {
  data: Record<string, Record<string, number>>;
}

const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ data }) => {
  const { labels, correlations, chartData } = useMemo(() => {
    const labels = Object.keys(data);
    const correlations = labels.map(asset1 => 
      labels.map(asset2 => data[asset1][asset2] || 0)
    );

    // Create scatter plot data points
    const points: Array<ScatterDataPoint & { correlation: number }> = [];
    labels.forEach((asset1, i) => {
      labels.forEach((asset2, j) => {
        points.push({
          x: i,
          y: j,
          correlation: correlations[i][j]
        });
      });
    });

    const chartData: ChartData<'scatter'> = {
      datasets: [{
        label: 'Correlation',
        data: points.map(point => ({
          x: point.x,
          y: point.y,
          r: Math.abs(point.correlation) * 20 // Size based on correlation strength
        })),
        backgroundColor: points.map(point => 
          point.correlation > 0 
            ? `rgba(0, 128, 0, ${Math.abs(point.correlation)})`  // Green for positive
            : `rgba(255, 0, 0, ${Math.abs(point.correlation)})` // Red for negative
        ),
        pointStyle: 'circle',
      }]
    };

    return { labels, correlations, chartData };
  }, [data]);

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        min: -0.5,
        max: labels.length - 0.5,
        ticks: {
          callback: function(value) {
            return labels[Math.round(Number(value))] || '';
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear',
        min: -0.5,
        max: labels.length - 0.5,
        ticks: {
          callback: function(value) {
            return labels[Math.round(Number(value))] || '';
          }
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const point = context.raw as ScatterDataPoint & { r: number };
            const asset1 = labels[Math.round(point.x)];
            const asset2 = labels[Math.round(point.y)];
            const correlation = correlations[Math.round(point.x)][Math.round(point.y)];
            return `${asset1} vs ${asset2}: ${correlation.toFixed(2)}`;
          }
        }
      },
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Asset Correlation Matrix'
      }
    }
  };

  return (
    <div className="w-full h-[500px] p-4">
      <div className="h-full">
        <Scatter data={chartData} options={options} />
      </div>
      <div className="mt-4 flex justify-center items-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2 opacity-70"></div>
          <span>Positive Correlation</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2 opacity-70"></div>
          <span>Negative Correlation</span>
        </div>
      </div>
    </div>
  );
};

export default CorrelationMatrix;