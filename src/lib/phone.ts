export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("61") && digits.length === 11) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `+61${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith("4")) {
    return `+61${digits}`;
  }

  return null;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length === 11) {
    const local = `0${digits.slice(2)}`;
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return phone;
}
