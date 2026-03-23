import { redirect } from "next/navigation";

export default function EditCourseAliasPage({
  params
}: {
  params: { id: string };
}) {
  const { id } = params;
  redirect(`/cursos/cadastro?mode=edit&id=${id}`);
}
