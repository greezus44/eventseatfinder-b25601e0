import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Event, EventInput } from '@/types';

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
  });
}

export function useEvent(id: string | undefined) {
  return useQuery<Event | null>({
    queryKey: ['event', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Event | null;
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventInput & { user_id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .insert(input)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & EventInput) => {
      const { data, error } = await supabase
        .from('events')
        .update(input)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', variables.id] });
    },
  });
}

export function useDeleteEvent(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId?: string) => {
      const targetId = eventId || id;
      if (!targetId) throw new Error('Event ID is required');
      const { error } = await supabase.from('events').delete().eq('id', targetId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useCheckSlugAvailability(slug: string | undefined, currentEventId?: string) {
  return useQuery<{ available: boolean } | null>({
    queryKey: ['slug-availability', slug, currentEventId],
    enabled: !!slug,
    queryFn: async () => {
      let query = supabase.from('events').select('id, slug').eq('slug', slug);
      if (currentEventId) {
        query = query.neq('id', currentEventId);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return { available: !data };
    },
  });
}
