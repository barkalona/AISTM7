'use client';

import { useEffect, useRef } from 'react';
import { useRiskAnalysis } from '@/hooks/useRiskAnalysis';
import * as d3 from 'd3';

interface CorrelationData {
  source: string;
  target: string;
  correlation: number;
}

interface LegendStop {
  offset: string;
  color: string;
}

interface CorrelationMatrix {
  [key: string]: {
    [key: string]: number;
  };
}

export default function CorrelationMatrix() {
  const { getCorrelationMatrix, isLoading } = useRiskAnalysis();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fetchAndRenderMatrix = async () => {
      const correlationMatrix = await getCorrelationMatrix();
      if (!correlationMatrix || !svgRef.current) return;

      // Convert matrix to array of correlations
      const data: CorrelationData[] = [];
      const symbols = Object.keys(correlationMatrix);
      symbols.forEach((source: string) => {
        symbols.forEach((target: string) => {
          data.push({
            source,
            target,
            correlation: correlationMatrix[source][target]
          });
        });
      });

      // Clear previous visualization
      d3.select(svgRef.current).selectAll('*').remove();

      // Set up dimensions
      const margin = { top: 50, right: 50, bottom: 50, left: 50 };
      const width = 600;
      const height = 600;
      const cellSize = Math.min(
        (width - margin.left - margin.right) / symbols.length,
        (height - margin.top - margin.bottom) / symbols.length
      );

      // Create color scale
      const colorScale = d3.scaleLinear<string>()
        .domain([-1, 0, 1])
        .range(['#ef4444', '#ffffff', '#22c55e']);

      // Create SVG
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Add x-axis labels
      svg.selectAll('.x-label')
        .data(symbols)
        .enter()
        .append('text')
        .attr('class', 'x-label')
        .attr('x', (d: string, i: number) => i * cellSize + cellSize / 2)
        .attr('y', -10)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text((d: string) => d);

      // Add y-axis labels
      svg.selectAll('.y-label')
        .data(symbols)
        .enter()
        .append('text')
        .attr('class', 'y-label')
        .attr('x', -10)
        .attr('y', (d: string, i: number) => i * cellSize + cellSize / 2)
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('alignment-baseline', 'middle')
        .text((d: string) => d);

      // Add cells
      const cells = svg.selectAll('.cell')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'cell')
        .attr('transform', (d: CorrelationData) => {
          const x = symbols.indexOf(d.target) * cellSize;
          const y = symbols.indexOf(d.source) * cellSize;
          return `translate(${x},${y})`;
        });

      // Add rectangles for each cell
      cells.append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .style('fill', (d: CorrelationData) => colorScale(d.correlation))
        .style('stroke', '#e5e7eb')
        .style('stroke-width', 1);

      // Add correlation values
      cells.append('text')
        .attr('x', cellSize / 2)
        .attr('y', cellSize / 2)
        .style('text-anchor', 'middle')
        .style('alignment-baseline', 'middle')
        .style('font-size', '10px')
        .style('fill', (d: CorrelationData) => Math.abs(d.correlation) > 0.5 ? '#ffffff' : '#000000')
        .text((d: CorrelationData) => d.correlation.toFixed(2));

      // Add legend
      const legendWidth = 200;
      const legendHeight = 20;
      const legend = svg.append('g')
        .attr('transform', `translate(${(width - margin.left - margin.right - legendWidth) / 2},${height - margin.bottom})`);

      const legendScale = d3.scaleLinear()
        .domain([-1, 1])
        .range([0, legendWidth]);

      const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d => d?.toString() || '');

      const legendGradient = legend.append('defs')
        .append('linearGradient')
        .attr('id', 'correlation-gradient')
        .attr('x1', '0%')
        .attr('x2', '100%')
        .attr('y1', '0%')
        .attr('y2', '0%');

      const legendStops: LegendStop[] = [
        { offset: '0%', color: '#ef4444' },
        { offset: '50%', color: '#ffffff' },
        { offset: '100%', color: '#22c55e' }
      ];

      legendGradient.selectAll('stop')
        .data(legendStops)
        .enter()
        .append('stop')
        .attr('offset', (d: LegendStop) => d.offset)
        .attr('stop-color', (d: LegendStop) => d.color);

      legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#correlation-gradient)');

      legend.append('g')
        .attr('transform', `translate(0,${legendHeight})`)
        .call(legendAxis);

      legend.append('text')
        .attr('x', legendWidth / 2)
        .attr('y', -5)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Correlation');
    };

    fetchAndRenderMatrix();
  }, [getCorrelationMatrix]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Asset Correlation Matrix</h3>
      <div className="flex justify-center">
        <svg ref={svgRef} className="max-w-full" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        This matrix shows the correlation between different assets in your portfolio.
        Values range from -1 (perfect negative correlation) to 1 (perfect positive correlation).
        A value of 0 indicates no correlation.
      </p>
    </div>
  );
}