-- Populate SBA lender restricted industries with correct data

UPDATE lenders_sba
SET industry_restrictions = 'Non Franchise Restaurants and Hospitality/Construction Must Be Backed w/ Collateral'
WHERE lender_name = 'US Bank';

UPDATE lenders_sba
SET industry_restrictions = 'Transportation, Warehousing, Food Services, Hotels, Advertising and Consulting Services'
WHERE lender_name = 'Credit Bench' OR lender_name = 'Bayfirst';

UPDATE lenders_sba
SET industry_restrictions = 'Restaurants, Coffee Shops, Bars, Adult Stores, Marijuana, Logistics and Trucking'
WHERE lender_name = 'CDC Loans';

UPDATE lenders_sba
SET industry_restrictions = 'Transportation, Logistics, Most Construction, Adult Stores, Marijuana and Real Estate'
WHERE lender_name = 'SmartBiz';

UPDATE lenders_sba
SET industry_restrictions = 'Landscaping/Lawn Care Services, Gambling Establishments, Marijuana related businesses, Shooting Sports, Firearms/Ammo retailers, wholesalers, manufacturers, Gentleman''s clubs, Check Cashing, Pawn Shops, Real estate agencies, real estate training, mortgage companies, Art Galleries, Gas Stations/Convenient Stores, Online Trading Academies, Golf Courses, Non-MD owned medical practices, Co-working franchises, Trucking Companies, Emergency Rooms, Vape/Smoke/Cigar/Tobacco Shops, Any Real Estate Transaction, Construction related business, Wholesale Companies or Ecommerce Business'
WHERE lender_name = 'Live Oak Express';
