import { Link } from "wouter";
import Header from "../components/Header";

export default function NotFound() {
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0 0)" }}>
      <Header />
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <h1 className="text-6xl font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>404</h1>
        <p className="text-lg" style={{ color: "oklch(0.65 0 0)" }}>Página não encontrada</p>
        <Link href="/" className="px-5 py-2 rounded-lg text-sm font-semibold no-underline"
          style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}>
          Voltar ao catálogo
        </Link>
      </div>
    </div>
  );
}
