export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateAuthForm({ email, password, fullName, isRegister }) {
  const errors = {}
  if (isRegister && !fullName?.trim()) errors.fullName = 'Full name is required.'
  if (!email?.trim()) errors.email = 'Email is required.'
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Password is required.'
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters.'
  return errors
}

export function validateProviderProfile({ serviceCategory, location, price }) {
  const errors = {}
  if (!serviceCategory?.trim()) errors.serviceCategory = 'Service category is required.'
  if (!location?.trim()) errors.location = 'Location is required.'
  if (price === '' || price === null || isNaN(price) || Number(price) < 0) {
    errors.price = 'Enter a valid price.'
  }
  return errors
}

export function validateBookingForm({ date, time, location, description }) {
  const errors = {}
  if (!date) errors.date = 'Date is required.'
  else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const picked = new Date(date)
    if (picked < today) errors.date = 'Date cannot be in the past.'
  }
  if (!time) errors.time = 'Time is required.'
  if (!location?.trim()) errors.location = 'Location is required.'
  if (!description?.trim()) errors.description = 'A short description is required.'
  else if (description.trim().length < 10) {
    errors.description = 'Please add a bit more detail (min 10 characters).'
  }
  return errors
}
