-- Track how businesses heard about BizWatch at registration
ALTER TABLE businesses ADD COLUMN referral_source TEXT;
ALTER TABLE businesses ADD COLUMN referral_other TEXT;
