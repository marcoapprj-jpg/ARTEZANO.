import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, PackagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Packaging, PackagingInput } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FormState {
  name: string;
  quantity: string;
  min_quantity: string;
}
const EMPTY: FormState = { name: "", quantity: "0", min_quantity: "0" };
const toInt = (s: string) => parseInt(s.replace(/[^\d-]/g, "") || "0", 10);

const level = (p: Packaging) => (p.quantity <= 0 ? "out" : p.quantity <= p.min_quantity ? "low" : "ok");

export default function Stock() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["packaging"], queryFn: () => apiGet<Packaging[]>("/packaging") });
  const list = q.isError ? [] : (q.data ?? []);
  const alerts = list.filter((p) => level(p) !== "ok");

  const [editing, setEditing] = useState<Packaging | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [entryFor, setEntryFor] = useState<Packaging | null>(null);
  const [entryQty, setEntryQty] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["packaging"] });

  const saveM = useMutation({
    mutationFn: (body: PackagingInput) =>
      editing ? apiPut<Packaging>(`/packaging/${editing.id}`, body) : apiPost<Packaging>("/packaging", body),
    onSuccess: () => {
      toast.success(editing ? "Embalagem atualizada" : "Embalagem incluída");
      setFormOpen(false);
      refresh();
    },
    onError: () => toast.error("Não foi possível salvar"),
  });
  const entryM = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) => apiPost<Packaging>(`/packaging/${id}/adjust`, { delta }),
    onSuccess: (p) => {
      toast.success(`Entrada registrada — ${p.name}: ${p.quantity} un.`);
      setEntryFor(null);
      refresh();
    },
    onError: () => toast.error("Não foi possível registrar a entrada"),
  });
  const delM = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/packaging/${id}`),
    onSuccess: () => {
      toast.success("Embalagem excluída");
      setFormOpen(false);
      refresh();
    },
    onError: () => toast.error("Não foi possível excluir"),
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormOpen(true);
  };
  const openEdit = (p: Packaging) => {
    setEditing(p);
    setForm({ name: p.name, quantity: String(p.quantity), min_quantity: String(p.min_quantity) });
    setFormOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Informe o nome da embalagem");
    saveM.mutate({ name: form.name.trim().toUpperCase(), quantity: toInt(form.quantity), min_quantity: Math.max(0, toInt(form.min_quantity)) });
  };
  const submitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const n = toInt(entryQty);
    if (!entryFor || n <= 0) return toast.error("Informe a quantidade de entrada");
    entryM.mutate({ id: entryFor.id, delta: n });
  };

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6F5E]">Estoque</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="page-title-stock">Embalagens</h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            Cada pedido dá baixa automática na embalagem cujo nome aparece no nome do item
            (ex.: <strong>“10x POTE Chocolate”</strong> baixa 10 de <strong>POTE</strong>). Excluir um pedido devolve ao estoque.
          </p>
        </div>
        <Button className="h-11 rounded-xl px-5" onClick={openNew} data-testid="btn-add-packaging">
          <Plus /> Nova embalagem
        </Button>
      </div>

      {alerts.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C9A0] bg-[#FFF4E8] p-4 text-sm text-[#7A3E0F] animate-rise" data-testid="stock-alerts">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-honey" />
          <div>
            <p className="font-semibold">Atenção ao estoque</p>
            <p>
              {alerts.map((p) => `${p.name} (${p.quantity})`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {q.isError && <p className="text-destructive" data-testid="stock-error">Não foi possível carregar o estoque.</p>}
      {!q.isLoading && !q.isError && list.length === 0 && (
        <div className="rounded-3xl border border-dashed p-10 text-center text-muted-foreground" data-testid="stock-empty">
          Nenhuma embalagem cadastrada. Inclua, por exemplo: POTE, COPO, FORMA 500, FORMA 1KG.
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="stock-list">
        {list.map((p) => {
          const lv = level(p);
          return (
            <li
              key={p.id}
              data-testid={`card-packaging-${p.id}`}
              className={cn(
                "flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-[0_8px_24px_-18px_rgba(61,35,20,0.4)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                lv === "out" ? "border-[#F0B4B4]" : lv === "low" ? "border-[#F2C9A0]" : "border-[#F0E4D8]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-lg font-bold tracking-tight" data-testid={`packaging-name-${p.id}`}>{p.name}</p>
                  <p className="text-xs text-muted-foreground">Mínimo: {p.min_quantity} un.</p>
                </div>
                <Button size="icon-sm" variant="ghost" onClick={() => openEdit(p)} data-testid={`btn-edit-packaging-${p.id}`} aria-label="Ajustar">
                  <Pencil />
                </Button>
              </div>
              <div className="flex items-end justify-between gap-2">
                <p
                  className={cn(
                    "font-mono text-4xl font-bold tabular-nums",
                    lv === "out" ? "text-destructive" : lv === "low" ? "text-honey" : "text-espresso",
                  )}
                  data-testid={`packaging-qty-${p.id}`}
                >
                  {p.quantity}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">un.</span>
                </p>
                <Button
                  variant="outline"
                  className="rounded-xl border-caramel/40 text-caramel hover:text-caramel"
                  onClick={() => {
                    setEntryFor(p);
                    setEntryQty("");
                  }}
                  data-testid={`btn-entry-packaging-${p.id}`}
                >
                  <PackagePlus /> Entrada
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md" data-testid="packaging-dialog">
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">{editing ? "Ajustar embalagem" : "Nova embalagem"}</DialogTitle>
              <DialogDescription>Use a mesma palavra que aparece no nome dos itens (ex.: POTE, COPO, FORMA 500).</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="pk-name">Nome</Label>
              <Input id="pk-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="uppercase" data-testid="input-packaging-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pk-qty">Quantidade em estoque</Label>
                <Input id="pk-qty" inputMode="numeric" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="font-mono" data-testid="input-packaging-quantity" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pk-min">Estoque mínimo</Label>
                <Input id="pk-min" inputMode="numeric" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} className="font-mono" data-testid="input-packaging-min" />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              {editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => window.confirm(`Excluir “${editing.name}”?`) && delM.mutate(editing.id)}
                  data-testid="btn-delete-packaging"
                >
                  <Trash2 /> Excluir
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={saveM.isPending} data-testid="btn-save-packaging">
                {editing ? "Salvar ajuste" : "Incluir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!entryFor} onOpenChange={(v) => !v && setEntryFor(null)}>
        <DialogContent className="sm:max-w-sm" data-testid="entry-dialog">
          <form onSubmit={submitEntry} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Entrada de {entryFor?.name}</DialogTitle>
              <DialogDescription>Estoque atual: {entryFor?.quantity} un. Quantas unidades chegaram?</DialogDescription>
            </DialogHeader>
            <Input autoFocus inputMode="numeric" placeholder="Ex.: 100" value={entryQty} onChange={(e) => setEntryQty(e.target.value)} className="h-12 font-mono text-xl" data-testid="input-entry-quantity" />
            <DialogFooter>
              <Button type="submit" disabled={entryM.isPending} data-testid="btn-save-entry">
                <PackagePlus /> Registrar entrada
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
