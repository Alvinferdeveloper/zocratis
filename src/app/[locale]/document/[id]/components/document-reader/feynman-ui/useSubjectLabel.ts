import { useTranslations } from "next-intl";
import type { FeynmanSubject } from "@/app/[locale]/document/[id]/hooks/useFeynman";
import { toExcerpt } from "@/app/[locale]/document/[id]/lib/explanation";

export const useSubjectLabel = () => {
  const t = useTranslations("feynman.subject");
  return (subject: FeynmanSubject): string => {
    if (subject.kind === "passage") {
      return t("passage", { excerpt: toExcerpt(subject.text ?? ""), page: subject.pageNumber });
    }
    if (subject.kind === "region") {
      return t("region", { kind: subject.regionKind ?? "other", page: subject.pageNumber });
    }
    return subject.pageTo && subject.pageTo !== subject.pageNumber
      ? t("pages", { from: subject.pageNumber, to: subject.pageTo })
      : t("page", { page: subject.pageNumber });
  };
};
