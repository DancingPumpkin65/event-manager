import { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PrintBadgeButton } from '@/components/PrintBadgeButton';
import type { ParticipantOutput } from '../types';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import { SquarePen, Trash2, UserPen, UserX } from 'lucide-react';
import { Button } from '@/components/ui';

// Virtualize when list exceeds this threshold
const VIRTUALIZATION_THRESHOLD = 20;
const ROW_HEIGHT = 60; // Approximate height of table row in pixels
const MOBILE_CARD_HEIGHT = 200; // Approximate height of mobile card in pixels

interface ParticipantListProps {
  participants: ParticipantOutput[];
  participantFields: ParticipantFieldDefinition[];
  currentUserEmail: string;
  onEdit: (participant: ParticipantOutput) => void;
  onDelete?: (participantId: string) => void;
  onBadgePrintSuccess: () => void;
  isDeleting?: boolean;
  eventId?: string;
}

const ParticipantList = memo(function ParticipantList({
  participants,
  participantFields,
  currentUserEmail,
  onEdit,
  onDelete,
  onBadgePrintSuccess,
  isDeleting = false,
  eventId,
}: ParticipantListProps) {
  // Refs for virtualization containers
  const mobileParentRef = useRef<HTMLDivElement>(null);
  const desktopParentRef = useRef<HTMLTableSectionElement | null>(null);

  // Determine if we should virtualize based on list size
  const shouldVirtualize = participants.length > VIRTUALIZATION_THRESHOLD;

  // Mobile virtualizer
  const mobileVirtualizer = useVirtualizer({
    count: participants.length,
    getScrollElement: () => mobileParentRef.current,
    estimateSize: () => MOBILE_CARD_HEIGHT,
    overscan: 3,
    enabled: shouldVirtualize,
  });

  // Desktop virtualizer
  const desktopVirtualizer = useVirtualizer({
    count: participants.length,
    getScrollElement: () => desktopParentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    enabled: shouldVirtualize,
  });

  if (participants.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No participants</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a new participant or importing from Excel.
        </p>
      </div>
    );
  }

  // Render a single participant card (mobile) - uses content-visibility for off-screen optimization
  const renderMobileCard = (participant: ParticipantOutput, style?: React.CSSProperties) => (
    <div key={participant.id} className="p-4 hover:bg-gray-50 border-b border-gray-200 content-auto" style={style}>
      <div className="space-y-2">
        {/* Display Badge ID */}
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">ID:</span>
          <span className="text-gray-500 text-right ml-2 text-xs font-mono" title={participant.badgeId || ''}>
            {participant.badgeId || '-'}
          </span>
        </div>
        {/* Display participant fields */}
        {participantFields.map((field) => (
          <div key={field.name} className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{field.label}:</span>
            <span className="text-gray-900 text-right ml-2 break-words max-w-[60%]">
              {(() => {
                const value = participant.participantFields?.[field.name];
                if (value instanceof Date) return value.toLocaleDateString();
                return value || '-';
              })()}
            </span>
          </div>
        ))}

        {/* Badge Status */}
        <div className="pt-2 border-t border-gray-100">
          <PrintBadgeButton
            id={participant.id}
            eventId={eventId}
            type="participant"
            participantFields={participant.participantFields}
            status={participant.status}
            badgePrintedAt={participant.badgePrintedAt}
            badgePrintedBy={participant.badgePrintedBy}
            printedBy={currentUserEmail}
            onPrintSuccess={onBadgePrintSuccess}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-2">
          <Button className='w-full' size='sm' onClick={() => onEdit(participant)} leftIcon={<UserPen className="inline mr-2" />}>
            Edit
          </Button>
          {onDelete && (
            <Button variant='danger' className='w-full' size='sm' onClick={() => onDelete(participant.id)} disabled={isDeleting} leftIcon={<UserX className="inline mr-2" />}>
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // Render a single participant row (desktop)
  const renderDesktopRow = (participant: ParticipantOutput, style?: React.CSSProperties) => (
    <tr key={participant.id} className="hover:bg-gray-50" style={style}>
      <td className="px-3 py-4 text-sm text-gray-500" title={participant.badgeId || ''}>
        {participant.badgeId || '-'}
      </td>
      {/* Render dynamic field values */}
      {participantFields.map((field) => (
        <td
          key={field.name}
          className="px-3 py-4 text-sm text-gray-900"
          title={participant.participantFields?.[field.name]?.toString()}
        >
          <div className="max-w-xs truncate">
            {(() => {
              const value = participant.participantFields?.[field.name];
              if (value instanceof Date) return value.toLocaleDateString();
              return value || '-';
            })()}
          </div>
        </td>
      ))}

      {/* Badge Status Column */}
      <td className="px-3 py-4 text-sm">
        <PrintBadgeButton
          id={participant.id}
          eventId={eventId}
          type="participant"
          participantFields={participant.participantFields}
          status={participant.status}
          badgePrintedAt={participant.badgePrintedAt}
          badgePrintedBy={participant.badgePrintedBy}
          printedBy={currentUserEmail}
          onPrintSuccess={onBadgePrintSuccess}
        />
      </td>

      {/* Actions Column */}
      <td className="whitespace-nowrap text-right px-3 py-4 text-sm space-x-1">
        <Button className='!px-1 !border-none' variant='secondary' size="sm" onClick={() => onEdit(participant)}>
          <SquarePen className="h-5" />
        </Button>
        {onDelete && (
          <Button className='!px-1 !border-none' variant='danger' size="sm" onClick={() => onDelete(participant.id)} disabled={isDeleting}>
            <Trash2 className="h-5" />
          </Button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      {/* Mobile: Card view - Virtualized when list is large */}
      <div className="block md:hidden">
        {shouldVirtualize ? (
          <div
            ref={mobileParentRef}
            className="h-[70vh] overflow-auto"
          >
            <div
              style={{
                height: `${mobileVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {mobileVirtualizer.getVirtualItems().map((virtualRow) => {
                const participant = participants[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {renderMobileCard(participant)}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {participants.map((participant) => renderMobileCard(participant))}
          </div>
        )}
      </div>

      {/* Desktop: Table view - Virtualized when list is large */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              {participantFields.map((field) => (
                <th
                  key={field.name}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {field.label}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Badge Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          {shouldVirtualize ? (
            <tbody
              ref={desktopParentRef}
              className="divide-y divide-gray-200 bg-white block h-[60vh] overflow-auto"
            >
              <tr
                style={{
                  height: `${desktopVirtualizer.getTotalSize()}px`,
                  display: 'block',
                  position: 'relative',
                }}
              >
                {desktopVirtualizer.getVirtualItems().map((virtualRow) => {
                  const participant = participants[virtualRow.index];
                  return (
                    <td
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                        display: 'table',
                        tableLayout: 'fixed',
                      }}
                    >
                      {renderDesktopRow(participant)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-gray-200 bg-white">
              {participants.map((participant) => renderDesktopRow(participant))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
});

ParticipantList.displayName = 'ParticipantList';

export default ParticipantList;
