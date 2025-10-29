// === イベントセクションコンポーネント ===
import React from "react";
import type { EventRow } from "~/api/student";
import EventListItem from "./EventListItem";
import SectionFrame from "./SectionFrame";

interface EventSectionProps {
    title: string;
    events: EventRow[];
    isPast?: boolean;
}

/**
 * イベントリストのセクション
 * - タイトルと複数のイベントをまとめて表示
 */
export default function EventSection({ title, events, isPast = false }: EventSectionProps) {
    if (events.length === 0) return null;

    return (
        <SectionFrame title={title}>
            {events.map((event) => (
                <EventListItem key={event.f_event_id} event={event} isPast={isPast} />
            ))}
        </SectionFrame>
    );
}
