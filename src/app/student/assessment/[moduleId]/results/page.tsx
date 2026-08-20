import { AssessmentModuleResultView } from "@/components/views/AssessmentModuleResultView";

export default async function AssessmentModuleResultPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const resolvedParams = await params;
  return <AssessmentModuleResultView moduleId={resolvedParams.moduleId} />;
}
