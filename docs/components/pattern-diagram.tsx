'use client';

import React, { useEffect, useId, useState } from 'react';

export interface PatternDiagramProps {
  title?: string;
  chart?: string;
  caption?: string;
  children?: React.ReactNode;
}

function extractChartText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractChartText).join('');
  if (React.isValidElement(node)) {
    return extractChartText((node.props as any)?.children);
  }
  return '';
}

/**
 * PatternDiagram — renders a Mermaid flowchart / class diagram into an interactive,
 * theme-aware SVG component.
 */
export function PatternDiagram({ title, chart, caption, children }: PatternDiagramProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '_');

  const chartSource = chart || extractChartText(children);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!chartSource || !chartSource.trim()) return;

      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          fontFamily: 'inherit',
          securityLevel: 'loose',
        });

        // Clean up common syntax errors
        let cleanChart = chartSource.trim();
        // Replace invalid double-dot arrows -..-> with valid -.->
        cleanChart = cleanChart.replace(/-\.\.->/g, '-.->');

        const renderId = `mermaid_${rawId}_${Math.random().toString(36).substring(2, 7)}`;
        const { svg: renderedSvg } = await mermaid.render(renderId, cleanChart);

        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Mermaid render error:', err);
          setError(err?.message || 'Failed to render diagram');
        }
      }
    }

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chartSource, rawId]);

  return (
    <div className="pattern-diagram my-6 rounded-2xl border border-fd-border bg-fd-card/50 overflow-hidden shadow-xs">
      {title && (
        <div className="px-5 py-2.5 border-b border-fd-border bg-fd-muted/30 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-fd-muted-foreground">
            {title}
          </span>
        </div>
      )}
      <div className="p-4 flex justify-center items-center overflow-x-auto min-h-[120px]">
        {error ? (
          <div className="text-xs text-red-500 font-mono p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900 w-full">
            <p className="font-semibold mb-1">Mermaid Syntax Error</p>
            <p>{error}</p>
          </div>
        ) : svg ? (
          <div
            className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="text-xs text-fd-muted-foreground animate-pulse py-6">
            Rendering diagram...
          </div>
        )}
      </div>
      {caption && (
        <div className="px-5 py-2 border-t border-fd-border bg-fd-muted/10">
          <p className="text-xs text-fd-muted-foreground italic text-center">{caption}</p>
        </div>
      )}
    </div>
  );
}
