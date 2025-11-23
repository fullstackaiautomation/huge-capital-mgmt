import { X } from 'lucide-react';
import { useState } from 'react';
import DealForm from './DealForm';
import { supabase } from '../../lib/supabase';
import type { DealFormData, OwnerFormData } from '../../types/deals';

interface EditDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    deal: any; // Using any for now to match the complex DealWithRelations type
    onSuccess: () => void;
}

export default function EditDealModal({ isOpen, onClose, deal, onSuccess }: EditDealModalProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !deal) return null;

    // Map existing deal data to form data
    const initialDealData: Partial<DealFormData> = {
        legal_business_name: deal.legal_business_name,
        dba_name: deal.dba_name || '',
        ein: deal.ein,
        business_type: deal.business_type || '',
        address: deal.address,
        city: deal.city,
        state: deal.state,
        zip: deal.zip,
        phone: deal.phone || '',
        website: deal.website || '',
        franchise_business: deal.franchise_business || false,
        seasonal_business: deal.seasonal_business || false,
        peak_sales_month: deal.peak_sales_month || '',
        business_start_date: deal.business_start_date || '',
        product_service_sold: deal.product_service_sold || '',
        franchise_units: deal.franchise_units?.toString() || '',
        average_monthly_sales: deal.average_monthly_sales?.toString() || '',
        average_monthly_card_sales: deal.average_monthly_card_sales?.toString() || '',
        desired_loan_amount: deal.desired_loan_amount?.toString() || '',
        reason_for_loan: deal.reason_for_loan || '',
        loan_type: deal.loan_type,
    };

    // Map existing owners to form data
    const initialOwners: OwnerFormData[] = deal.deal_owners?.map((owner: any) => ({
        owner_number: owner.owner_number,
        full_name: owner.full_name,
        street_address: owner.street_address,
        city: owner.city,
        state: owner.state,
        zip: owner.zip,
        phone: owner.phone || '',
        email: owner.email || '',
        ownership_percent: owner.ownership_percent?.toString() || '',
        drivers_license_number: owner.drivers_license_number || '',
        date_of_birth: owner.date_of_birth || '',
        ssn: '', // SSN is not retrieved for security/privacy in this view
    })) || [];

    const handleSubmit = async (data: { deal: DealFormData; owners: OwnerFormData[] }) => {
        try {
            setSaving(true);
            setError(null);

            // 1. Update Deal
            const { error: dealError } = await supabase
                .from('deals')
                .update({
                    legal_business_name: data.deal.legal_business_name,
                    dba_name: data.deal.dba_name || null,
                    ein: data.deal.ein,
                    business_type: data.deal.business_type || null,
                    address: data.deal.address,
                    city: data.deal.city,
                    state: data.deal.state,
                    zip: data.deal.zip,
                    phone: data.deal.phone || null,
                    website: data.deal.website || null,
                    franchise_business: data.deal.franchise_business,
                    seasonal_business: data.deal.seasonal_business,
                    peak_sales_month: data.deal.peak_sales_month || null,
                    business_start_date: data.deal.business_start_date || null,
                    product_service_sold: data.deal.product_service_sold || null,
                    franchise_units: data.deal.franchise_units ? Number(data.deal.franchise_units) : null,
                    average_monthly_sales: data.deal.average_monthly_sales ? Number(data.deal.average_monthly_sales) : null,
                    average_monthly_card_sales: data.deal.average_monthly_card_sales ? Number(data.deal.average_monthly_card_sales) : null,
                    desired_loan_amount: Number(data.deal.desired_loan_amount),
                    reason_for_loan: data.deal.reason_for_loan || null,
                    loan_type: data.deal.loan_type,
                })
                .eq('id', deal.id);

            if (dealError) throw dealError;

            // 2. Upsert Owners
            // We use upsert based on deal_id and owner_number
            for (const owner of data.owners) {
                const ownerData = {
                    deal_id: deal.id,
                    owner_number: (owner.owner_number as unknown) as 1 | 2,
                    full_name: owner.full_name,
                    street_address: owner.street_address,
                    city: owner.city,
                    state: owner.state,
                    zip: owner.zip,
                    phone: owner.phone || null,
                    email: owner.email || null,
                    ownership_percent: owner.ownership_percent ? Number(owner.ownership_percent) : null,
                    drivers_license_number: owner.drivers_license_number || null,
                    date_of_birth: owner.date_of_birth || null,
                    // We don't update SSN here as it's not in the form for editing (security)
                };

                const { error: ownerError } = await supabase
                    .from('deal_owners')
                    .upsert(ownerData, { onConflict: 'deal_id,owner_number' });

                if (ownerError) throw ownerError;
            }

            // If the number of owners decreased, we might need to delete the extra ones.
            // For now, let's assume we just update/insert 1 and 2.
            // If the user removed owner 2 in the form, we should delete it.
            if (data.owners.length < (deal.deal_owners?.length || 0)) {
                // Find which owner number is missing
                const submittedOwnerNumbers = data.owners.map(o => o.owner_number);
                const existingOwnerNumbers = deal.deal_owners.map((o: any) => o.owner_number);
                const toDelete = existingOwnerNumbers.filter((n: number) => !(submittedOwnerNumbers as number[]).includes(n));

                if (toDelete.length > 0) {
                    await supabase
                        .from('deal_owners')
                        .delete()
                        .eq('deal_id', deal.id)
                        .in('owner_number', toDelete);
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating deal:', err);
            setError(err.message || 'Failed to update deal');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gray-900 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Edit Deal Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <DealForm
                        onSubmit={handleSubmit}
                        isLoading={saving}
                        initialData={initialDealData}
                        initialOwners={initialOwners}
                    />
                </div>
            </div>
        </div>
    );
}
