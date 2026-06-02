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

// Middleware de permissões granulares
const requireEditPermission = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.departamento) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso exclusivo para departamentos autorizados" });
  }

  if (ctx.departamento.podeEditar !== "sim") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seu departamento não tem permissão para editar equipamentos." });
  }

  return next({
    ctx: {
      ...ctx,
      departamento: ctx.departamento,
    },
  });
});

const requireCreatePermission = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.departamento) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso exclusivo para departamentos autorizados" });
  }

  if (ctx.departamento.podeCriar !== "sim") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seu departamento não tem permissão para criar equipamentos." });
  }

  return next({
    ctx: {
      ...ctx,
      departamento: ctx.departamento,
    },
  });
});

const requireDeletePermission = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.departamento) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso exclusivo para departamentos autorizados" });
  }

  if (ctx.departamento.podeDeletar !== "sim") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seu departamento não tem permissão para deletar equipamentos." });
  }

  return next({
    ctx: {
      ...ctx,
      departamento: ctx.departamento,
    },
  });
});

const requireSyncPermission = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.departamento) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso exclusivo para departamentos autorizados" });
  }

  if (ctx.departamento.podeSincronizar !== "sim") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seu departamento não tem permissão para sincronizar equipamentos." });
  }

  return next({
    ctx: {
      ...ctx,
      departamento: ctx.departamento,
    },
  });
});

// Procedures com permissões específicas
export const departamentoEditProcedure = t.procedure.use(requireEditPermission);
export const departamentoCreateProcedure = t.procedure.use(requireCreatePermission);
export const departamentoDeleteProcedure = t.procedure.use(requireDeletePermission);
export const departamentoSyncProcedure = t.procedure.use(requireSyncPermission);

// Procedure genérica de escrita (usa edit permission)
export const departamentoWriteProcedure = t.procedure.use(requireEditPermission);
