import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Flash, PageHead } from "@/components/admin/ui";
import { PostForm } from "../PostForm";

export const dynamic = "force-dynamic";

export default async function EditPost({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string; error?: string } }) {
  const post = await db.blogPost.findUnique({ where: { id: params.id } });
  if (!post) notFound();
  return (
    <>
      <PageHead title={post.title} />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <PostForm post={post} />
    </>
  );
}
