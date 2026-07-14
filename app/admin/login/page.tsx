import SubmitButton from "@/components/SubmitButton";
import { signIn } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const { error, email } = await searchParams;
  return (
    <form action={signIn} className="mx-auto mt-16 flex max-w-sm flex-col gap-3">
      <h1 className="text-xl font-bold">Admin login</h1>
      {error && <p className="text-sm text-red-500">Login failed.</p>}
      <input
        type="email"
        name="email"
        placeholder="Email"
        defaultValue={email}
        required
        className="rounded border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        className="rounded border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
      />
      <SubmitButton className="rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-black">
        Sign in
      </SubmitButton>
    </form>
  );
}
