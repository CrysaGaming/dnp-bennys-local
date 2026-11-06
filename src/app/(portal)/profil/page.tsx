import { Suspense } from "react";
import { requireSession } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarUpload } from "@/features/account/components/avatar-upload";
import { ProfileForm } from "@/features/account/components/profile-form";
import { getProfile } from "@/features/account/service";
import { minutesThisWeek } from "@/features/time/service";
import { weekStartBerlin } from "@/features/time/calc";
import { formatDuration } from "@/lib/format";

async function Content() {
  const ctx = await requireSession();
  const profile = await getProfile(ctx);
  const minutes = await minutesThisWeek(ctx, ctx.employeeId, weekStartBerlin(new Date()));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mein Profil"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mein Profil" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase">Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload name={ctx.name} imageUrl={ctx.image} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase">Angaben</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm name={profile.name} phone={profile.phone} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase">Stunden dieser Woche</CardTitle>
        </CardHeader>
        <CardContent className="font-mono tabular-nums">{formatDuration(minutes)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg uppercase">Rang</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Badge style={{ backgroundColor: ctx.rank.color }}>{ctx.rank.name}</Badge>
          <span className="text-sm text-muted-foreground">nur lesbar</span>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilPage() {
  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <Content />
    </Suspense>
  );
}
