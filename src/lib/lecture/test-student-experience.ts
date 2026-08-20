import { runAllGates } from "./quality/gate-runner";

export async function testStudentExperience(projectId: string) {
  console.log(`Running Student Experience Validation for project ${projectId}...`);
  const results = await runAllGates(projectId);
  const studentGate = results.find(r => r.gateKey === "student_experience");
  
  if (studentGate && studentGate.status === "pass") {
    console.log("✅ ACCEPTANCE TEST PASSED: CPIT255 Student Deck Experience verified.");
    console.log("Deliverables met:");
    console.log("- Progress bars present on S2-S20");
    console.log("- Action-first prompts on S3-S19");
    console.log("- Max 40 words, max 5 bullets enforced");
    console.log("- Interaction blocks (Pause & Discuss, Polls, Collaborate) generated");
    console.log("- S20 Readiness Gate Present");
    return true;
  } else {
    console.error("❌ ACCEPTANCE TEST FAILED:");
    console.error(studentGate?.findings);
    return false;
  }
}
