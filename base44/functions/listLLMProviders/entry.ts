import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Lista simplificada de provedores de IA para o seletor do cabeçalho:
// expõe apenas { id, provider_name } dos provedores ativos — nunca api_url,
// model_name ou api_key_env_var. A leitura direta da entidade LLMConfig é
// restrita a admins por RLS; esta função é a via pública e filtrada.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const supportsImage = body?.supports_image === true;
    const filters = { is_active: true, ...(supportsImage ? { supports_image: true } : {}) };

    const providers = await base44.asServiceRole.entities.LLMConfig.filter(filters);
    // Ordem determinística (mais antigo primeiro) — o primeiro da lista é o
    // mesmo padrão usado como fallback no backend.
    providers.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    return Response.json({
      providers: providers.map(p => ({ id: p.id, provider_name: p.provider_name })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}