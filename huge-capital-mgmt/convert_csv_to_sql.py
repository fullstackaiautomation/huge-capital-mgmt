import csv
import sys

def escape_sql(value, is_numeric=False):
    """Escape single quotes for SQL"""
    if value is None or value == '':
        return 'NULL'
    value_str = str(value).strip()
    if value_str == '' or value_str.upper() == 'N/A':
        return 'NULL'

    # For numeric fields, remove non-numeric characters (like + or ,)
    if is_numeric:
        # Remove +, commas, and other non-numeric chars
        numeric_str = ''.join(c for c in value_str if c.isdigit() or c == '.')
        if numeric_str == '':
            return 'NULL'
        # Return as integer if it's a whole number
        if '.' not in numeric_str:
            return numeric_str
        return numeric_str

    # Escape single quotes by doubling them
    value_str = value_str.replace("'", "''")
    return f"'{value_str}'"

def convert_blc_csv_to_sql(csv_file):
    """Convert Business Line of Credit CSV to SQL INSERT"""
    inserts = []

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip empty rows
            if not row.get('Lender Name', '').strip():
                continue

            values = [
                escape_sql(row.get('Lender Name')),
                escape_sql(row.get('Bank / Non-Bank')),
                escape_sql(row.get('Website')),
                escape_sql(row.get('Iso Contacts')),
                escape_sql(row.get('Phone')),
                escape_sql(row.get('Email')),
                escape_sql(row.get('Credit Requirement'), is_numeric=True),
                escape_sql(row.get('Credit Used')),
                escape_sql(row.get('Minimum Time In Business')),
                escape_sql(row.get('Minimum Deposit Count'), is_numeric=True),
                escape_sql(row.get('Minimum Monthly Revenue Amount')),
                escape_sql(row.get('Minimum Average Daily Balance')),
                escape_sql(row.get('Max Loan')),
                escape_sql(row.get('Positions')),
                escape_sql(row.get('Products Offered')),
                escape_sql(row.get('Terms')),
                escape_sql(row.get('Payments')),
                escape_sql(row.get('Draw Fees')),
                escape_sql(row.get('Preferred Industries')),
                escape_sql(row.get('Restricted Industries')),
                escape_sql(row.get('Ineligible States ')),
                escape_sql(row.get('Submission Docs')),
                escape_sql(row.get('Submission Type')),
                escape_sql(row.get('Submission Process')),
                escape_sql(row.get('Drive Link')),
                escape_sql(row.get('Notes')),
                "'IFS'",  # relationship
                "'active'"  # status
            ]

            insert = f"""INSERT INTO lenders_business_line_of_credit (
                lender_name, bank_non_bank, website, iso_contacts, phone, email,
                credit_requirement, credit_used, min_time_in_business, minimum_deposit_count,
                min_monthly_revenue_amount, min_avg_daily_balance, max_loan, positions,
                products_offered, terms, payments, draw_fees, preferred_industries,
                restricted_industries, ineligible_states, submission_docs, submission_type,
                submission_process, drive_link, notes, relationship, status
            ) VALUES ({', '.join(values)});"""

            inserts.append(insert)

    return inserts

def convert_mca_csv_to_sql(csv_file):
    """Convert MCA CSV to SQL INSERT"""
    inserts = []

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip empty rows
            if not row.get('Lender Name', '').strip():
                continue

            values = [
                escape_sql(row.get('Lender Name')),
                escape_sql(row.get('Paper')),
                escape_sql(row.get('Website')),
                escape_sql(row.get('ISO REP')),
                escape_sql(row.get('Phone')),
                escape_sql(row.get('Email')),
                escape_sql(row.get('Submission Docs')),
                escape_sql(row.get('Submission Type')),
                escape_sql(row.get('Submission Process')),
                escape_sql(row.get('Minimum Credit Requirement'), is_numeric=True),
                escape_sql(row.get('Minimum Monthly Revenue')),
                escape_sql(row.get('Max NSF / Negative Days')),
                escape_sql(row.get('Minimum Daily Balances')),
                escape_sql(row.get('Minimum Time In Business')),
                escape_sql(row.get('Minimum Loan Amount')),
                escape_sql(row.get('Max Loan Amount')),
                escape_sql(row.get('Terms')),
                escape_sql(row.get('Positions')),
                escape_sql(row.get('Buyouts')),
                escape_sql(row.get('Products Offered')),
                escape_sql(row.get('States Restrictions')),
                escape_sql(row.get('Google Drive')),
                escape_sql(row.get('Note')),
                escape_sql(row.get('Preferred Industries')),
                escape_sql(row.get('Restricted Industries')),
                "'IFS'",  # relationship
                "'active'"  # status
            ]

            insert = f"""INSERT INTO lenders_mca (
                lender_name, paper, website, iso_rep, phone, email,
                submission_docs, submission_type, submission_process, minimum_credit_requirement,
                minimum_monthly_revenue, max_nsf_negative_days, minimum_daily_balances,
                minimum_time_in_business, minimum_loan_amount, max_loan_amount, terms,
                positions, buyouts, products_offered, states_restrictions, google_drive, note,
                preferred_industries, restricted_industries, relationship, status
            ) VALUES ({', '.join(values)});"""

            inserts.append(insert)

    return inserts

if __name__ == '__main__':
    blc_file = "IFS MCA_LOC Sheet - IFS - Business Line of Credits.csv"
    mca_file = "IFS MCA_LOC Sheet - IFS - MCA.csv"

    print("-- Bulk insert IFS Business Line of Credit lenders")
    blc_inserts = convert_blc_csv_to_sql(blc_file)
    for insert in blc_inserts:
        print(insert)

    print("\n-- Bulk insert IFS MCA lenders")
    mca_inserts = convert_mca_csv_to_sql(mca_file)
    for insert in mca_inserts:
        print(insert)

    print(f"\n-- Total BLC inserts: {len(blc_inserts)}")
    print(f"-- Total MCA inserts: {len(mca_inserts)}")
