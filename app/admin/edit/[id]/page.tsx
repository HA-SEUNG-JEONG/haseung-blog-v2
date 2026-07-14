import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Editor from "@/components/Editor";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("*").eq("id", id).single();

  if (!post) notFound();

  return <Editor post={post} />;
}
