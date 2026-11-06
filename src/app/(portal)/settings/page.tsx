import { Suspense } from "react";
import { requireSession } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/features/account/components/change-password-form";
import { MusicPreferencesForm } from "@/features/account/components/music-preferences-form";
import { PreferencesForm } from "@/features/account/components/preferences-form";
import { SessionList } from "@/features/account/components/session-list";
import { getMusicPreference, getPreferences } from "@/features/account/service";

type Props = { searchParams: Promise<{ pw?: string }> };

async function Content({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = await requireSession({ allowMustChangePassword: true });
  const prefs = await getPreferences(ctx);
  const music = await getMusicPreference(ctx);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Einstellungen"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Einstellungen" }]}
      />

      {params.pw === "1" ? (
        <p className="text-primary-ink">Bitte vergib ein neues Passwort.</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase">Passwort</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase">Aussehen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {ctx.name} · Rang {ctx.rank.name}
          </p>
          <PreferencesForm theme={prefs.theme} reducedMotion={prefs.reducedMotion} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase">Musik</CardTitle>
        </CardHeader>
        <CardContent>
          <MusicPreferencesForm initial={music} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase">Aktive Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionList />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
