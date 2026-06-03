import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { RotateCcw, Trash2, AlertCircle } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

export function TrashPage() {
  const [selectedEquipId, setSelectedEquipId] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [showRestoreEquipDialog, setShowRestoreEquipDialog] = useState(false);
  const [showDeleteEquipDialog, setShowDeleteEquipDialog] = useState(false);
  const [showRestoreDeptDialog, setShowRestoreDeptDialog] = useState(false);
  const [showDeleteDeptDialog, setShowDeleteDeptDialog] = useState(false);

  // Queries
  const { data: deletedEquipamentos = [], isLoading: loadingEquip, refetch: refetchEquip } = trpc.trash.listEquipamentos.useQuery(undefined, { enabled: false });
  const { data: deletedDepartamentos = [], isLoading: loadingDept, refetch: refetchDept } = trpc.trash.listDepartamentos.useQuery(undefined, { enabled: false });

  // Mutations
  const restoreEquipMutation = trpc.trash.restoreEquipamento.useMutation({
    onSuccess: () => {
      refetchEquip();
      setSelectedEquipId(null);
      setShowRestoreEquipDialog(false);
    },
  });

  const deleteEquipMutation = trpc.trash.permanentlyDeleteEquipamento.useMutation({
    onSuccess: () => {
      refetchEquip();
      setSelectedEquipId(null);
      setShowDeleteEquipDialog(false);
    },
  });

  const restoreDeptMutation = trpc.trash.restoreDepartamento.useMutation({
    onSuccess: () => {
      refetchDept();
      setSelectedDeptId(null);
      setShowRestoreDeptDialog(false);
    },
  });

  const deleteDeptMutation = trpc.trash.permanentlyDeleteDepartamento.useMutation({
    onSuccess: () => {
      refetchDept();
      setSelectedDeptId(null);
      setShowDeleteDeptDialog(false);
    },
  });

  const selectedEquip = deletedEquipamentos.find(e => e.id === selectedEquipId);
  const selectedDept = deletedDepartamentos.find(d => d.id === selectedDeptId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.45 0.15 25 / 0.20)" }}>
          <Trash2 size={20} style={{ color: "oklch(0.65 0.15 25)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.90 0 0)" }}>Lixeira</h1>
          <p style={{ color: "oklch(0.55 0 0)" }}>Visualize e restaure itens deletados</p>
        </div>
      </div>

      <Tabs defaultValue="equipamentos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="equipamentos">Equipamentos ({deletedEquipamentos.length})</TabsTrigger>
          <TabsTrigger value="departamentos">Departamentos ({deletedDepartamentos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="equipamentos" className="space-y-4">
          {loadingEquip ? (
            <div style={{ color: "oklch(0.55 0 0)" }}>Carregando...</div>
          ) : deletedEquipamentos.length === 0 ? (
            <Card className="p-8 text-center" style={{ background: "oklch(0.12 0 0)", border: "1px solid oklch(0.25 0 0)" }}>
              <AlertCircle size={32} className="mx-auto mb-3" style={{ color: "oklch(0.55 0 0)" }} />
              <p style={{ color: "oklch(0.55 0 0)" }}>Nenhum equipamento na lixeira</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {deletedEquipamentos.map(equip => (
                <Card
                  key={equip.id}
                  className="p-4 cursor-pointer transition-colors"
                  style={{
                    background: selectedEquipId === equip.id ? "oklch(0.18 0 0)" : "oklch(0.12 0 0)",
                    border: selectedEquipId === equip.id ? "1px solid oklch(0.85 0.18 95)" : "1px solid oklch(0.25 0 0)",
                  }}
                  onClick={() => setSelectedEquipId(equip.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold" style={{ color: "oklch(0.85 0.18 95)" }}>#{equip.codigo}</span>
                        <span style={{ color: "oklch(0.75 0 0)" }} className="text-sm">{equip.grupoNome}</span>
                      </div>
                      <p style={{ color: "oklch(0.65 0 0)" }} className="text-sm mt-1">{equip.descricao?.slice(0, 100)}</p>
                      <p style={{ color: "oklch(0.45 0 0)" }} className="text-xs mt-2">
                        Deletado em: {equip.deletedAt ? new Date(equip.deletedAt).toLocaleString() : "-"}
                      </p>
                    </div>
                    {selectedEquipId === equip.id && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setShowRestoreEquipDialog(true);
                          }}
                          style={{ background: "oklch(0.55 0.15 140)", color: "oklch(0.95 0 0)" }}
                        >
                          <RotateCcw size={14} className="mr-1" /> Restaurar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={e => {
                            e.stopPropagation();
                            setShowDeleteEquipDialog(true);
                          }}
                        >
                          <Trash2 size={14} className="mr-1" /> Deletar
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="departamentos" className="space-y-4">
          {loadingDept ? (
            <div style={{ color: "oklch(0.55 0 0)" }}>Carregando...</div>
          ) : deletedDepartamentos.length === 0 ? (
            <Card className="p-8 text-center" style={{ background: "oklch(0.12 0 0)", border: "1px solid oklch(0.25 0 0)" }}>
              <AlertCircle size={32} className="mx-auto mb-3" style={{ color: "oklch(0.55 0 0)" }} />
              <p style={{ color: "oklch(0.55 0 0)" }}>Nenhum departamento na lixeira</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {deletedDepartamentos.map(dept => (
                <Card
                  key={dept.id}
                  className="p-4 cursor-pointer transition-colors"
                  style={{
                    background: selectedDeptId === dept.id ? "oklch(0.18 0 0)" : "oklch(0.12 0 0)",
                    border: selectedDeptId === dept.id ? "1px solid oklch(0.85 0.18 95)" : "1px solid oklch(0.25 0 0)",
                  }}
                  onClick={() => setSelectedDeptId(dept.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: "oklch(0.85 0.18 95)" }}>{dept.nome}</span>
                        <span style={{ color: "oklch(0.75 0 0)" }} className="text-sm font-mono">({dept.login})</span>
                      </div>
                      <p style={{ color: "oklch(0.45 0 0)" }} className="text-xs mt-2">
                        Deletado em: {dept.deletedAt ? new Date(dept.deletedAt).toLocaleString() : "-"}
                      </p>
                    </div>
                    {selectedDeptId === dept.id && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setShowRestoreDeptDialog(true);
                          }}
                          style={{ background: "oklch(0.55 0.15 140)", color: "oklch(0.95 0 0)" }}
                        >
                          <RotateCcw size={14} className="mr-1" /> Restaurar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={e => {
                            e.stopPropagation();
                            setShowDeleteDeptDialog(true);
                          }}
                        >
                          <Trash2 size={14} className="mr-1" /> Deletar
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogos de Confirmação */}
      <ConfirmDialog
        isOpen={showRestoreEquipDialog}
        title="Restaurar Equipamento"
        message={`Restaurar ${selectedEquip?.codigo}?`}
        details={`${selectedEquip?.descricao?.slice(0, 80)}...`}
        confirmText="Restaurar"
        cancelText="Cancelar"
        isLoading={restoreEquipMutation.isPending}
        onConfirm={() => selectedEquipId && restoreEquipMutation.mutate({ id: selectedEquipId })}
        onCancel={() => setShowRestoreEquipDialog(false)}
      />

      <ConfirmDialog
        isOpen={showDeleteEquipDialog}
        title="Deletar Permanentemente"
        message={`Deletar permanentemente ${selectedEquip?.codigo}?`}
        details="Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={deleteEquipMutation.isPending}
        onConfirm={() => selectedEquipId && deleteEquipMutation.mutate({ id: selectedEquipId })}
        onCancel={() => setShowDeleteEquipDialog(false)}
      />

      <ConfirmDialog
        isOpen={showRestoreDeptDialog}
        title="Restaurar Departamento"
        message={`Restaurar ${selectedDept?.nome}?`}
        details={`Login: ${selectedDept?.login}`}
        confirmText="Restaurar"
        cancelText="Cancelar"
        isLoading={restoreDeptMutation.isPending}
        onConfirm={() => selectedDeptId && restoreDeptMutation.mutate({ id: selectedDeptId })}
        onCancel={() => setShowRestoreDeptDialog(false)}
      />

      <ConfirmDialog
        isOpen={showDeleteDeptDialog}
        title="Deletar Permanentemente"
        message={`Deletar permanentemente ${selectedDept?.nome}?`}
        details="Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={deleteDeptMutation.isPending}
        onConfirm={() => selectedDeptId && deleteDeptMutation.mutate({ id: selectedDeptId })}
        onCancel={() => setShowDeleteDeptDialog(false)}
      />
    </div>
  );
}
