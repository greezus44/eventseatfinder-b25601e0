import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Event, EventInput } from '@/types';

export function useEvents() {
  return useQuery({
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
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) throw new Error('Event ID is required');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Event;
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventInput & { user_id?: string }) => {
      const { data, error } = await supabase
        .from('events')
        .insert(input)
        .select()
        .single();
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
        .single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', data.id] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useCheckSlugAvailability(slug: string, currentEventId?: string) {
  return useQuery({
    queryKey: ['slug-availability', slug],
    queryFn: async () => {
      if (!slug || slug.length < 2) return { available: false, reason: 'Slug must be at least 2 characters' };
      let query = supabase.from('events').select('id, slug').eq('slug', slug);
      if (currentEventId) {
        query = query.neq('id', currentEventId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { available: data.length === 0, reason: data.length > 0 ? 'Slug is already taken' : null };
    },
    enabled: !!slug && slug.length >= 2,
  });
}
