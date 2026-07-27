"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the browser print dialog — "download as PDF" without any PDF machinery. */
export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <Printer className="mr-1.5 h-4 w-4" /> Print / Save as PDF
    </Button>
  );
}
