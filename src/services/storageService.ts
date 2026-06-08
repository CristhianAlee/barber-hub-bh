import { supabase } from "@/lib/supabase";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

const BUCKET = "logos";
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const storageService = {
  async uploadLogo(
    barbershopId: string,
    file: File,
  ): Promise<ServiceResult<string>> {
    try {
      if (file.size > MAX_SIZE) throw new Error("Imagem deve ter no máximo 2MB");
      if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Formato inválido. Use JPG, PNG ou WebP");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${barbershopId}/logo.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      // Bust cache with timestamp
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from("barbershops")
        .update({ logo_url: data.publicUrl })
        .eq("id", barbershopId);
      if (updateErr) throw updateErr;

      return { data: publicUrl, error: null };
    } catch (err) {
      console.error("[storageService.uploadLogo]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async deleteLogo(barbershopId: string, currentLogoUrl: string): Promise<ServiceResult<null>> {
    try {
      const url = new URL(currentLogoUrl);
      const pathParts = url.pathname.split(`/${BUCKET}/`);
      if (pathParts.length < 2) throw new Error("URL de logo inválida");
      const storagePath = pathParts[1].split("?")[0];

      const { error: removeErr } = await supabase.storage.from(BUCKET).remove([storagePath]);
      if (removeErr) throw removeErr;

      const { error: updateErr } = await supabase
        .from("barbershops")
        .update({ logo_url: null })
        .eq("id", barbershopId);
      if (updateErr) throw updateErr;

      return { data: null, error: null };
    } catch (err) {
      console.error("[storageService.deleteLogo]", err);
      return { data: null, error: errMsg(err) };
    }
  },
};
