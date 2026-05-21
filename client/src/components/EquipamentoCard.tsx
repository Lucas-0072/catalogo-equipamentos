import { Link } from "wouter";
import { Package, Building2, ChevronRight } from "lucide-react";
import type { Equipamento, Fornecedor } from "../../../drizzle/schema";

type EquipamentoWithFornecedores = Equipamento & {
  fornecedor1: Fornecedor | null;
  fornecedor2: Fornecedor | null;
  fornecedor3: Fornecedor | null;
};

interface Props {
  equipamento: EquipamentoWithFornecedores;
}

export default function EquipamentoCard({ equipamento }: Props) {
  const fornecedores = [
    equipamento.fornecedor1,
    equipamento.fornecedor2,
    equipamento.fornecedor3,
  ].filter(Boolean) as Fornecedor[];

  return (
    <Link href={`/equipamento/${equipamento.id}`} className="block no-underline group">
      <div
        className="rounded-xl border overflow-hidden transition-all duration-200 h-full flex flex-col"
        style={{
          background: "oklch(0.14 0 0)",
          borderColor: "oklch(0.22 0 0)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.85 0.18 95)";
          (e.currentTarget as HTMLElement).style.background = "oklch(0.16 0 0)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.22 0 0)";
          (e.currentTarget as HTMLElement).style.background = "oklch(0.14 0 0)";
        }}
      >
        {/* Imagem */}
        <div className="relative w-full aspect-video flex items-center justify-center"
          style={{ background: "oklch(0.10 0 0)" }}>
          {equipamento.imagem ? (
            <img
              src={equipamento.imagem}
              alt={equipamento.descricao}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-30">
              <Package size={40} style={{ color: "oklch(0.85 0.18 95)" }} />
              <span className="text-xs" style={{ color: "oklch(0.65 0 0)" }}>Sem imagem</span>
            </div>
          )}
          {/* Badge subgrupo */}
          <div className="absolute top-2 left-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "oklch(0.85 0.18 95 / 0.15)", color: "oklch(0.85 0.18 95)", border: "1px solid oklch(0.85 0.18 95 / 0.3)" }}>
              {equipamento.subgrupoNome || `Sub ${equipamento.subgrupo}`}
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          {/* Código */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
              style={{ background: "oklch(0.20 0 0)", color: "oklch(0.85 0.18 95)" }}>
              #{equipamento.codigo}
            </span>
            <span className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
              {equipamento.unidade}
            </span>
          </div>

          {/* Descrição */}
          <h3 className="text-sm font-medium leading-snug line-clamp-3 flex-1"
            style={{ color: "oklch(0.90 0 0)" }}>
            {equipamento.descricao}
          </h3>

          {/* NCM */}
          {equipamento.ncm && equipamento.ncm !== 'nan' && (
            <p className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
              NCM: {equipamento.ncm}
            </p>
          )}

          {/* Fornecedores */}
          {fornecedores.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <Building2 size={12} style={{ color: "oklch(0.65 0 0)" }} />
              {fornecedores.map((f, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.20 0 0)", color: "oklch(0.75 0 0)" }}>
                  {f.nome}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 size={12} style={{ color: "oklch(0.35 0 0)" }} />
              <span className="text-xs" style={{ color: "oklch(0.40 0 0)" }}>
                Sem fornecedor
              </span>
            </div>
          )}

          {/* Ver detalhes */}
          <div className="flex items-center gap-1 text-xs font-medium mt-1 transition-colors"
            style={{ color: "oklch(0.85 0.18 95)" }}>
            Ver detalhes <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </Link>
  );
}
