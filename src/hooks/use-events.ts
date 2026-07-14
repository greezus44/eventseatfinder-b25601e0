import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Event, EventInput } from '@/types/event';

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

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      if (error) throw error;
      return data as Event;
    },
    enabled: !!eventId,
  });
}

export function useEventBySlug(slug: string) {
  return useQuery({
    queryKey: ['event-by-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data as Event;
    },
    enabled: !!slug,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventInput) => {
      const { data, error } = await supabase
        .from('events')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: string } & EventInput) => {
      const { data, error } = await supabase
        .from('events')
        .update(fields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.id] });
      queryClient.invalidateQueries({ queryKey: ['event-by-slug', data.slug] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useCheckSlugAvailability(slug: string, currentEventId?: string) {
  return useQuery({
    queryKey: ['slug-check', slug],
    queryFn: async () => {
      if (!slug || slug.length < 2) return { available: false, reason: 'too_short' };
      let query = supabase.from('events').select('id, slug').eq('slug', slug);
      if (currentEventId) {
        query = query.neq('id', currentEventId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { available: !data || data.length === 0, reason: data && data.length > 0 ? 'taken' : 'ok' };
    },
    enabled: !!slug && slug.length >= 2,
    staleTime: 0,
  });
}
