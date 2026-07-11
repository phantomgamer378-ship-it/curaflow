import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`brand${inverse ? " brand-inverse" : ""}`} href="/" aria-label="CuraFlow home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      <span>CuraFlow</span>
    </Link>
  );
}
