import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
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

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventInput & { user_id: string }) => {
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] });
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

export function useCheckSlugAvailability() {
  return useMutation({
    mutationFn: async (slug: string) => {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return !data; // true = available
    },
  });
}
