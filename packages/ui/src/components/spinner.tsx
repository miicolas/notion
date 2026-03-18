import { RiLoaderLine } from "@remixicon/react";
import { cn } from "@workspace/ui/lib/utils";
import type { RemixiconComponentType } from "@remixicon/react";

function Spinner({
  className,
  ...props
}: Omit<React.ComponentProps<RemixiconComponentType>, "children">) {
  return (
    <RiLoaderLine
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
