import { Flash, PageHead } from "@/components/admin/ui";
import { PostForm } from "../PostForm";

export default function NewPost({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  return (
    <>
      <PageHead title="Nouvel article" />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <PostForm />
    </>
  );
}
