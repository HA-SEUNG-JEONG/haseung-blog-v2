import type { Metadata } from "next";
import SubmitButton from "@/components/SubmitButton";
import { signIn } from "@/app/actions";

export const metadata: Metadata = { title: "관리자 로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <form action={signIn} className="mx-auto mt-16 flex max-w-sm flex-col gap-3">
      <h1 className="text-xl font-bold">관리자 로그인</h1>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          로그인에 실패했습니다.
        </p>
      )}
      <input
        type="email"
        name="email"
        autoComplete="email"
        spellCheck={false}
        autoFocus
        placeholder="이메일"
        aria-label="이메일"
        required
        className="rounded border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
      />
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="비밀번호"
        aria-label="비밀번호"
        required
        className="rounded border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
      />
      <SubmitButton className="rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-black">
        로그인
      </SubmitButton>
    </form>
  );
}
