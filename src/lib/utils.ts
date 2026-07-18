export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  if (isNaN(num)) return '';

  let isNegative = false;
  if (num < 0) {
    isNegative = true;
    num = Math.abs(num);
  }

  // Handle decimals by flooring
  num = Math.floor(num);

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwoDigits = (n: number) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  };

  const convertThreeDigits = (n: number) => {
    if (n < 100) return convertTwoDigits(n);
    return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertTwoDigits(n % 100) : '');
  };

  if (num < 1000) {
    return (isNegative ? 'Negative ' : '') + convertThreeDigits(num) + ' Rupees';
  }

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;

  let words = '';

  if (crores > 0) {
    words += convertThreeDigits(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertTwoDigits(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertTwoDigits(thousands) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertThreeDigits(remainder);
  }

  let finalWords = words.trim();
  if (isNegative) finalWords = 'Negative ' + finalWords;

  return finalWords + ' Rupees';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

