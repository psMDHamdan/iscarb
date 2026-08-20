import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("StudentGoal", async (id) => {
  return (db as any).studentGoal.findUnique({
    where: { id },
  });
});
