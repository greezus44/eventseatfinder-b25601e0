import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CheckIn, CheckInInput } from '@/types/check-in';

export function useCheckIns(eventId: string) { return useQuery({ queryKey: ['check-ins', eventId], queryFn: async () => { const { data, error } = await supabase.from('check_ins').select('*').eq('event_id', eventId).order('checked_in_at', { ascending: false }); if (error) throw error; return data as CheckIn[]; }, enabled: !!eventId }); }
export function useToggleCheckIn(eventId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: async (input: CheckInInput) => { if (input.check_in) { const { data, error } = await supabase.from('check_ins').upsert({ event_id: eventId, guest_id: input.guest_id, plus_ones_actual: input.plus_ones_actual ?? 0 }).select().single(); if (error) throw error; return data as CheckIn; } else { const { error } = await supabase.from('check_ins').delete().eq('event_id', eventId).eq('guest_id', input.guest_id); if (error) throw error; return null; } }, onSuccess: () => qc.invalidateQueries({ queryKey: ['check-ins', eventId] }) }); }
