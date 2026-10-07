import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RestaurantDetail } from "@/components/RestaurantDetail";
import { RESTAURANTS, getRestaurant } from "@/lib/restaurants";

export function generateStaticParams() {
  return RESTAURANTS.map((restaurant) => ({ id: restaurant.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const restaurant = getRestaurant(id);
  if (!restaurant) return { title: "Not found — Menu" };
  return {
    title: `${restaurant.name} — Menu`,
    description: restaurant.blurb,
  };
}

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = getRestaurant(id);
  if (!restaurant) notFound();

  return (
    <Suspense fallback={<div className="min-h-dvh bg-page" />}>
      <RestaurantDetail restaurant={restaurant} />
    </Suspense>
  );
}
