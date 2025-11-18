-- Fix TMRnow lender email address (scott@tmrn0w.com -> scott@tmrnow.com)
UPDATE lenders
SET submission_instructions = 'uw@tmrnow.com, scott@tmrnow.com + Subject Line = Only The biz name'
WHERE name = 'TMRnow'
  AND submission_instructions LIKE '%scott@tmrn0w.com%';
