import Link from "next/link";
import { Factory, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { FactoryCard } from "@/components/factory/factory-card";
import { listUserFactories } from "@/lib/db/factory-queries";

export const dynamic = "force-dynamic";

export default async function FactoryListPage() {
  const session = await auth();
  const factories = await listUserFactories(session!.user.id);

  return (
    <div>
      <PageHeader
        title="Content Factory"
        description="AI собирает целую неделю reels-контента — концепции, hooks, scripts. Вы утверждаете план, дальше всё едет автоматически."
        actions={
          <Button asChild variant="accent" size="lg">
            <Link href="/factory/new">
              <Sparkles className="size-4" />
              Новая фабрика
            </Link>
          </Button>
        }
      />

      {factories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface/40 p-12 text-center">
          <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-border-strong">
            <Factory className="size-5 text-foreground/80" />
          </div>
          <h2 className="mt-4 text-base font-medium">
            Ваша первая Content Factory
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Опишите продукт и нишу — AI соберёт стратегию недели и
            подготовит 3–14 готовых сценариев.
          </p>
          <Button asChild variant="accent" className="mt-5">
            <Link href="/factory/new">
              <Sparkles className="size-4" />
              Создать фабрику
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {factories.map((f) => (
            <FactoryCard key={f.id} factory={f} />
          ))}
        </div>
      )}
    </div>
  );
}
