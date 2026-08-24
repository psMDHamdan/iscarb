/**
 * For HTML/PDF exports: embed faculty-uploaded slide images as data URIs
 * so offline exports still show the faculty override (never store base64 in DB).
 */
import { getLectureFile } from "./storage";

type ArtifactLike = {
  slideNo: number;
  contentJson: unknown;
};

export async function embedFacultyImagesForExport<T extends ArtifactLike>(
  artifacts: T[]
): Promise<T[]> {
  return Promise.all(
    artifacts.map(async (artifact) => {
      const content = (artifact.contentJson || {}) as Record<string, any>;
      const spec = content.visualSpec || {};
      const key = typeof spec.facultyUploadedStorageKey === "string"
        ? spec.facultyUploadedStorageKey
        : "";
      if (!key) return artifact;

      try {
        const buf = await getLectureFile(key);
        const lower = key.toLowerCase();
        const mime = lower.endsWith(".png")
          ? "image/png"
          : lower.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg";
        const dataUri = `data:${mime};base64,${buf.toString("base64")}`;
        return {
          ...artifact,
          contentJson: {
            ...content,
            visualSpec: {
              ...spec,
              facultyUploadedUrl: dataUri,
            },
          },
        };
      } catch {
        return artifact;
      }
    })
  );
}
