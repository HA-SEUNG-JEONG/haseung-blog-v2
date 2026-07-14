import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="mt-2 text-neutral-500">페이지를 찾을 수 없습니다.</p>
      <Link href="/" className="mt-4 inline-block text-sm hover:underline">
        ← 홈으로
      </Link>
    </div>
  );
}
