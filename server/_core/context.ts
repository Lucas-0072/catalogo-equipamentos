import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, Departamento } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME, DEPARTAMENTO_COOKIE_NAME } from "@shared/const";
import * as db from "../db";

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
  const cookieValue = opts.req.cookies?.[DEPARTAMENTO_COOKIE_NAME];
  if (cookieValue) {
    try {
      const parsed = JSON.parse(cookieValue);
      if (parsed.departamentoId) {
        // Carregar departamento real do banco
        const dept = await db.getDepartamentoById(parsed.departamentoId);
        if (dept) {
          departamento = dept;
        }
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
