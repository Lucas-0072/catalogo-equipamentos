import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [departamentoInfo, setDepartamentoInfo] = useState<{ id: number; nome: string } | null>(null);

  const validateTokenMutation = trpc.auth.validateResetToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    if (validateTokenMutation.data) {
      if (validateTokenMutation.data.valid) {
        setTokenValid(true);
        if (validateTokenMutation.data.departamento) {
        setDepartamentoInfo(validateTokenMutation.data.departamento);
      }
      } else {
        setError(validateTokenMutation.data.message || "Token inválido ou expirado");
      }
      setIsValidating(false);
    }

    if (validateTokenMutation.error) {
      setError("Erro ao validar token");
      setIsValidating(false);
    }
  }, [validateTokenMutation.data, validateTokenMutation.error]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token não fornecido");
      return;
    }

    if (!novaSenha || !confirmarSenha) {
      setError("Preencha todos os campos");
      return;
    }

    if (novaSenha.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não conferem");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        novaSenha,
      });

      setSuccess(true);
      setNovaSenha("");
      setConfirmarSenha("");

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate("/login-departamento");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h1 className="text-xl font-bold">Token não fornecido</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Verifique o link de recuperação de senha enviado para seu email.
          </p>
          <Button onClick={() => navigate("/login-departamento")} className="w-full">
            Voltar para Login
          </Button>
        </Card>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Validando token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h1 className="text-xl font-bold">Token Inválido</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {error || "O link de recuperação de senha expirou ou é inválido."}
          </p>
          <Button onClick={() => navigate("/login-departamento")} className="w-full">
            Voltar para Login
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h1 className="text-xl font-bold">Senha Redefinida!</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Sua senha foi redefinida com sucesso. Você será redirecionado para a tela de login em alguns segundos.
          </p>
          <Button onClick={() => navigate("/login-departamento")} className="w-full">
            Ir para Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-2">Redefinir Senha</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Departamento: <strong>{departamentoInfo?.nome}</strong>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nova Senha</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                disabled={resetPasswordMutation.isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirmar Senha</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme sua nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                disabled={resetPasswordMutation.isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Redefinindo...
              </>
            ) : (
              "Redefinir Senha"
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Lembrou sua senha?{" "}
          <button
            onClick={() => navigate("/login-departamento")}
            className="text-primary hover:underline font-medium"
          >
            Volte para login
          </button>
        </p>
      </Card>
    </div>
  );
}
