import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogIn, AlertCircle, Loader2, UserPlus, Key } from "lucide-react";
import { toast } from "sonner";

const PROCYTEK_LOGO = "/manus-storage/procytek-logo_bf3a0e53.png";

export default function LoginDepartamento() {
  const [, setLocation] = useLocation();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLogin, setResetLogin] = useState("");
  const [resetSenha, setResetSenha] = useState("");
  const [resetConfirmSenha, setResetConfirmSenha] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const loginMutation = trpc.auth.loginDepartamento.useMutation();
  const resetPasswordMutation = trpc.departamentos.resetPasswordDirect.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    
    if (!login.trim()) {
      setErro("Digite o login do departamento");
      return;
    }

    if (!senha.trim()) {
      setErro("Digite sua senha");
      return;
    }

    setLoading(true);

    try {
      await loginMutation.mutateAsync({ login, senha });
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (!resetLogin.trim()) {
      setResetError("Digite o login do departamento");
      return;
    }

    if (!resetSenha.trim()) {
      setResetError("Digite a nova senha");
      return;
    }

    if (resetSenha.length < 6) {
      setResetError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (resetSenha !== resetConfirmSenha) {
      setResetError("As senhas não conferem");
      return;
    }

    setResetLoading(true);

    try {
      await resetPasswordMutation.mutateAsync({
        login: resetLogin,
        novaSenha: resetSenha,
      });
      setResetSuccess(true);
      toast.success("Senha redefinida com sucesso!");
      
      setTimeout(() => {
        setShowResetPassword(false);
        setResetSuccess(false);
        setResetLogin("");
        setResetSenha("");
        setResetConfirmSenha("");
      }, 2000);
    } catch (err: any) {
      const mensagem = err?.message || "Erro ao redefinir senha";
      setResetError(mensagem);
      toast.error(mensagem);
    } finally {
      setResetLoading(false);
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
              Login de Departamento
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
              placeholder="Digite seu login"
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
            disabled={loading || !login.trim() || !senha.trim()}
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

        {/* Links */}
        <div className="space-y-2 mt-6">
          <p className="text-center text-xs" style={{ color: "oklch(0.45 0 0)" }}>
            Esqueceu sua senha?{" "}
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="font-semibold hover:underline"
              style={{ color: "oklch(0.85 0.18 95)" }}
            >
              Redefinir
            </button>
          </p>

          <p className="text-center text-xs" style={{ color: "oklch(0.45 0 0)" }}>
            Novo departamento?{" "}
            <button
              type="button"
              onClick={() => setLocation("/cadastro-departamento")}
              className="font-semibold hover:underline flex items-center justify-center gap-1"
              style={{ color: "oklch(0.55 0.15 140)" }}
            >
              <UserPlus size={14} />
              Cadastrar
            </button>
          </p>
        </div>

        {/* Informação */}
        <p className="text-center text-xs mt-4" style={{ color: "oklch(0.45 0 0)" }}>
          Acesso exclusivo para departamentos autorizados
        </p>
      </div>

      {/* Modal de redefinição de senha */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className="w-full max-w-md rounded-2xl border p-6"
            style={{
              background: "oklch(0.12 0 0)",
              borderColor: "oklch(0.22 0 0)",
            }}
          >
            <h2
              className="text-lg font-bold mb-4 flex items-center gap-2"
              style={{ color: "oklch(0.85 0.18 95)" }}
            >
              <Key size={20} />
              Redefinir Senha
            </h2>

            {resetSuccess ? (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "oklch(0.55 0 0)" }}>
                  Sua senha foi redefinida com sucesso! Você será redirecionado para o login.
                </p>
                <button
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetSuccess(false);
                    setResetLogin("");
                    setResetSenha("");
                    setResetConfirmSenha("");
                  }}
                  className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: "oklch(0.85 0.18 95)",
                    color: "oklch(0.08 0 0)",
                  }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                {resetError && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: "oklch(0.45 0.15 25 / 0.15)",
                      border: "1px solid oklch(0.55 0.18 15 / 0.40)",
                    }}
                  >
                    <AlertCircle size={16} style={{ color: "oklch(0.70 0.18 15)" }} />
                    <p className="text-sm" style={{ color: "oklch(0.70 0.18 15)" }}>
                      {resetError}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    className="text-xs font-semibold block mb-2"
                    style={{ color: "oklch(0.55 0 0)", textTransform: "uppercase" }}
                  >
                    Login
                  </label>
                  <input
                    type="text"
                    placeholder="Digite seu login"
                    value={resetLogin}
                    onChange={(e) => setResetLogin(e.target.value)}
                    disabled={resetLoading}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                    style={{
                      background: "oklch(0.18 0 0)",
                      border: "1px solid oklch(0.28 0 0)",
                      color: "oklch(0.90 0 0)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="text-xs font-semibold block mb-2"
                    style={{ color: "oklch(0.55 0 0)", textTransform: "uppercase" }}
                  >
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={resetSenha}
                    onChange={(e) => setResetSenha(e.target.value)}
                    disabled={resetLoading}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                    style={{
                      background: "oklch(0.18 0 0)",
                      border: "1px solid oklch(0.28 0 0)",
                      color: "oklch(0.90 0 0)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="text-xs font-semibold block mb-2"
                    style={{ color: "oklch(0.55 0 0)", textTransform: "uppercase" }}
                  >
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    placeholder="Confirme a nova senha"
                    value={resetConfirmSenha}
                    onChange={(e) => setResetConfirmSenha(e.target.value)}
                    disabled={resetLoading}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                    style={{
                      background: "oklch(0.18 0 0)",
                      border: "1px solid oklch(0.28 0 0)",
                      color: "oklch(0.90 0 0)",
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(false)}
                    disabled={resetLoading}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                    style={{
                      background: "oklch(0.22 0 0)",
                      color: "oklch(0.85 0 0)",
                      border: "1px solid oklch(0.28 0 0)",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{
                      background: "oklch(0.85 0.18 95)",
                      color: "oklch(0.08 0 0)",
                    }}
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Redefinindo...
                      </>
                    ) : (
                      "Redefinir"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
