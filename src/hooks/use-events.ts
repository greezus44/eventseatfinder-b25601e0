import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Event, EventInput } from '@/types/event';

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!id,
  });
}

export function useEventBySlug(slug: string) {
  return useQuery({
    queryKey: ['event', 'slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!slug,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventInput) => {
      const { data, error } = await supabase.from('events').insert(input).select().single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); },
  });
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<EventInput>) => {
      const { data, error } = await supabase.from('events').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', id] });
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); },
  });
}
