"use client";

import dynamic from "next/dynamic";

const TailorManagementApp = dynamic(
  () => import("@/components/TailorManagementApp"),
  {
    ssr: false,
  }
);

export default function HomePage() {
  return <TailorManagementApp />;
}
