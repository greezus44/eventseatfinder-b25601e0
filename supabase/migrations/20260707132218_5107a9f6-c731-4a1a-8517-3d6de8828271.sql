
CREATE POLICY "Owners upload event assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners update event assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'event-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners delete event assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners read event assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'event-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
