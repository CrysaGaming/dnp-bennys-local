import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initialsOf } from "@/lib/initials";
import { formatDuration } from "@/lib/format";
import type { EmployeeRow } from "../service";

/** Mitarbeiterliste (Spec 5.6). */
export function EmployeeTable({ employees }: { employees: EmployeeRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mitarbeiter</TableHead>
          <TableHead>Rang</TableHead>
          <TableHead>Dienstnummer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Stunden (Woche)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((e) => (
          <TableRow key={e.id}>
            <TableCell>
              <Link href={`/mitarbeiter/${e.id}`} className="flex items-center gap-2">
                <Avatar className="size-8">
                  {e.image ? <AvatarImage src={e.image} alt={e.name} /> : null}
                  <AvatarFallback>{initialsOf(e.name)}</AvatarFallback>
                </Avatar>
                <span>{e.name}</span>
              </Link>
            </TableCell>
            <TableCell>
              <Badge style={{ backgroundColor: e.rank.color, color: "white" }}>{e.rank.name}</Badge>
            </TableCell>
            <TableCell className="font-mono tabular-nums">{e.serviceNumber}</TableCell>
            <TableCell>{statusLabel(e.status)}</TableCell>
            <TableCell className="font-mono tabular-nums">{formatDuration(e.minutesThisWeek)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function statusLabel(status: EmployeeRow["status"]): string {
  if (status === "ACTIVE") return "Aktiv";
  if (status === "ON_LEAVE") return "Im Urlaub";
  return "Terminiert";
}
