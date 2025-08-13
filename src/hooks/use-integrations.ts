'use client';

import { useState, useEffect } from 'react';

export function useIntegrations(agencyId: number | string | null) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agencyId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/agencies/${agencyId}/integrations`)
      .then((res) => res.json())
      .then((result) => {
        if (result.error) setError(result.error);
        setIntegrations(result.integrations || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [agencyId]);

  return { integrations, loading, error };
}
