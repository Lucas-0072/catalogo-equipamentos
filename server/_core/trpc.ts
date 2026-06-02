import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

const requireDepartamento = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.departamento) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso exclusivo para departamentos autorizados" });
  }

  return next({
    ctx: {
      ...ctx,
      departamento: ctx.departamento,
    },
  });
});

export const departamentoProcedure = t.procedure.use(requireDepartamento);

const requireWritePermission = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.departamento) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso exclusivo para departamentos autorizados" });
  }

  // Apenas Gestão e Almoxarifado podem fazer modificações
  const WRITE_ALLOWED_DEPTS = ["gestao", "almoxarifado"];
  if (!WRITE_ALLOWED_DEPTS.includes(ctx.departamento.login)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seu departamento não tem permissão para fazer modificações. Apenas leitura é permitida." });
  }

  return next({
    ctx: {
      ...ctx,
      departamento: ctx.departamento,
    },
  });
});

export const departamentoWriteProcedure = t.procedure.use(requireWritePermission);
