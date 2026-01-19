/**
 * Card Grading Management Service
 * 
 * This service provides functionality for managing sports card grading information.
 * It supports multiple grading companies (PSA, BGS, SGC, CGC) and provides
 * utilities for working with grading data.
 * 
 * Features:
 * - Support for multiple grading systems
 * - Grade validation and conversion
 * - Grading company information
 * - Grade quality assessment
 * 
 * Requirements: 5.2
 */

/**
 * Supported grading companies
 */
export enum GradingCompany {
  PSA = 'PSA',
  BGS = 'BGS',
  SGC = 'SGC',
  CGC = 'CGC',
  UNGRADED = 'UNGRADED',
}

/**
 * Grading company information
 */
export interface GradingCompanyInfo {
  id: GradingCompany;
  name: string;
  fullName: string;
  website: string;
  minGrade: number;
  maxGrade: number;
  gradeScale: string;
  description: string;
}

/**
 * Grade quality level
 */
export enum GradeQuality {
  POOR = 'POOR',
  FAIR = 'FAIR',
  GOOD = 'GOOD',
  VERY_GOOD = 'VERY_GOOD',
  EXCELLENT = 'EXCELLENT',
  NEAR_MINT = 'NEAR_MINT',
  MINT = 'MINT',
  GEM_MINT = 'GEM_MINT',
  PRISTINE = 'PRISTINE',
}

/**
 * Grading company information database
 */
export const GRADING_COMPANIES: Record<GradingCompany, GradingCompanyInfo> = {
  [GradingCompany.PSA]: {
    id: GradingCompany.PSA,
    name: 'PSA',
    fullName: 'Professional Sports Authenticator',
    website: 'https://www.psacard.com',
    minGrade: 1,
    maxGrade: 10,
    gradeScale: '1-10',
    description: 'PSA是最知名的球星卡评级公司，以严格的评级标准和市场认可度著称。',
  },
  [GradingCompany.BGS]: {
    id: GradingCompany.BGS,
    name: 'BGS',
    fullName: 'Beckett Grading Services',
    website: 'https://www.beckett.com/grading',
    minGrade: 1,
    maxGrade: 10,
    gradeScale: '1-10 (with sub-grades)',
    description: 'BGS提供详细的子评级（边角、边缘、表面、居中），评级更加细致。',
  },
  [GradingCompany.SGC]: {
    id: GradingCompany.SGC,
    name: 'SGC',
    fullName: 'Sportscard Guaranty Corporation',
    website: 'https://www.gosgc.com',
    minGrade: 1,
    maxGrade: 10,
    gradeScale: '1-10',
    description: 'SGC是历史悠久的评级公司，以快速周转和合理价格著称。',
  },
  [GradingCompany.CGC]: {
    id: GradingCompany.CGC,
    name: 'CGC',
    fullName: 'Certified Guaranty Company',
    website: 'https://www.cgccards.com',
    minGrade: 1,
    maxGrade: 10,
    gradeScale: '1-10',
    description: 'CGC是较新的评级公司，以透明的评级流程和创新技术著称。',
  },
  [GradingCompany.UNGRADED]: {
    id: GradingCompany.UNGRADED,
    name: '未评级',
    fullName: 'Ungraded',
    website: '',
    minGrade: 0,
    maxGrade: 0,
    gradeScale: 'N/A',
    description: '未经专业评级公司评级的球星卡。',
  },
};

/**
 * Get grading company information
 * 
 * @param company - The grading company
 * @returns Grading company information
 */
export function getGradingCompanyInfo(
  company: GradingCompany
): GradingCompanyInfo {
  return GRADING_COMPANIES[company];
}

/**
 * Get all grading companies
 * 
 * @returns Array of all grading company information
 */
export function getAllGradingCompanies(): GradingCompanyInfo[] {
  return Object.values(GRADING_COMPANIES).filter(
    (company) => company.id !== GradingCompany.UNGRADED
  );
}

/**
 * Validate grade for a grading company
 * 
 * @param company - The grading company
 * @param grade - The grade to validate
 * @returns True if valid, false otherwise
 */
export function isValidGrade(
  company: GradingCompany,
  grade: number
): boolean {
  if (company === GradingCompany.UNGRADED) {
    return false;
  }

  const info = GRADING_COMPANIES[company];
  return grade >= info.minGrade && grade <= info.maxGrade;
}

/**
 * Get grade quality level
 * 
 * This function maps a numeric grade to a quality level descriptor.
 * 
 * @param grade - The numeric grade (1-10)
 * @returns Grade quality level
 */
export function getGradeQuality(grade: number): GradeQuality {
  if (grade >= 10) return GradeQuality.PRISTINE;
  if (grade >= 9.5) return GradeQuality.GEM_MINT;
  if (grade >= 9) return GradeQuality.MINT;
  if (grade >= 8) return GradeQuality.NEAR_MINT;
  if (grade >= 7) return GradeQuality.EXCELLENT;
  if (grade >= 6) return GradeQuality.VERY_GOOD;
  if (grade >= 4) return GradeQuality.GOOD;
  if (grade >= 2) return GradeQuality.FAIR;
  return GradeQuality.POOR;
}

/**
 * Get grade quality label in Chinese
 * 
 * @param quality - The grade quality level
 * @returns Chinese label
 */
export function getGradeQualityLabel(quality: GradeQuality): string {
  const labels: Record<GradeQuality, string> = {
    [GradeQuality.POOR]: '差',
    [GradeQuality.FAIR]: '一般',
    [GradeQuality.GOOD]: '良好',
    [GradeQuality.VERY_GOOD]: '很好',
    [GradeQuality.EXCELLENT]: '优秀',
    [GradeQuality.NEAR_MINT]: '近乎完美',
    [GradeQuality.MINT]: '完美',
    [GradeQuality.GEM_MINT]: '宝石级完美',
    [GradeQuality.PRISTINE]: '原始完美',
  };
  return labels[quality];
}

/**
 * Get grade description
 * 
 * @param company - The grading company
 * @param grade - The numeric grade
 * @returns Formatted grade description
 */
export function getGradeDescription(
  company: GradingCompany,
  grade: number | null
): string {
  if (!grade || company === GradingCompany.UNGRADED) {
    return '未评级';
  }

  const quality = getGradeQuality(grade);
  const qualityLabel = getGradeQualityLabel(quality);
  const companyInfo = GRADING_COMPANIES[company];

  return `${companyInfo.name} ${grade} - ${qualityLabel}`;
}

/**
 * Compare grades across different companies
 * 
 * This function provides a rough comparison of grades from different companies.
 * Note: This is approximate as grading standards vary between companies.
 * 
 * @param company - The grading company
 * @param grade - The grade
 * @returns Normalized grade (0-100 scale)
 */
export function normalizeGrade(
  company: GradingCompany,
  grade: number
): number {
  if (company === GradingCompany.UNGRADED) {
    return 0;
  }

  const info = GRADING_COMPANIES[company];
  const range = info.maxGrade - info.minGrade;
  
  // Normalize to 0-100 scale
  return ((grade - info.minGrade) / range) * 100;
}

/**
 * Get grade color for UI display
 * 
 * @param grade - The numeric grade
 * @returns Tailwind CSS color class
 */
export function getGradeColor(grade: number | null): string {
  if (!grade) return 'text-gray-500';
  
  if (grade >= 9.5) return 'text-purple-600';
  if (grade >= 9) return 'text-blue-600';
  if (grade >= 8) return 'text-green-600';
  if (grade >= 7) return 'text-yellow-600';
  if (grade >= 5) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get grade badge color for UI display
 * 
 * @param grade - The numeric grade
 * @returns Tailwind CSS badge color classes
 */
export function getGradeBadgeColor(grade: number | null): string {
  if (!grade) return 'bg-gray-100 text-gray-800';
  
  if (grade >= 9.5) return 'bg-purple-100 text-purple-800';
  if (grade >= 9) return 'bg-blue-100 text-blue-800';
  if (grade >= 8) return 'bg-green-100 text-green-800';
  if (grade >= 7) return 'bg-yellow-100 text-yellow-800';
  if (grade >= 5) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

/**
 * Calculate estimated value multiplier based on grade
 * 
 * Higher grades typically command premium prices. This function provides
 * a rough multiplier estimate based on grade quality.
 * 
 * @param grade - The numeric grade
 * @returns Value multiplier (1.0 = base value)
 */
export function getGradeValueMultiplier(grade: number | null): number {
  if (!grade) return 1.0;
  
  if (grade >= 10) return 5.0;
  if (grade >= 9.5) return 3.5;
  if (grade >= 9) return 2.5;
  if (grade >= 8.5) return 2.0;
  if (grade >= 8) return 1.5;
  if (grade >= 7) return 1.2;
  return 1.0;
}

/**
 * Format certification number
 * 
 * @param certNumber - The certification number
 * @param company - The grading company
 * @returns Formatted certification number
 */
export function formatCertificationNumber(
  certNumber: string | null,
  company: GradingCompany
): string {
  if (!certNumber || company === GradingCompany.UNGRADED) {
    return '-';
  }

  return `${company} #${certNumber}`;
}

/**
 * Get grading company website URL for certification lookup
 * 
 * @param company - The grading company
 * @param certNumber - The certification number
 * @returns URL for certification lookup (if available)
 */
export function getCertificationLookupUrl(
  company: GradingCompany,
  certNumber: string
): string | null {
  switch (company) {
    case GradingCompany.PSA:
      return `https://www.psacard.com/cert/${certNumber}`;
    case GradingCompany.BGS:
      return `https://www.beckett.com/grading/card-lookup/${certNumber}`;
    case GradingCompany.SGC:
      return `https://www.gosgc.com/cert/${certNumber}`;
    case GradingCompany.CGC:
      return `https://www.cgccards.com/certlookup/${certNumber}`;
    default:
      return null;
  }
}

/**
 * Parse grade from string
 * 
 * This function attempts to parse a grade from various string formats.
 * 
 * @param gradeString - The grade string (e.g., "PSA 10", "BGS 9.5", "10")
 * @returns Parsed grade or null if invalid
 */
export function parseGrade(gradeString: string): number | null {
  // Remove common prefixes
  const cleaned = gradeString
    .replace(/^(PSA|BGS|SGC|CGC)\s*/i, '')
    .trim();

  const grade = parseFloat(cleaned);
  
  if (isNaN(grade) || grade < 1 || grade > 10) {
    return null;
  }

  return grade;
}

/**
 * Get grading recommendations based on card condition
 * 
 * @param estimatedCondition - Estimated condition description
 * @returns Recommended grading companies and estimated grades
 */
export function getGradingRecommendations(
  estimatedCondition: string
): Array<{
  company: GradingCompany;
  estimatedGrade: number;
  reason: string;
}> {
  const condition = estimatedCondition.toLowerCase();
  
  const recommendations: Array<{
    company: GradingCompany;
    estimatedGrade: number;
    reason: string;
  }> = [];

  // High-end cards (Mint or better)
  if (
    condition.includes('mint') ||
    condition.includes('pristine') ||
    condition.includes('gem')
  ) {
    recommendations.push({
      company: GradingCompany.PSA,
      estimatedGrade: 9.5,
      reason: 'PSA评级在高端市场最受认可',
    });
    recommendations.push({
      company: GradingCompany.BGS,
      estimatedGrade: 9.5,
      reason: 'BGS提供详细的子评级，适合高端卡片',
    });
  }
  
  // Mid-range cards
  else if (
    condition.includes('excellent') ||
    condition.includes('near mint')
  ) {
    recommendations.push({
      company: GradingCompany.SGC,
      estimatedGrade: 8,
      reason: 'SGC性价比高，周转快',
    });
    recommendations.push({
      company: GradingCompany.CGC,
      estimatedGrade: 8,
      reason: 'CGC价格合理，评级透明',
    });
  }
  
  // Lower grade cards
  else {
    recommendations.push({
      company: GradingCompany.SGC,
      estimatedGrade: 6,
      reason: 'SGC对中低端卡片友好',
    });
  }

  return recommendations;
}
