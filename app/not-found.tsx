import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-[44px]" aria-hidden="true">
          🍽️
        </p>
        <h1 className="mt-3 font-display text-[28px] font-bold text-forest-900">
          That table&rsquo;s not here
        </h1>
        <p className="mx-auto mt-2 max-w-[32ch] text-[14.5px] leading-relaxed text-ink-500">
          The page you were looking for doesn&rsquo;t exist. Let&rsquo;s get you fed instead.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-forest-800 px-7 py-3.5 text-[15.5px] font-semibold text-cream-50 shadow-cta transition-transform active:scale-[0.98]"
        >
          Find my food
        </Link>
      </div>
    </main>
  );
}
