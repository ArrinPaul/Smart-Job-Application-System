-- Update applications status check constraint to support new recruitment pipeline stages
ALTER TABLE applications
DROP CONSTRAINT IF EXISTS chk_applications_status;

ALTER TABLE applications
ADD CONSTRAINT chk_applications_status
CHECK (status IN (
    'APPLIED', 
    'SHORTLISTED', 
    'PHONE_SCREEN', 
    'TECHNICAL_INTERVIEW', 
    'ON_SITE_INTERVIEW', 
    'OFFER_EXTENDED', 
    'HIRED', 
    'REJECTED', 
    'HOLD'
));
