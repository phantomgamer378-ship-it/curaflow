import Link from "next/link";

export default function NotFound() {
  return (
    <main className="centered-page">
      <span className="eyebrow">404</span>
      <h1>That page stepped out.</h1>
      <p>The care you need is still close by.</p>
      <Link className="button button-primary" href="/">Back to CuraFlow</Link>
    </main>
  );
}
