// Generates a short, human-readable, unique-enough booking code.
// Format: LMS-XXXXXX (uppercase alphanumeric)
export function generateBookingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `LMS-${code}`
}
