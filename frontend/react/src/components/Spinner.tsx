/* -----------------------------------------------------------------------
 * Spinner — full-page centered loading indicator.
 * ----------------------------------------------------------------------- */

import { Loader2 } from "lucide-react";

export default function Spinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand" />
    </div>
  );
}
