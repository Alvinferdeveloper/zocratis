import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/status-page/BackButton";
import { StatusPage } from "@/components/status-page/StatusPage";
import { ROUTES } from "@/config/routes";

export default async function NotFound() {
  const t = await getTranslations("common.statusPage");

  return (
    <StatusPage
      eyebrow={t("notFound.eyebrow")}
      title={t("notFound.title")}
      description={t("notFound.description")}
      actions={
        <>
          {/* Home also serves signed-in users: the middleware sends them on to the workspace. */}
          <Button asChild>
            <Link href={ROUTES.home}>{t("backHome")}</Link>
          </Button>
          <BackButton label={t("notFound.back")} />
        </>
      }
      folio="— 404 —"
    />
  );
}
