import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogIn, AlertCircle, Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";

const PROCYTEK_LOGO = "/manus-storage/procytek-logo_bf3a0e53.png";

export default function LoginDepartamento() {
  const [, setLocation] = useLocation();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLogin, setForgotLogin] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const loginMutation = trpc.auth.loginDepartamento.useMutation();
  const requestPasswordResetMutation = trpc.auth.requestPasswordReset.useMutation();

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
              onClick={() => setShowForgotPassword(true)}
              className="font-semibold hover:underline"
              style={{ color: "oklch(0.85 0.18 95)" }}
            >
              Recuperar
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

      {/* Modal de recuperação de senha */}
      {showForgotPassword && (
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
              <Mail size={20} />
              Recuperar Senha
            </h2>

            {forgotSuccess ? (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "oklch(0.55 0 0)" }}>
                  Um link de recuperação foi enviado para seu email. Verifique sua caixa de entrada.
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSuccess(false);
                    setForgotLogin("");
                    setForgotEmail("");
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  setForgotError("");

                  if (!forgotLogin || !forgotEmail) {
                    setForgotError("Preencha o login e email");
                    return;
                  }

                  try {
                    await requestPasswordResetMutation.mutateAsync({
                      login: forgotLogin,
                      email: forgotEmail,
                    });
                    setForgotSuccess(true);
                  } catch (err) {
                    setForgotError(
                      err instanceof Error ? err.message : "Erro ao solicitar recuperação"
                    );
                  }
                }}
                className="space-y-4"
              >
                {forgotError && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: "oklch(0.45 0.15 25 / 0.15)",
                      border: "1px solid oklch(0.55 0.18 15 / 0.40)",
                    }}
                  >
                    <AlertCircle size={16} style={{ color: "oklch(0.70 0.18 15)" }} />
                    <p className="text-sm" style={{ color: "oklch(0.70 0.18 15)" }}>
                      {forgotError}
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
                    value={forgotLogin}
                    onChange={(e) => setForgotLogin(e.target.value)}
                    disabled={requestPasswordResetMutation.isPending}
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
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={requestPasswordResetMutation.isPending}
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
                    onClick={() => setShowForgotPassword(false)}
                    disabled={requestPasswordResetMutation.isPending}
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
                    disabled={requestPasswordResetMutation.isPending}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{
                      background: "oklch(0.85 0.18 95)",
                      color: "oklch(0.08 0 0)",
                    }}
                  >
                    {requestPasswordResetMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar"
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
