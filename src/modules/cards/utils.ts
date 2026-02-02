/**
 * Card Utility Functions
 *
 * Shared helpers for formatting and display across card components.
 * Eliminates duplicate utility functions in CardCard, CardListView, CardDetail.
 */

// ========== Currency Formatting ==========

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ========== Display Name Helpers ==========

export function getSportDisplayName(sport: string | null | undefined): string {
  if (!sport) return '-';
  const sportMap: Record<string, string> = {
    BASKETBALL: '篮球',
    SOCCER: '足球',
    OTHER: '其他',
  };
  return sportMap[sport] || sport;
}

export function getStatusDisplayName(status: string | null | undefined): string {
  if (!status) return '-';
  const statusMap: Record<string, string> = {
    COLLECTION: '收藏中',
    FOR_SALE: '待售',
    SOLD: '已售出',
    GRADING: '评级中',
    DISPLAY: '展示中',
  };
  return statusMap[status] || status;
}

export function getGradingCompanyDisplayName(company: string | null | undefined): string {
  if (!company || company === 'UNGRADED') return '未评级';
  return company;
}

// ========== Badge Color Helpers ==========

export function getSportBadgeColor(sport: string | null | undefined): string {
  if (!sport) return 'bg-gray-100 text-gray-800';
  const colorMap: Record<string, string> = {
    BASKETBALL: 'bg-orange-100 text-orange-800',
    SOCCER: 'bg-green-100 text-green-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };
  return colorMap[sport] || 'bg-gray-100 text-gray-800';
}

export function getStatusBadgeColor(status: string | null | undefined): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  const colorMap: Record<string, string> = {
    COLLECTION: 'bg-blue-100 text-blue-800',
    FOR_SALE: 'bg-yellow-100 text-yellow-800',
    SOLD: 'bg-green-100 text-green-800',
    GRADING: 'bg-purple-100 text-purple-800',
    DISPLAY: 'bg-pink-100 text-pink-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

export function getGradeBadgeColor(grade: number | null | undefined): string {
  if (!grade) return 'bg-gray-100 text-gray-600';
  if (grade >= 9.5) return 'bg-green-100 text-green-800';
  if (grade >= 9) return 'bg-blue-100 text-blue-800';
  if (grade >= 8) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-600';
}

// ========== Date Formatting ==========

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('zh-CN');
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('zh-CN');
}

// ========== ROI Calculation ==========

export function calculateROI(
  purchasePrice: number | null | undefined,
  currentValue: number | null | undefined
): string {
  if (!purchasePrice || !currentValue || purchasePrice === 0) return '-';
  const roi = ((currentValue - purchasePrice) / purchasePrice) * 100;
  const sign = roi >= 0 ? '+' : '';
  return `${sign}${roi.toFixed(2)}%`;
}

export function calculateROIValue(
  purchasePrice: number | null | undefined,
  currentValue: number | null | undefined
): number | null {
  if (!purchasePrice || !currentValue || purchasePrice === 0) return null;
  return ((currentValue - purchasePrice) / purchasePrice) * 100;
}

// ========== Grade Formatting ==========

export function formatGrade(
  gradingCompany: string | null | undefined,
  grade: number | null | undefined
): string {
  if (!gradingCompany || gradingCompany === 'UNGRADED') return '未评级';
  if (!grade) return gradingCompany;
  return `${gradingCompany} ${grade}`;
}

// ========== Image Parsing ==========

/**
 * Parse attachmentImages field which might be array, JSON string, or single URL
 */
export function parseBackImage(attachments: unknown): string | null {
  if (!attachments) return null;

  // Already an array
  if (Array.isArray(attachments) && attachments.length > 0) {
    return typeof attachments[0] === 'string' ? attachments[0] : null;
  }

  // String that might be JSON
  if (typeof attachments === 'string') {
    try {
      const parsed = JSON.parse(attachments);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return typeof parsed[0] === 'string' ? parsed[0] : null;
      }
    } catch {
      // Raw URL string
      if (attachments.startsWith('data:') || attachments.startsWith('http')) {
        return attachments;
      }
    }
  }

  return null;
}
