import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, Departamento } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  departamento: Departamento | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let departamento: Departamento | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Verificar cookie de departamento
  const cookieValue = opts.req.cookies?.[COOKIE_NAME];
  if (cookieValue) {
    try {
      const parsed = JSON.parse(cookieValue);
      if (parsed.departamentoId) {
        // Nota: em produção, você deveria buscar o departamento do banco
        // Por enquanto, apenas marcamos que há uma sessão de departamento
        departamento = parsed as any;
      }
    } catch (e) {
      // Cookie inválido, ignorar
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    departamento,
  };
}
