-- Member contact list visibility preference

ALTER TABLE businesses ADD COLUMN contact_list_visible INTEGER NOT NULL DEFAULT 1;
