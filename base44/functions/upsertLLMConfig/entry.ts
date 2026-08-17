import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { encryptApiKey } from "../../shared/crypto.ts";

// Cria ou atualiza um provedor LLM, criptografando a chave de API (AES-256-GCM)
// antes de persistir no banco. Admin-only.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — apenas administradores' }, { status: 403 });

    const { id, provider_name, api_url, model_name, is_active, api_key } = await req.json();

    if (!provider_name?.trim() || !api_url?.trim() || !model_name?.trim()) {
      return Response.json({ error: 'Nome do provedor, URL da API e modelo são obrigatórios' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      provider_name: provider_name.trim(),
      api_url: api_url.trim(),
      model_name: model_name.trim(),
      is_active: is_active !== false,
      // Migra para o modelo criptografado: limpa a referência de env var ao (re)salvar com chave.
      api_key_env_var: '',
    };

    const hasNewKey = typeof api_key === 'string' && api_key.trim().length > 0;

    if (id) {
      // Edição: se não houver chave nova, preserva a criptografada existente e não sobrescreve env var.
      const updatePayload: Record<string, unknown> = { ...payload };
      if (!hasNewKey) {
        delete updatePayload.api_key_encrypted;
        delete updatePayload.api_key_env_var;
      } else {
        updatePayload.api_key_encrypted = await encryptApiKey(api_key.trim());
      }
      const updated = await base44.entities.LLMConfig.update(id, updatePayload);
      return Response.json({ ok: true, id: updated.id, provider_name: updated.provider_name });
    }

    // Criação: chave é obrigatória.
    if (!hasNewKey) {
      return Response.json({ error: 'Chave de API é obrigatória para um novo provedor' }, { status: 400 });
    }
    payload.api_key_encrypted = await encryptApiKey(api_key.trim());
    const created = await base44.entities.LLMConfig.create(payload);
    return Response.json({ ok: true, id: created.id, provider_name: created.provider_name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}