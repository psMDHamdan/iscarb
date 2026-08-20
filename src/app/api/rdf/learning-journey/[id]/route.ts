import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("LearningJourney", async (id) => {
  return (db as any).learningJourney.findUnique({
    where: { id },
  });
});
