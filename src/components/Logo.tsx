import logo from "@/assets/barberhub-logo.png";

export function Logo({
  size = 40,
  showWordmark = false,
  className = "",
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  if (showWordmark) {
    return (
      <img
        src={logo}
        alt="BarberHub — Gestão Inteligente para Barbearias"
        className={className}
        style={{ height: size, width: "auto" }}
      />
    );
  }
  // Just the BH icon area cropped from the full logo (use as-is, scaled)
  return (
    <img
      src={logo}
      alt="BarberHub"
      className={`object-contain ${className}`}
      style={{ height: size, width: size }}
    />
  );
}
