export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Still dark';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'After dark';
}

export function formatMarkDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export function formatJournalDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function monthGroup(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function sightingCopy(count: number): string {
  if (count === 2) {
    return "You've seen this species twice.";
  }
  return `You've seen this species ${count} times.`;
}
