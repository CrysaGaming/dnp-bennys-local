"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/**
 * Der Navigationsteil der Sidebar. Er bekommt die Gruppen als Elemente (keine Funktionen),
 * weil ein Server-Component keine Funktionen an ein Client-Component weitergeben kann.
 */
export type SidebarNavItem = { title: string; href: string; icon: React.ReactElement };
export type SidebarNavGroup = { title: string; items: SidebarNavItem[] };

/** Der 3-px-Sunset-Balken am aktiven Eintrag (Spec 5.3), gleitet per `layoutId`. */
function ActiveBar() {
  const reduced = useReducedMotion();
  const bar = cn("absolute inset-y-0 left-0 w-[3px] rounded-r bg-sunset");

  if (reduced) return <span aria-hidden className={bar} />;

  return <motion.span aria-hidden layoutId="nav-active" className={bar} />;
}

export function SidebarNav({ groups }: { groups: SidebarNavGroup[] }) {
  const pathname = usePathname();

  return (
    <SidebarContent>
      {groups.map((group) => (
        <SidebarGroup key={group.title}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const active = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    {active && <ActiveBar />}
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={active} tooltip={item.title}>
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}
