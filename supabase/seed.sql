-- Sample equipment catalog for local development (prices in PHP)
insert into public.equipment (name, category, brand, model, daily_rate, deposit_amount, condition, description)
values
  ('Canon EOS R5', 'camera', 'Canon', 'EOS R5', 3500.00, 25000.00, 'excellent', '45MP full-frame mirrorless, 8K video'),
  ('Sony A7 IV', 'camera', 'Sony', 'A7 IV', 3000.00, 20000.00, 'excellent', '33MP full-frame mirrorless, 4K60 video'),
  ('Fujifilm X-T5', 'camera', 'Fujifilm', 'X-T5', 2000.00, 15000.00, 'good', '40MP APS-C mirrorless'),
  ('Canon RF 24-70mm f/2.8L', 'lens', 'Canon', 'RF 24-70mm f/2.8L', 1500.00, 12000.00, 'excellent', 'Standard zoom lens'),
  ('Sony 70-200mm f/2.8 GM', 'lens', 'Sony', 'FE 70-200mm f/2.8 GM', 1800.00, 15000.00, 'good', 'Telephoto zoom lens'),
  ('Aputure 120D II', 'lighting', 'Aputure', '120D II', 1200.00, 7500.00, 'good', 'LED daylight-balanced light'),
  ('Rode Wireless GO II', 'audio', 'Rode', 'Wireless GO II', 700.00, 4000.00, 'excellent', 'Dual-channel wireless mic system'),
  ('Manfrotto MT055', 'accessory', 'Manfrotto', 'MT055XPRO3', 500.00, 2500.00, 'good', 'Aluminum tripod')
on conflict do nothing;
