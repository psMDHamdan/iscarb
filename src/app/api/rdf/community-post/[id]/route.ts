import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("CommunityPost", async (id) => {
  return (db as any).communityPost.findUnique({
    where: { id },
  });
});
