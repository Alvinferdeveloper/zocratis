export interface Figure {
  label: string;
  value: string;
}

// A quiet row of labelled numbers, deliberately not hero-sized (DESIGN.md).
export const FigureList: React.FC<{ figures: Figure[] }> = ({ figures }) => (
  <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
    {figures.map(({ label, value }) => (
      <div key={label}>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</dd>
      </div>
    ))}
  </dl>
);
