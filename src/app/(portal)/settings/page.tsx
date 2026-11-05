import { Suspense } from "react";
import { requireSession } from "@/lib/dal";
import { ChangePasswordForm } from "@/features/account/components/change-password-form";

type Props = { searchParams: Promise<{ pw?: string }> };

async function Content({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = await requireSession({ allowMustChangePassword: true });

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl uppercase">Einstellungen</h1>

      {params.pw === "1" ? (
        <p className="mt-4 text-primary-ink">Bitte vergib ein neues Passwort.</p>
      ) : null}

      <p className="mt-2 text-sm text-muted-foreground">
        {ctx.name} · Rang {ctx.rank.name}
      </p>

      <div className="mt-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}

export default function SettingsPage(props: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content {...props} />
    </Suspense>
  );
}
