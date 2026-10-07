import { Suspense } from "react";
import { MenuView } from "@/components/MenuView";

export const metadata = {
  title: "Your Menu — Menu",
};

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-page" />}>
      <MenuView />
    </Suspense>
  );
}
