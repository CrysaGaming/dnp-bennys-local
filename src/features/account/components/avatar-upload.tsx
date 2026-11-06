"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { initialsOf } from "@/lib/initials";
import { removeAvatarAction, uploadAvatarAction } from "../actions";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Avatar-Upload (Spec 8): nur PNG, JPG oder WebP, max. 2 MB, der echte Typ steht in
 * den Magic Bytes. Der Dateiname wird nie übernommen – es ist eine Zufalls-ID.
 */
export function AvatarUpload({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault();

    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Bitte eine Bilddatei auswählen.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Nur PNG, JPG oder WebP.");
      return;
    }

    if (file.size > MAX_BYTES) {
      toast.error("Das Bild ist größer als 2 MB.");
      return;
    }

    setBusy(true);

    const form = new FormData();
    form.set("datei", file);

    const res = await uploadAvatarAction(form);
    setBusy(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    if (inputRef.current) inputRef.current.value = "";
    toast("Avatar gespeichert.");
  }

  async function remove() {
    setBusy(true);

    const res = await removeAvatarAction();
    setBusy(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast("Avatar entfernt.");
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={upload}>
      <div className="flex items-center gap-4">
        <Avatar className="size-20">
          {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
          <AvatarFallback>{initialsOf(name)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <Label htmlFor="datei">Bild (PNG, JPG oder WebP, max. 2 MB)</Label>
          <input
            id="datei"
            name="datei"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            ref={inputRef}
            className="text-sm"
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              <Upload aria-hidden />
              Hochladen
            </Button>
            <Button type="button" variant="ghost" disabled={busy || !imageUrl} onClick={remove}>
              <Trash2 aria-hidden />
              Entfernen
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
