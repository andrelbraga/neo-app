import { API_BASE_URL } from "@/app/providers/api/client";

/** Endereço de uma foto servida pela API (ADR-0029), como a do corretor; vazio sem foto. */
export function mediaUrl(path: string | undefined): string {
  return path ? `${API_BASE_URL}${path}` : "";
}

/**
 * Reduz a foto no navegador antes de enviar (lado maior até `maxSide`, JPEG). Se o navegador não consegue ler o
 * arquivo, devolve o original: a API confere se é imagem.
 */
export async function shrinkImage(file: Blob, maxSide: number): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((ok) => canvas.toBlob((b) => ok(b ?? file), "image/jpeg", 0.85));
  } catch {
    return file;
  }
}
