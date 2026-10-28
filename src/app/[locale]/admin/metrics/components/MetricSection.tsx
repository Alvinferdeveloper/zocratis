interface MetricSectionProps {
  title: string;
  hint: string;
  children: React.ReactNode;
}

export const MetricSection: React.FC<MetricSectionProps> = ({ title, hint, children }) => (
  <section className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{title}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    <div className="mt-5">{children}</div>
  </section>
);
