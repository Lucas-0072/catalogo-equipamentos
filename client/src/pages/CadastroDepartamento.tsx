import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { UserPlus, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const PROCYTEK_LOGO = "/manus-storage/procytek-logo_bf3a0e53.png";

export default function CadastroDepartamento() {
  const [, setLocation] = useLocation();
  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const createDepartamentoMutation = trpc.departamentos.create.useMutation();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    // Validações
    if (!nome.trim()) {
      setErro("Digite o nome do departamento");
      return;
    }

    if (!login.trim()) {
      setErro("Digite um login");
      return;
    }

    if (login.length < 3) {
      setErro("Login deve ter pelo menos 3 caracteres");
      return;
    }

    if (!senha.trim()) {
      setErro("Digite uma senha");
      return;
    }

    if (senha.length < 6) {
      setErro("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      await createDepartamentoMutation.mutateAsync({
        nome,
        login,
        senha,
      });
      
      setSucesso(true);
      toast.success("Departamento cadastrado com sucesso!");
      
      setTimeout(() => {
        setLocation("/login-departamento");
      }, 2000);
    } catch (err: any) {
      const mensagem = err?.message || "Erro ao cadastrar departamento";
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "oklch(0.10 0 0)" }}
      >
        <div className="w-full max-w-md">
          <div className="rounded-2xl border p-8 text-center space-y-4" style={{
            background: "oklch(0.12 0 0)",
            borderColor: "oklch(0.22 0 0)",
          }}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
                background: "oklch(0.55 0.15 140 / 0.20)",
              }}>
                <UserPlus size={32} style={{ color: "oklch(0.55 0.15 140)" }} />
              </div>
            </div>
            <h2 className="text-xl font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>
              Cadastro Realizado!
            </h2>
            <p style={{ color: "oklch(0.55 0 0)" }}>
              Seu departamento foi cadastrado com sucesso. Você será redirecionado para o login em breve.
            </p>
            <button
              onClick={() => setLocation("/login-departamento")}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: "oklch(0.85 0.18 95)",
                color: "oklch(0.08 0 0)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.70 0.18 95)")}
              onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              Cadastro de Departamento
            </h1>
            <p className="text-sm mt-1" style={{ color: "oklch(0.55 0 0)" }}>
              Crie uma nova conta
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleCadastro}
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

          {/* Nome */}
          <div>
            <label
              className="text-xs font-semibold block mb-2"
              style={{ color: "oklch(0.55 0 0)", textTransform: "uppercase" }}
            >
              Nome do Departamento
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Gestão, Almoxarifado"
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

          {/* Login */}
          <div>
            <label
              className="text-xs font-semibold block mb-2"
              style={{ color: "oklch(0.55 0 0)", textTransform: "uppercase" }}
            >
              Login
            </label>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Mínimo 3 caracteres"
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
              placeholder="Mínimo 6 caracteres"
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
            disabled={loading || !nome.trim() || !login.trim() || !senha.trim()}
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
                Cadastrando...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Cadastrar
              </>
            )}
          </button>
        </form>

        {/* Link para login */}
        <button
          onClick={() => setLocation("/login-departamento")}
          className="w-full mt-6 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          style={{
            background: "oklch(0.18 0 0)",
            border: "1px solid oklch(0.28 0 0)",
            color: "oklch(0.65 0 0)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)";
            e.currentTarget.style.color = "oklch(0.85 0.18 95)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "oklch(0.28 0 0)";
            e.currentTarget.style.color = "oklch(0.65 0 0)";
          }}
        >
          <ArrowLeft size={16} />
          Voltar para Login
        </button>

        {/* Informação */}
        <p className="text-center text-xs mt-4" style={{ color: "oklch(0.45 0 0)" }}>
          Preencha todos os campos para criar seu departamento
        </p>
      </div>
    </div>
  );
}
