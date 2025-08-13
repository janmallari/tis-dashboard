'use client';

import { useIntegrations } from '@/hooks/use-integrations';
import { type Agency } from '@/lib/supabase/client';

export default function Integrations({
  agencies,
  loading,
}: {
  agencies: Agency[];
  loading: boolean;
}) {
  const agency = agencies[0];

  const {
    integrations,
    loading: integrationsLoading,
    error,
  } = useIntegrations(agency?.id);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!agencies || agencies.length === 0) {
    return <div>No agencies found.</div>;
  }

  return (
    <div>
      {integrationsLoading && <div>Loading integrations...</div>}

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {!integrationsLoading && integrations.length === 0 && (
        <div>No integrations found.</div>
      )}

      {!integrationsLoading && integrations.length > 0 && (
        <ul>
          {integrations.map((integration: any) => (
            <li key={integration.id}>
              {integration.provider} ({integration.status})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
