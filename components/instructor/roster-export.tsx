"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export type RosterRow = {
  name: string;
  username: string;
  enrolledAt: string;
};

/** Client-side CSV export of a class roster (Studio plan S2.6). */
export function RosterExport({
  rows,
  filename,
}: {
  rows: RosterRow[];
  filename: string;
}) {
  const download = () => {
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const header = "Name,Username,Enrolled\n";
    const body = rows
      .map((r) => [r.name, r.username, r.enrolledAt].map(esc).join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={download} disabled={rows.length === 0}>
      <Download className="w-4 h-4 mr-1" />
      Export CSV
    </Button>
  );
}
