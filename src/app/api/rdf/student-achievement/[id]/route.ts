import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("StudentAchievement", async (id) => {
  return (db as any).studentAchievement.findUnique({
    where: { id },
  });
});
