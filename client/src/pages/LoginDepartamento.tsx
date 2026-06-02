import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PROCYTEK_LOGO = "/manus-storage/procytek-logo_bf3a0e53.png";

const DEPARTAMENTOS = [
  { id: "gestao", nome: "Gestão", senha: "senha123" },
  { id: "almoxarifado", nome: "Almoxarifado", senha: "senha456" },
];

export default function LoginDepartamento() {
  const [, setLocation] = useLocation();
  const [departamentoId, setDepartamentoId] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const loginMutation = trpc.auth.loginDepartamento.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    
    if (!departamentoId) {
      setErro("Selecione um departamento");
      return;
    }

    setLoading(true);

    try {
      await loginMutation.mutateAsync({ login: departamentoId, senha });
      toast.success("Login realizado com sucesso!");
      setTimeout(() => setLocation("/"), 500);
    } catch (err: any) {
      const mensagem = err?.message || "Erro ao fazer login";
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "oklch(0.10 0 0)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo e título */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <img
            src={PROCYTEK_LOGO}
            alt="Procytek"
            className="h-16 w-16 rounded-lg object-cover"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>
              Catálogo de Equipamentos
            </h1>
            <p className="text-sm mt-1" style={{ color: "oklch(0.55 0 0)" }}>
              Login por Departamento
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleLogin}
          className="rounded-2xl border p-6 space-y-4"
          style={{
            background: "oklch(0.12 0 0)",
            borderColor: "oklch(0.22 0 0)",
          }}
        >
          {/* Erro */}
          {erro && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: "oklch(0.45 0.15 25 / 0.15)",
                border: "1px solid oklch(0.55 0.18 15 / 0.40)",
              }}
            >
              <AlertCircle size={16} style={{ color: "oklch(0.70 0.18 15)" }} />
              <p className="text-sm" style={{ color: "oklch(0.70 0.18 15)" }}>
                {erro}
              </p>
            </div>
          )}

          {/* Departamento */}
          <div>
            <label
              className="text-xs font-semibold block mb-2"
              style={{ color: "oklch(0.55 0 0)", textTransform: "uppercase" }}
            >
              Departamento
            </label>
            <select
              value={departamentoId}
              onChange={e => setDepartamentoId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
              style={{
                background: "oklch(0.18 0 0)",
                border: "1px solid oklch(0.28 0 0)",
                color: "oklch(0.90 0 0)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
              onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
            >
              <option value="">— Selecione um departamento —</option>
              {DEPARTAMENTOS.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Senha */}
          <div>
            <label
              className="text-xs font-semibold block mb-2"
              style={{ color: "oklch(0.55 0 0)", textTransform: "uppercase" }}
            >
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
              style={{
                background: "oklch(0.18 0 0)",
                border: "1px solid oklch(0.28 0 0)",
                color: "oklch(0.90 0 0)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
              onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
            />
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || !departamentoId || !senha.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "oklch(0.85 0.18 95)",
              color: "oklch(0.08 0 0)",
            }}
            onMouseEnter={e => {
              if (!loading) (e.currentTarget.style.background = "oklch(0.70 0.18 95)");
            }}
            onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Informação */}
        <p className="text-center text-xs mt-6" style={{ color: "oklch(0.45 0 0)" }}>
          Acesso exclusivo para departamentos autorizados
        </p>
      </div>
    </div>
  );
}
