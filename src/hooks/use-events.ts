import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Event, EventInput } from '@/types/event';

const EVENTS_KEY = 'events';

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: [EVENTS_KEY],
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

export function useEvent(eventId: string | undefined) {
  return useQuery<Event | null>({
    queryKey: [EVENTS_KEY, eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId!)
        .single();
      if (error) throw error;
      return data as Event;
    },
  });
}

export function useEventBySlug(slug: string | undefined) {
  return useQuery<Event | null>({
    queryKey: [EVENTS_KEY, 'slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug!)
        .single();
      if (error) throw error;
      return data as Event;
    },
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
      queryClient.invalidateQueries({ queryKey: [EVENTS_KEY] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: EventInput & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENTS_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [EVENTS_KEY] });
    },
  });
}
