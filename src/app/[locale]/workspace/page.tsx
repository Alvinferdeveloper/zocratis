"use client";

import { Suspense } from "react";
import { WorkspaceView } from "@/app/[locale]/workspace/components/WorkspaceView";

// The view reads the open collection from the URL (useSearchParams), which needs a Suspense boundary.
const WorkspacePage = () => (
  <Suspense>
    <WorkspaceView />
  </Suspense>
);

export default WorkspacePage;
