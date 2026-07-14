"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: String(formData.get("password")),
  });
  if (error) redirect(`/admin/login?error=1&email=${encodeURIComponent(email)}`);
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

  if ("slug" in update) {
    const slug = String(update.slug ?? "").trim();
    if (!slug) return "slug is required";
    if (slug.includes("/")) return "slug cannot contain '/'";
    update.slug = slug;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("posts").update(update).eq("id", id);
  if (!error) {
    revalidatePath("/", "layout");
    return null;
  }
  return error.code === "23505" ? "slug already exists" : error.message;
}

export async function publishPost(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("published_at")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("posts")
    .update({
      is_draft: false,
      published_at: data?.published_at ?? new Date().toISOString(),
    })
    .eq("id", id);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
}

export async function unpublishPost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").update({ is_draft: true }).eq("id", id);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
}

// ponytail: storage attachments are not cleaned up on delete; add a cleanup pass if orphans ever matter
export async function deletePost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
}
