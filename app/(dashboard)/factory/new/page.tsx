import { PageHeader } from "@/components/layout/page-header";
import { CreateFactoryForm } from "@/components/factory/create-factory-form";

export const dynamic = "force-dynamic";

export default function NewFactoryPage() {
  return (
    <div>
      <PageHeader
        title="Новая Content Factory"
        description="Расскажите AI о продукте и нише — на выходе получите готовую недельную стратегию reels."
      />
      <CreateFactoryForm />
    </div>
  );
}
