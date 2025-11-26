// /jobs/view/page.tsx
"use client";

import { Suspense } from "react";
import JobViewPage from "./JobViewPage";

export default function PageWrapper() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <JobViewPage />
    </Suspense>
  );
}
