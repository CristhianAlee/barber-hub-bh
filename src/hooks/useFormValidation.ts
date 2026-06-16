import { useState } from "react";
import { z } from "zod";

/**
 * Hook leve de validação com Zod, mantendo o padrão de state do projeto
 * (sem react-hook-form). Retorna erros por campo e funções utilitárias.
 */
export function useFormValidation<T extends z.ZodTypeAny>(schema: T) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (data: unknown): data is z.infer<T> => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path.join(".");
        if (field) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const clearErrors = () => setErrors({});
  const clearError = (field: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  return { errors, validate, clearErrors, clearError };
}
