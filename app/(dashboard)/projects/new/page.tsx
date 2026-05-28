import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CreateProjectForm } from "@/components/generation/create-project-form";

export const metadata: Metadata = { title: "Новый ролик" };

export default function NewProjectPage() {
  return (
    <div>
      <PageHeader
        title="Новый ролик"
        description="Загрузите изображение продукта и опишите идею — AI сделает остальное."
      />
      <CreateProjectForm />
    </div>
  );
}
