type PixelNodeIconProps = {
  role: string;
};

const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
  strokeWidth: 2,
};

export default function PixelNodeIcon({ role }: PixelNodeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className="pixel-node-icon"
      data-node-icon={role}
      focusable="false"
      shapeRendering="crispEdges"
      viewBox="0 0 24 24"
    >
      {role === 'delivery' && (
        <g {...common}>
          <path d="M3 5h14v11H3zM3 6l7 6 7-6" />
          <path d="M19 5v5h2v4h-2v2h-3" />
          <path d="M18 3h3v3" />
        </g>
      )}
      {role === 'gate' && (
        <g {...common}>
          <path d="M4 20V7l4-4h8l4 4v13M8 20V9h8v11" />
          <path d="M8 12l4-3 4 3-4 3z" />
          <path d="M12 11v2" />
        </g>
      )}
      {role === 'relay' && (
        <g {...common}>
          <path d="M3 4h6v5H3zM15 15h6v5h-6z" />
          <path d="M9 6h6v3h3v3M15 18H9v-3H6v-3" />
          <path d="M16 10l2 2 2-2M8 14l-2-2-2 2" />
        </g>
      )}
      {role === 'identity' && (
        <g {...common}>
          <path d="M12 2l8 3v6c0 5-3 8-8 11-5-3-8-6-8-11V5z" />
          <path d="M8 11h8M10 11V8h4v3M9 15h6" />
        </g>
      )}
      {role === 'session' && (
        <g {...common}>
          <path d="M3 6h18v12H3zM3 9h18" />
          <path d="M7 13h5v2H7zM16 12v4M14 14h4" />
          <path d="M6 3v3M18 3v3" />
        </g>
      )}
      {role === 'operator' && (
        <g {...common}>
          <path d="M5 8h14l3 9-3 3-4-4H9l-4 4-3-3z" />
          <path d="M7 11v5M5 13h4M16 12h2M18 14h2" />
        </g>
      )}
      {role === 'postauth' && (
        <g {...common}>
          <path d="M3 4h18v16H3zM3 8h18" />
          <path d="M7 12l3 2-3 2M12 17h5" />
          <path d="M6 6h1M9 6h1" />
        </g>
      )}
      {role === 'workloads' && (
        <g {...common}>
          <path d="M3 5h7v6H3zM14 5h7v6h-7zM3 15h7v5H3zM14 15h7v5h-7z" />
          <path d="M10 8h4M7 11v4M17 11v4M10 17h4" />
        </g>
      )}
    </svg>
  );
}
