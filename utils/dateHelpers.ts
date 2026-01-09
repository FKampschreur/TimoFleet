// Gedeelde date/time helper functies

/**
 * Converteer tijd string (HH:MM) naar minuten sinds middernacht
 */
export const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const parts = time.split(':');
  if (parts.length < 2) return 0;
  const [h, m] = parts.map(Number);
  return (isNaN(h) || isNaN(m)) ? 0 : h * 60 + m;
};

/**
 * Converteer minuten sinds middernacht naar tijd string (HH:MM)
 */
export const formatMinToTime = (min: number): string => {
  const h = (Math.floor(min / 60) + 24) % 24;
  const m = Math.round(min % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Bepaal start van week (maandag) voor gegeven datum
 */
export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

/**
 * Format date naar YYYY-MM-DD string
 */
export const toLocalYMD = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Genereer array van 7 dagen vanaf start van week
 */
export const getWeekDays = (startOfWeek: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
};
