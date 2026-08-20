import { ActiveAssessmentView } from "@/components/views/ActiveAssessmentView";

export default async function AssessmentModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const resolvedParams = await params;
  return <ActiveAssessmentView moduleId={resolvedParams.moduleId} />;
}
