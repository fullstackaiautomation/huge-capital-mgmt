SELECT lender_name, industry_restrictions 
FROM lenders_sba 
WHERE lender_name ILIKE '%credit%' OR lender_name ILIKE '%bayfirst%' OR lender_name ILIKE '%bench%'
ORDER BY lender_name;
