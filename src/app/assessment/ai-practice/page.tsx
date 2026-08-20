import { AIPracticeView } from "@/components/views/AIPracticeView";

// Client-interactive page: skip static prerender (avoids the Next 16
// _global-error/useContext prerender crash on this route).
export const dynamic = "force-dynamic";

export default function AIPracticePage() {
  return <AIPracticeView />;
}
