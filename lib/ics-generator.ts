// Generate .ics calendar files for stream events

import { LiveStreamSession } from "@/types/streaming";

/**
 * Format a date for .ics files (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Generate .ics calendar file content for a live stream
 */
export function generateICS(stream: LiveStreamSession, watchUrl: string): string {
  const startDate = new Date(stream.scheduled_start_time);
  const endDate = new Date(
    startDate.getTime() + stream.scheduled_duration_seconds * 1000
  );
  const now = new Date();

  // Escape special characters in text fields
  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const title = escapeText(stream.title);
  const description = stream.description
    ? escapeText(
        `${stream.description}\n\nLive dance workout with ${stream.instructor_name || "instructor"}\n\nJoin the stream at: ${watchUrl}`
      )
    : `Live dance workout with ${stream.instructor_name || "instructor"}\n\nJoin the stream at: ${watchUrl}`;

  // Build .ics content
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LeanSporty//Live Stream//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${stream.id}@leansporty.com
DTSTAMP:${formatICSDate(now)}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${watchUrl}
URL:${watchUrl}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Stream starts in 1 hour
END:VALARM
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Stream starts in 15 minutes
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return ics;
}

/**
 * Download a .ics file
 */
export function downloadICS(stream: LiveStreamSession, watchUrl: string) {
  const icsContent = generateICS(stream, watchUrl);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${stream.title.replace(/[^a-z0-9]/gi, "_")}_livestream.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
