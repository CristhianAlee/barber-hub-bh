import { useLanguage } from "@/hooks/useLanguage";

// Logo servida de public/ (URL-safe). Trocar o arquivo em public/ atualiza tudo.
const logo = "/trato-barber-logo.png";

export function Logo({
  size = 40,
  showWordmark = false,
  className = "",
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  if (showWordmark) {
    return (
      <img
        src={logo}
        alt={t("logo_alt")}
        className={className}
        style={{ height: size, width: "auto" }}
      />
    );
  }
  return (
    <img
      src={logo}
      alt="Trato Barber"
      className={`object-contain ${className}`}
      style={{ height: size, width: size }}
    />
  );
}
