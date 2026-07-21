-- Master admin account (0402940839) for BizWatch admin panel
INSERT OR IGNORE INTO businesses (id, business_name, phone, email, suburb, active, is_admin) VALUES
  ('biz-master', 'GV Integrated Solutions', '+61402940839', 'admin@gvintegratedsolutions.com.au', 'Caloundra', 1, 1);

UPDATE businesses SET is_admin = 1, active = 1 WHERE phone = '+61402940839';
