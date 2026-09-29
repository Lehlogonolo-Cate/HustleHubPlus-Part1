// Client-side checks mirror the API's rules so users get instant feedback.
// They are a convenience only: the API validates everything again.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{L}\s'-]+$/u;

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'lower', label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'A number', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'A special character', test: (p) => /[^a-zA-Z0-9]/.test(p) }
];

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateRegistration({ name, email, password, confirmPassword, role }) {
  const errors = validateLogin({ email, password });
  const trimmedName = name.trim();

  if (trimmedName.length < 2 || trimmedName.length > 60) errors.name = 'Name must be between 2 and 60 characters';
  else if (!NAME_PATTERN.test(trimmedName)) errors.name = 'Name may only contain letters, spaces, apostrophes and hyphens';

  if (password && !PASSWORD_RULES.every((rule) => rule.test(password))) {
    errors.password = 'Password does not meet all the requirements';
  }
  // Compares two values the user typed in the same form; no secret is involved
  // eslint-disable-next-line security/detect-possible-timing-attacks
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  if (!['client', 'freelancer'].includes(role)) errors.role = 'Choose an account type';

  return errors;
}

export function validateGig({ title, description, category, price, deliveryDays }) {
  const errors = {};
  const priceNumber = Number(price);
  const days = Number(deliveryDays);

  if (title.trim().length < 5 || title.trim().length > 100) errors.title = 'Title must be between 5 and 100 characters';
  if (description.trim().length < 20 || description.trim().length > 2000) {
    errors.description = 'Description must be between 20 and 2000 characters';
  }
  if (!category) errors.category = 'Choose a category';
  if (!Number.isFinite(priceNumber) || priceNumber < 50 || priceNumber > 1000000) {
    errors.price = 'Price must be between R50 and R1,000,000';
  } else if (Math.abs(priceNumber * 100 - Math.round(priceNumber * 100)) > 1e-6) {
    errors.price = 'Price may have at most two decimal places';
  }
  if (!Number.isInteger(days) || days < 1 || days > 90) errors.deliveryDays = 'Delivery time must be 1 to 90 days';

  return errors;
}
