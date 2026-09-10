import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Eye, EyeOff, Trash2, Tags } from 'lucide-react';
import { ESPECIALIDADES } from '@/lib/clinicas';

const AMB_LABEL = { hospital: 'Hospital', clinica: 'Ambulatório', ambos: 'Ambulatório e Hospital' };
const AMB_OPTS = [
  ['hospital', '🏥 Hospital'],
  ['clinica', '🏢 Ambulatório'],
  ['ambos', '🌐 Ambos'],
];
const slugify = (nome) => (nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Card de Configurações: "Minhas Especialidades" — personalização INDIVIDUAL do médico
// logado (especialidades criadas por ele + padrões que ele ocultou). Nada afeta outros logins.
export default function MinhasEspecialidadesCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: registros = [] } = useQuery({
    queryKey: ['minhas-especialidades', user?.id],
    queryFn: () => base44.entities.MinhaEspecialidade.filter({ created_by_id: user.id }),
    enabled: !!user,
  });

  const [nome, setNome] = useState('');
  const [amb, setAmb] = useState('ambos');
  const [popupAdd, setPopupAdd] = useState(null);
  const [popupDel, setPopupDel] = useState(null);
  const [aviso, setAviso] = useState('');

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['minhas-especialidades'] });
  const avisar = (t) => { setAviso(t); setTimeout(() => setAviso(''), 3000); };

  const pedirConfirmacao = () => {
    const n = nome.trim();
    if (!n) return;
    setPopupAdd({ nome: n, jaExiste: ESPECIALIDADES.some(e => e.slug === slugify(n)) });
  };

  const confirmarAdd = async () => {
    const n = popupAdd?.nome;
    setPopupAdd(null);
    if (!n) return;
    if (registros.some(r => r.slug === slugify(n))) {
      avisar(`"${n}" já está na sua lista.`);
      return;
    }
    await base44.entities.MinhaEspecialidade.create({ slug: slugify(n), nome: n, ambiente: amb, criada: true, ativa: true });
    invalidar();
    setNome('');
    avisar(`"${n}" agregada — já aparece no seu menu (${AMB_LABEL[amb]}).`);
  };

  const alternarVisibilidade = async (reg) => {
    await base44.entities.MinhaEspecialidade.update(reg.id, { ativa: reg.ativa === false });
    invalidar();
  };

  const excluir = async (reg) => {
    setPopupDel(null);
    await base44.entities.MinhaEspecialidade.delete(reg.id);
    invalidar();
    avisar(reg.criada ? `"${reg.nome}" excluída do seu menu.` : `"${reg.nome}" voltou ao padrão do menu.`);
  };

  if (!user) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold flex items-center gap-2"><Tags className="w-4 h-4" /> Minhas Especialidades</h3>
        <p className="text-xs text-muted-foreground">Agregue, oculte ou exclua especialidades — só para o seu login.</p>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') pedirConfirmacao(); }}
            placeholder="Ex.: Acupuntura"
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
          <button onClick={pedirConfirmacao} disabled={!nome.trim()}
            className="flex items-center gap-1 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {AMB_OPTS.map(([id, label]) => (
            <button key={id} onClick={() => setAmb(id)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${amb === id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {aviso && <p className="text-xs font-semibold text-primary">{aviso}</p>}

      {registros.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma personalização — todas as especialidades padrão aparecem no seu menu.</p>
      ) : (
        <div className="space-y-2">
          {registros.map(r => (
            <div key={r.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{r.nome}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">{AMB_LABEL[r.ambiente] || r.ambiente}</span>
                  <span className="text-[10px] text-muted-foreground">{r.criada ? 'criada por você' : 'padrão'}</span>
                  {r.ativa === false && <span className="text-[10px] font-bold text-destructive">oculta</span>}
                </div>
              </div>
              <button onClick={() => alternarVisibilidade(r)} title={r.ativa === false ? 'Mostrar no menu' : 'Ocultar do menu'}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                {r.ativa === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => setPopupDel(r)} title="Excluir"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {popupAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="glass-card rounded-2xl p-5 w-full max-w-sm space-y-3">
            <p className="text-sm font-bold leading-relaxed">
              {popupAdd.jaExiste
                ? `"${popupAdd.nome}" já existe no app. Deseja agregá-la como personalização sua (permite ocultar/mostrar)?`
                : `Deseja agregar "${popupAdd.nome}" (${AMB_LABEL[amb]})?`}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPopupAdd(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:bg-accent transition-all">Não</button>
              <button onClick={confirmarAdd}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all">Sim</button>
            </div>
          </div>
        </div>
      )}

      {popupDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="glass-card rounded-2xl p-5 w-full max-w-sm space-y-3">
            <p className="text-sm font-bold leading-relaxed">
              {popupDel.criada
                ? `Excluir "${popupDel.nome}"? Ela sai do seu menu.`
                : `Excluir a personalização de "${popupDel.nome}"? A especialidade padrão volta a aparecer no seu menu.`}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPopupDel(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:bg-accent transition-all">Não</button>
              <button onClick={() => excluir(popupDel)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-destructive text-destructive-foreground hover:opacity-90 transition-all">Sim, excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}