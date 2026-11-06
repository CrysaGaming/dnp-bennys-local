"use client";

import Link from "next/link";
import { ChevronDown, Settings, User } from "lucide-react";
import { cn } from "cn";
import { initialsOf } from "@/lib/initials";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** User-Menü (Spec 5.2): Avatar in der Rang-Farbe, Profil, Settings, Logout. */
export function UserMenu({
  name,
  rankName,
  rankColor,
  image,
}: {
  name: string;
  rankName: string;
  rankColor: string;
  image: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
        <Avatar className="size-8" style={{ boxShadow: `0 0 0 1.5px ${rankColor}` }}>
          {image && <AvatarImage src={image} alt={name} />}
          <AvatarFallback>{initialsOf(name)}</AvatarFallback>
        </Avatar>
        <span className="hidden flex-col gap-0.5 text-left sm:flex">
          <span className="text-sm leading-none font-medium">{name}</span>
          <span className="text-xs leading-none text-muted-foreground">{rankName}</span>
        </span>
        <ChevronDown aria-hidden className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href="/profil" />}>
          <User aria-hidden className="size-4" />
          Mein Profil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings aria-hidden className="size-4" />
          Meine Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <LogoutButton
          variant="ghost"
          className={cn("w-full justify-start text-destructive")}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
