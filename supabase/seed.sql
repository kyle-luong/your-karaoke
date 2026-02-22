-- Seed demo songs (audio_url/thumbnail_url are placeholders — upload real files to Supabase Storage)
insert into songs (id, title, artist, genre, duration_seconds, audio_url, lyrics_raw, lrc_data, thumbnail_url, is_explicit, child_safe) values
(
  '00000000-0000-0000-0000-000000000001',
  'Happy Birthday',
  'Traditional',
  'Classic',
  30,
  '/placeholder-audio.mp3',
  E'Happy birthday to you\nHappy birthday to you\nHappy birthday dear friend\nHappy birthday to you',
  '[{"timeMs":0,"line":"Happy birthday to you"},{"timeMs":7000,"line":"Happy birthday to you"},{"timeMs":14000,"line":"Happy birthday dear friend"},{"timeMs":21000,"line":"Happy birthday to you"}]'::jsonb,
  null,
  false,
  true
),
(
  '00000000-0000-0000-0000-000000000002',
  'Twinkle Twinkle Little Star',
  'Traditional',
  'Classic',
  45,
  '/placeholder-audio.mp3',
  E'Twinkle twinkle little star\nHow I wonder what you are\nUp above the world so high\nLike a diamond in the sky',
  '[{"timeMs":0,"line":"Twinkle twinkle little star"},{"timeMs":10000,"line":"How I wonder what you are"},{"timeMs":20000,"line":"Up above the world so high"},{"timeMs":30000,"line":"Like a diamond in the sky"}]'::jsonb,
  null,
  false,
  true
),
(
  '00000000-0000-0000-0000-000000000003',
  'Take Me Out to the Ball Game',
  'Traditional',
  'Classic',
  50,
  '/placeholder-audio.mp3',
  E'Take me out to the ball game\nTake me out with the crowd\nBuy me some peanuts and Cracker Jack\nI don''t care if I never get back',
  '[{"timeMs":0,"line":"Take me out to the ball game"},{"timeMs":12000,"line":"Take me out with the crowd"},{"timeMs":24000,"line":"Buy me some peanuts and Cracker Jack"},{"timeMs":36000,"line":"I don''t care if I never get back"}]'::jsonb,
  null,
  false,
  true
);
