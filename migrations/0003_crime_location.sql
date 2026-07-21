-- Add structured address and coordinates to crime reports

ALTER TABLE crimes ADD COLUMN address TEXT;
ALTER TABLE crimes ADD COLUMN latitude REAL;
ALTER TABLE crimes ADD COLUMN longitude REAL;
ALTER TABLE crimes ADD COLUMN category_id TEXT;

-- Sample reports for development map (coordinates across 4551)
INSERT OR IGNORE INTO crimes (
  id, business_id, title, description, crime_type, location, suburb, postcode,
  address, latitude, longitude, category_id, status
) VALUES
  (
    'crime-seed-001',
    'biz-001',
    'Shoplifting incident near front counter',
    'Customer left without paying for goods worth approximately $200.',
    'Theft or shoplifting',
    '42 Bulcock Street, Caloundra QLD 4551',
    'Caloundra',
    '4551',
    '42 Bulcock Street, Caloundra QLD 4551',
    -26.8035,
    153.1212,
    'theft',
    'reported'
  ),
  (
    'crime-seed-002',
    'biz-002',
    'Aggressive behaviour outside cafe',
    'Verbal threats directed at staff member during closing.',
    'Aggressive or threatening behaviour',
    '15 Seaview Terrace, Moffat Beach QLD 4551',
    'Moffat Beach',
    '4551',
    '15 Seaview Terrace, Moffat Beach QLD 4551',
    -26.7952,
    153.1421,
    'aggressive',
    'reported'
  ),
  (
    'crime-seed-003',
    'biz-003',
    'Suspicious vehicle in car park',
    'Unregistered white ute circling the car park for 20 minutes.',
    'Suspicious behaviour',
    '8 Kawana Waters Drive, Kawana Waters QLD 4551',
    'Kawana Waters',
    '4551',
    '8 Kawana Waters Drive, Kawana Waters QLD 4551',
    -26.7453,
    153.1234,
    'suspicious',
    'under_review'
  );
