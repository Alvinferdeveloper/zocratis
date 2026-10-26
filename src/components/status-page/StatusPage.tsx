import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LocaleSwitcher } from "@/components/locale/LocaleSwitcher";
import { ROUTES } from "@/config/routes";

interface StatusPageProps {
  eyebrow: string;
  title: string;
  description: string;
  actions: React.ReactNode;
  // Sits at the foot of the sheet like a page number: the status code or an error reference.
  folio?: React.ReactNode;
}

// Full-screen shell shared by the 404 and error pages: brand header and a single sheet of paper.
export const StatusPage: React.FC<StatusPageProps> = ({ eyebrow, title, description, actions, folio }) => (
  <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
    <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
      <Link href={ROUTES.home} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <BrandLogo />
      </Link>
      <LocaleSwitcher />
    </header>
    <main className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
      <section className="flex w-full max-w-[460px] flex-col gap-4 rounded-2xl border border-border bg-card px-6 pb-7 pt-12 sm:px-11">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{eyebrow}</p>
        <h1 className="font-serif text-4xl italic leading-[1.1] tracking-[-0.01em]">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-3 flex flex-wrap gap-2">{actions}</div>
        {folio && (
          <p className="mt-7 border-t border-border pt-4 text-center font-mono text-xs font-medium tabular-nums text-muted-foreground">
            {folio}
          </p>
        )}
      </section>
    </main>
  </div>
);
