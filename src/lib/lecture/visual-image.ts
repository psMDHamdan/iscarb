/**
 * Slide visual image resolution — faculty upload always wins.
 */
export type VisualImageSource = {
  facultyUploadedUrl?: string | null;
  fetchedImageUrl?: string | null;
  imageUrl?: string | null;
};

/** Priority: facultyUploadedUrl → fetchedImageUrl → imageUrl → fallback. */
export function resolveSlideImageUrl(
  visualSpec: VisualImageSource | null | undefined,
  fallbackUrl?: string | null
): string {
  const faculty = (visualSpec?.facultyUploadedUrl || "").trim();
  if (faculty) return faculty;
  const fetched = (visualSpec?.fetchedImageUrl || "").trim();
  if (fetched) return fetched;
  const image = (visualSpec?.imageUrl || "").trim();
  if (image) return image;
  return (fallbackUrl || "").trim();
}

export function hasFacultyUploadedImage(
  visualSpec: VisualImageSource | null | undefined
): boolean {
  return Boolean((visualSpec?.facultyUploadedUrl || "").trim());
}

/** Fields to preserve across auto-regen so faculty overrides survive. */
export function extractFacultyImageOverride(
  visualSpec: Record<string, unknown> | null | undefined
): {
  facultyUploadedUrl?: string;
  facultyUploadedStorageKey?: string;
  facultyUploadedAt?: string;
  facultyUploadedOriginalName?: string;
} | null {
  if (!visualSpec) return null;
  const url = typeof visualSpec.facultyUploadedUrl === "string"
    ? visualSpec.facultyUploadedUrl.trim()
    : "";
  if (!url) return null;
  return {
    facultyUploadedUrl: url,
    facultyUploadedStorageKey:
      typeof visualSpec.facultyUploadedStorageKey === "string"
        ? visualSpec.facultyUploadedStorageKey
        : undefined,
    facultyUploadedAt:
      typeof visualSpec.facultyUploadedAt === "string"
        ? visualSpec.facultyUploadedAt
        : undefined,
    facultyUploadedOriginalName:
      typeof visualSpec.facultyUploadedOriginalName === "string"
        ? visualSpec.facultyUploadedOriginalName
        : undefined,
  };
}
