-- Update applications status check constraint to support new recruitment pipeline stages
begin;

alter table applications
drop constraint if exists chk_applications_status;

alter table applications
add constraint chk_applications_status
check (status in (
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

commit;
