/** Start of the given calendar day in UTC (00:00:00.000Z). */
export function startOfUtcDay(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
