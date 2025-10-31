-- Populate website and Google Drive links for MCA lenders

-- Credibly
UPDATE lenders_mca
SET website = 'https://www.credibly.com/',
    google_drive = 'https://drive.google.com/drive/folders/1M89s6eSRheha_O1VOvNPXc4oAnvbB7FJ'
WHERE lender_name = 'Credibly';

-- Rapid
UPDATE lenders_mca
SET website = 'https://www.rapidfinance.com/',
    google_drive = 'https://drive.google.com/drive/folders/1XZSuXzQIWzzHolZY8XmPieiS7HNXljFL'
WHERE lender_name = 'Rapid';

-- Fundworks
UPDATE lenders_mca
SET website = 'https://thefundworks.com/',
    google_drive = 'https://drive.google.com/drive/folders/1MVK1-4ZcxYrCgdfpXuuHrSJBzQnUEtB9'
WHERE lender_name = 'Fundworks';

-- TMRnow
UPDATE lenders_mca
SET website = 'https://tmrnow.com/',
    google_drive = 'https://drive.google.com/drive/folders/1RjZY6TuP_aN7izsQxjCntDQ5q0qgjgSs?usp=drive_link'
WHERE lender_name = 'TMRnow';

-- TVT Capital
UPDATE lenders_mca
SET website = 'https://tvt-capital.com/',
    google_drive = 'https://drive.google.com/drive/folders/1TnGGsuXqB97NE1lL9wJ8oBayg36KguO2'
WHERE lender_name = 'TVT Capital';
