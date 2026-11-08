import { useFormatter, useNow } from "next-intl";

interface RelativeDateProps {
  date: string | null | undefined;
  fallback: string;
}

// "hace 2 horas", with the full date on hover.
export const RelativeDate: React.FC<RelativeDateProps> = ({ date, fallback }) => {
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  if (!date) return <>{fallback}</>;

  const value = new Date(date);
  return (
    <time dateTime={value.toISOString()} title={format.dateTime(value, { dateStyle: "long", timeStyle: "short" })}>
      {format.relativeTime(value, now)}
    </time>
  );
};
