/** Internal address for users who sign in with phone only (no real inbox). */
export function placeholderEmailForPhone(phone: string): string {
  return `${phone}@phone.heavyhulk.in`;
}

export function isPlaceholderEmail(email: string): boolean {
  return email.endsWith("@phone.heavyhulk.in");
}
