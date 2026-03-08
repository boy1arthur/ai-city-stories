import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Slot, SlotZone } from '@/data/slots';

type DbSlot = {
  id: string;
  zone: string;
  type: string;
  location: any;
  label: string;
  owner_type: string;
  owner_id: string | null;
  owner_name: string | null;
  owner_message: string | null;
  ai_hook_id: string | null;
  trigger_type: string | null;
  display_config: any;
};

function dbToSlot(row: DbSlot): Slot {
  return {
    id: row.id,
    zone: row.zone as SlotZone,
    type: row.type as Slot['type'],
    location: row.location || {},
    label: row.label,
    ownerType: row.owner_type as Slot['ownerType'],
    ownerId: row.owner_id || undefined,
    ownerName: row.owner_name || undefined,
    ownerMessage: row.owner_message || undefined,
    aiHookId: row.ai_hook_id || undefined,
    triggerType: (row.trigger_type as Slot['triggerType']) || undefined,
    displayConfig: row.display_config || undefined,
  };
}

export function useSlots(zone?: string) {
  return useQuery({
    queryKey: ['slots', zone],
    queryFn: async () => {
      let query = supabase.from('slots').select('*');
      if (zone) query = query.eq('zone', zone);
      const { data, error } = await query;
      if (error) throw error;
      return (data as DbSlot[]).map(dbToSlot);
    },
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      label?: string;
      ownerType?: string;
      ownerId?: string;
      ownerName?: string;
      ownerMessage?: string;
      displayConfig?: Record<string, unknown>;
    }) => {
      const update: Record<string, any> = {};
      if (params.label !== undefined) update.label = params.label;
      if (params.ownerType !== undefined) update.owner_type = params.ownerType;
      if (params.ownerId !== undefined) update.owner_id = params.ownerId || null;
      if (params.ownerName !== undefined) update.owner_name = params.ownerName || null;
      if (params.ownerMessage !== undefined) update.owner_message = params.ownerMessage || null;
      if (params.displayConfig !== undefined) update.display_config = params.displayConfig;

      const { error } = await supabase.from('slots').update(update).eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

// Pure helpers (no DB dependency) for filtering slot arrays in-memory
export function filterPatronTiles(slots: Slot[]): Slot[] {
  return slots.filter(s => s.type === 'PATRON_TILE');
}

export function filterByZone(slots: Slot[], zone: string): Slot[] {
  return slots.filter(s => s.zone === zone);
}
