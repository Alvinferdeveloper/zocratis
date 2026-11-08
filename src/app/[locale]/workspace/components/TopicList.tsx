import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";
import { NavItem, NavItemCount } from "@/components/ui/nav-item";
import { Topic } from "@/app/types";
import { CollectionSwatch } from "@/app/[locale]/workspace/components/CollectionSwatch";

interface TopicListProps {
  topics: Topic[];
  activeTopicId: string | null;
}

export const TopicList: React.FC<TopicListProps> = ({ topics, activeTopicId }) => (
  <ul className="space-y-0.5">
    {topics.map((topic) => (
      <li key={topic.id}>
        <NavItem asChild isActive={topic.id === activeTopicId}>
          <Link href={ROUTES.workspaceCollection(topic.id)}>
            <CollectionSwatch color={topic.color} />
            <span className="truncate">{topic.name}</span>
            <NavItemCount>{topic.count}</NavItemCount>
          </Link>
        </NavItem>
      </li>
    ))}
  </ul>
);
