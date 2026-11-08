import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ItemLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

// The item's name; its ::after covers the whole row or tile, so one link opens the item and carries its focus ring.
export const ItemLink: React.FC<ItemLinkProps> = ({ href, className, children }) => (
  <Link
    href={href}
    className={cn(
      "block truncate outline-none after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring",
      className
    )}
  >
    {children}
  </Link>
);
