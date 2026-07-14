"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect("/admin/login?error=1");
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createPost() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({ slug: `draft-${crypto.randomUUID().slice(0, 8)}` })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "insert failed");
  redirect(`/admin/edit/${data.id}`);
}

const UPDATABLE = [
  "title",
  "slug",
  "content_md",
  "is_draft",
  "published_at",
  "comments_enabled",
] as const;

// Returns an error message or null. Allowlist keeps view_count/created_at untouchable.
export async function updatePost(
  id: string,
  patch: Partial<Record<(typeof UPDATABLE)[number], unknown>>
) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of UPDATABLE) if (key in patch) update[key] = patch[key];

  const supabase = await createClient();
  const { error } = await supabase.from("posts").update(update).eq("id", id);
  if (!error) revalidatePath("/", "layout");
  return error?.message ?? null;
}

export async function publishPost(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("published_at")
    .eq("id", id)
    .single();
  await supabase
    .from("posts")
    .update({
      is_draft: false,
      published_at: data?.published_at ?? new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/", "layout");
}

export async function unpublishPost(id: string) {
  const supabase = await createClient();
  await supabase.from("posts").update({ is_draft: true }).eq("id", id);
  revalidatePath("/", "layout");
}

// ponytail: storage attachments are not cleaned up on delete; add a cleanup pass if orphans ever matter
export async function deletePost(id: string) {
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", id);
  revalidatePath("/", "layout");
}
