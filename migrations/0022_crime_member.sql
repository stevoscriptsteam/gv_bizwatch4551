-- Track which team member submitted a report (null = business owner)
ALTER TABLE crimes ADD COLUMN member_id TEXT;
