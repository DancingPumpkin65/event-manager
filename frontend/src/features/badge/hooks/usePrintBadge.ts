import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// Lazy load heavy PDF/barcode libraries only when printing
// This defers ~150KB of jsPDF + JsBarcode until actually needed
const loadBadgeGenerator = () => import('@/lib/badge-pdf-generator');

interface PrintBadgeParams {
    id: string;
    eventId?: string;
    type: 'participant' | 'staff';
    printedBy: string;
}

export function usePrintBadge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, eventId, type, printedBy }: PrintBadgeParams) => {
            // Dynamically import PDF generator only when printing
            const { generateBadgePDF, generateBarcode } = await loadBadgeGenerator();

            // Fetch event layout if eventId provided
            let eventLayout = null;
            if (eventId) {
                try {
                    const event = await apiClient.getEvent(eventId);
                    // @ts-ignore - badgeLayout might be missing in type definition but exists in API
                    eventLayout = event.badgeLayout;
                } catch (e) {
                    console.warn('[PrintBadge] Failed to fetch event layout, using default', e);
                }
            }

            if (type === 'participant') {
                const participant = await apiClient.getParticipant(id);

                if (!participant || !participant.id) {
                    throw new Error('Invalid participant data received');
                }

                // Update participant status to CONFIRMED if not already
                if (participant.status !== 'CONFIRMED') {
                    await apiClient.updateParticipant({
                        id: participant.id,
                        participantFields: participant.participantFields,
                        status: 'CONFIRMED',
                    });
                }

                const firstName = participant.participantFields?.firstName || '';
                const lastName = participant.participantFields?.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Participant';

                const barcode = participant.badgeId || generateBarcode(`PART-${participant.id.substring(0, 8)}-${Date.now()}`, 12);


                // Generate and open PDF
                await generateBadgePDF({
                    id: participant.id,
                    name: fullName,
                    role: 'Participant',
                    barcode,
                    customData: participant.participantFields,
                    layoutConfig: eventLayout as any,
                });


                // Update badge print status after PDF is generated
                await apiClient.updateParticipantBadgePrint(participant.id, printedBy, barcode);

                return { type, id, barcode, status: 'CONFIRMED' };
            } else {
                const staff = await apiClient.getStaff(id);

                if (!staff || !staff.id) {
                    throw new Error('Invalid staff data received');
                }

                const staffFields = staff.staffFields as Record<string, any>;
                const firstName = staffFields?.firstName || '';
                const lastName = staffFields?.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Staff Member';

                // Reuse existing badge ID if available, otherwise generate new one
                const barcode = staff.badgeId || generateBarcode(`STAFF-${staff.id.substring(0, 8)}-${Date.now()}`, 12);


                // Generate and open PDF
                await generateBadgePDF({
                    id: staff.id,
                    name: fullName,
                    role: 'Staff',
                    barcode,
                    customData: staffFields,
                    layoutConfig: eventLayout as any,
                });


                // Update badge print status
                await apiClient.updateStaffBadgePrint(staff.id, {
                    badgeId: barcode.substring(0, 20),
                    printedBy,
                });

                return { type, id, barcode };
            }
        },
        onSuccess: (data) => {
            toast.success('Badge printed successfully');
            // Invalidate relevant queries to refresh the UI
            if (data.type === 'participant') {
                queryClient.invalidateQueries({ queryKey: ['participants'] });
                queryClient.invalidateQueries({ queryKey: ['participant', data.id] });
            } else {
                queryClient.invalidateQueries({ queryKey: ['staff'] });
                queryClient.invalidateQueries({ queryKey: ['staff', data.id] });
            }
        },
        onError: (error) => {
            console.error('[PrintBadge] Error occurred:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to print badge';
            toast.error(`Error printing badge: ${errorMessage}`);
        },
    });
}
