/**
 * Bilingual Validation Error Messages
 * Provides consistent error messages in both Chinese and English
 */

import { z } from 'zod';
// Basic language type compatible with next-intl locale strings
export type Language = string;

/**
 * Helper function to translate Zod type names to Chinese
 */
function getTypeNameInChinese(type: string): string {
  const typeMap: Record<string, string> = {
    string: '字符串',
    number: '数字',
    bigint: '大整数',
    boolean: '布尔值',
    symbol: '符号',
    undefined: '未定义',
    object: '对象',
    function: '函数',
    array: '数组',
    null: '空值',
    nan: 'NaN',
    integer: '整数',
    float: '浮点数',
    date: '日期',
    map: 'Map',
    set: 'Set',
    promise: 'Promise',
    void: 'void',
    never: 'never',
    unknown: '未知类型',
  };
  return typeMap[type] || type;
}

/**
 * Zod Chinese Error Map
 * Provides Chinese translations for common Zod validation errors
 * Compatible with Zod v4 API
 */
export const zodChineseErrorMap: z.core.$ZodErrorMap = issue => {
  const code = issue.code;

  // Handle invalid_type
  if (code === 'invalid_type') {
    const received = (issue as { received?: string }).received;
    const expected = (issue as { expected?: string }).expected;
    if (received === 'undefined') {
      return '此字段为必填项';
    } else if (received === 'null') {
      return '此字段不能为空';
    } else {
      return `类型错误，期望 ${getTypeNameInChinese(expected || '')}，收到 ${getTypeNameInChinese(received || '')}`;
    }
  }

  // Handle too_small
  if (code === 'too_small') {
    const issueData = issue as {
      origin?: string;
      minimum?: number;
      inclusive?: boolean;
    };
    const origin = issueData.origin;
    const minimum = issueData.minimum;

    if (origin === 'string') {
      if (minimum === 1) {
        return '此字段不能为空';
      }
      return `最少需要 ${minimum} 个字符`;
    } else if (origin === 'number') {
      if (issueData.inclusive) {
        return `数值不能小于 ${minimum}`;
      }
      return `数值必须大于 ${minimum}`;
    } else if (origin === 'array') {
      return `数组至少需要 ${minimum} 个元素`;
    }
    return `值太小，最小值为 ${minimum}`;
  }

  // Handle too_big
  if (code === 'too_big') {
    const issueData = issue as {
      origin?: string;
      maximum?: number;
      inclusive?: boolean;
    };
    const origin = issueData.origin;
    const maximum = issueData.maximum;

    if (origin === 'string') {
      return `最多允许 ${maximum} 个字符`;
    } else if (origin === 'number') {
      if (issueData.inclusive) {
        return `数值不能大于 ${maximum}`;
      }
      return `数值必须小于 ${maximum}`;
    } else if (origin === 'array') {
      return `数组最多允许 ${maximum} 个元素`;
    }
    return `值太大，最大值为 ${maximum}`;
  }

  // Handle invalid_format (replaces invalid_string in v4)
  if (code === 'invalid_format') {
    const format = (issue as { format?: string }).format;
    if (format === 'email') {
      return '无效的邮箱地址';
    } else if (format === 'url') {
      return '无效的网址';
    } else if (format === 'uuid') {
      return '无效的 UUID';
    } else if (format === 'regex') {
      return '格式不正确';
    } else if (format === 'datetime') {
      return '无效的日期时间格式';
    } else if (format === 'ip' || format === 'ipv4' || format === 'ipv6') {
      return '无效的 IP 地址';
    }
    return '无效的格式';
  }

  // Handle invalid_value (replaces invalid_enum_value in v4)
  if (code === 'invalid_value') {
    const options = (issue as { values?: unknown[] }).values;
    if (options) {
      return `无效的选项，有效值为: ${options.join(', ')}`;
    }
    return '无效的值';
  }

  // Handle unrecognized_keys
  if (code === 'unrecognized_keys') {
    const keys = (issue as { keys?: string[] }).keys;
    return `对象包含未知字段: ${keys?.join(', ') || ''}`;
  }

  // Handle invalid_union
  if (code === 'invalid_union') {
    return '输入不匹配任何有效选项';
  }

  // Handle not_multiple_of
  if (code === 'not_multiple_of') {
    const divisor = (issue as { divisor?: number }).divisor;
    return `数值必须是 ${divisor} 的倍数`;
  }

  // Handle custom errors
  if (code === 'custom') {
    return issue.message || '验证失败';
  }

  // Default fallback
  return issue.message || '验证失败';
};

/**
 * Initialize Zod with Chinese error messages
 * Call this function once at application startup
 */
export function initZodChineseErrors(): void {
  z.config({ customError: zodChineseErrorMap });
}

/**
 * Validation error message keys and their translations
 */
export const validationMessages = {
  // Required field errors
  required: {
    zh: '此字段为必填项',
    en: 'This field is required',
  },

  // String validation
  stringTooShort: {
    zh: '输入内容太短',
    en: 'Input is too short',
  },
  stringTooLong: {
    zh: '输入内容太长',
    en: 'Input is too long',
  },
  invalidFormat: {
    zh: '格式无效',
    en: 'Invalid format',
  },

  // Number validation
  numberTooSmall: {
    zh: '数值太小',
    en: 'Number is too small',
  },
  numberTooLarge: {
    zh: '数值太大',
    en: 'Number is too large',
  },
  mustBePositive: {
    zh: '必须为正数',
    en: 'Must be a positive number',
  },
  mustBeInteger: {
    zh: '必须为整数',
    en: 'Must be an integer',
  },

  // Quilt-specific validation
  quilt: {
    itemNumberRequired: {
      zh: '编号为必填项',
      en: 'Item number is required',
    },
    itemNumberPositive: {
      zh: '编号必须为正数',
      en: 'Item number must be positive',
    },
    itemNumberDuplicate: {
      zh: '此编号已存在',
      en: 'This item number already exists',
    },
    nameRequired: {
      zh: '名称为必填项',
      en: 'Name is required',
    },
    nameTooLong: {
      zh: '名称过长（最多100个字符）',
      en: 'Name is too long (max 100 characters)',
    },
    lengthRequired: {
      zh: '长度为必填项',
      en: 'Length is required',
    },
    lengthPositive: {
      zh: '长度必须为正数',
      en: 'Length must be positive',
    },
    widthRequired: {
      zh: '宽度为必填项',
      en: 'Width is required',
    },
    widthPositive: {
      zh: '宽度必须为正数',
      en: 'Width must be positive',
    },
    weightRequired: {
      zh: '重量为必填项',
      en: 'Weight is required',
    },
    weightPositive: {
      zh: '重量必须为正数',
      en: 'Weight must be positive',
    },
    fillMaterialRequired: {
      zh: '填充物为必填项',
      en: 'Fill material is required',
    },
    colorRequired: {
      zh: '颜色为必填项',
      en: 'Color is required',
    },
    locationRequired: {
      zh: '位置为必填项',
      en: 'Location is required',
    },
    seasonRequired: {
      zh: '季节为必填项',
      en: 'Season is required',
    },
    statusRequired: {
      zh: '状态为必填项',
      en: 'Status is required',
    },
    invalidSeason: {
      zh: '无效的季节选项',
      en: 'Invalid season option',
    },
    invalidStatus: {
      zh: '无效的状态选项',
      en: 'Invalid status option',
    },
  },

  // Usage tracking validation
  usage: {
    quiltIdRequired: {
      zh: '被子ID为必填项',
      en: 'Quilt ID is required',
    },
    startDateRequired: {
      zh: '开始日期为必填项',
      en: 'Start date is required',
    },
    endDateInvalid: {
      zh: '结束日期必须晚于开始日期',
      en: 'End date must be after start date',
    },
    dateInFuture: {
      zh: '日期不能是未来时间',
      en: 'Date cannot be in the future',
    },
    alreadyInUse: {
      zh: '该被子已在使用中',
      en: 'This quilt is already in use',
    },
    notInUse: {
      zh: '该被子当前未在使用中',
      en: 'This quilt is not currently in use',
    },
  },

  // Maintenance validation
  maintenance: {
    typeRequired: {
      zh: '维护类型为必填项',
      en: 'Maintenance type is required',
    },
    descriptionRequired: {
      zh: '描述为必填项',
      en: 'Description is required',
    },
    dateRequired: {
      zh: '日期为必填项',
      en: 'Date is required',
    },
    costInvalid: {
      zh: '费用必须为非负数',
      en: 'Cost must be non-negative',
    },
  },

  // Import/Export validation
  importExport: {
    fileRequired: {
      zh: '请选择文件',
      en: 'Please select a file',
    },
    invalidFileType: {
      zh: '文件类型无效',
      en: 'Invalid file type',
    },
    fileTooLarge: {
      zh: '文件太大',
      en: 'File is too large',
    },
    emptyFile: {
      zh: '文件为空',
      en: 'File is empty',
    },
    invalidData: {
      zh: '数据格式无效',
      en: 'Invalid data format',
    },
    missingRequiredColumns: {
      zh: '缺少必需的列',
      en: 'Missing required columns',
    },
  },

  // Authentication validation
  auth: {
    passwordRequired: {
      zh: '密码为必填项',
      en: 'Password is required',
    },
    passwordTooShort: {
      zh: '密码太短（至少8个字符）',
      en: 'Password is too short (minimum 8 characters)',
    },
    passwordInvalid: {
      zh: '密码错误',
      en: 'Invalid password',
    },
    sessionExpired: {
      zh: '会话已过期，请重新登录',
      en: 'Session expired, please login again',
    },
  },

  // Network and system errors
  system: {
    networkError: {
      zh: '网络连接失败',
      en: 'Network connection failed',
    },
    serverError: {
      zh: '服务器错误',
      en: 'Server error',
    },
    unknownError: {
      zh: '未知错误',
      en: 'Unknown error',
    },
    notFound: {
      zh: '未找到',
      en: 'Not found',
    },
    unauthorized: {
      zh: '未授权',
      en: 'Unauthorized',
    },
    forbidden: {
      zh: '禁止访问',
      en: 'Forbidden',
    },
  },
} as const;

/**
 * Get a validation error message in the specified language
 * @param key - The message key (can be nested with dots, e.g., 'quilt.nameRequired')
 * @param language - The language to use
 * @returns The translated error message
 */
export function getValidationMessage(key: string, language: Language): string {
  try {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = validationMessages;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return key;
      }
    }

    if (current && typeof current === 'object' && language in current) {
      return current[language];
    }

    return key;
  } catch {
    return key;
  }
}

/**
 * Get a validation error message with dynamic values
 * @param key - The message key
 * @param language - The language to use
 * @param values - Object with values to interpolate into the message
 * @returns The translated error message with interpolated values
 */
export function getValidationMessageWithValues(
  key: string,
  language: Language,
  values: Record<string, string | number>
): string {
  let message = getValidationMessage(key, language);

  // Replace placeholders like {fieldName} with actual values
  Object.entries(values).forEach(([placeholder, value]) => {
    message = message.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
  });

  return message;
}

/**
 * Create a custom validation message for min/max constraints
 */
export function getMinMaxMessage(
  type: 'min' | 'max',
  value: number,
  language: Language,
  unit?: string
): string {
  const unitStr = unit ? ` ${unit}` : '';

  if (type === 'min') {
    return language === 'zh'
      ? `最小值为 ${value}${unitStr}`
      : `Minimum value is ${value}${unitStr}`;
  } else {
    return language === 'zh'
      ? `最大值为 ${value}${unitStr}`
      : `Maximum value is ${value}${unitStr}`;
  }
}

/**
 * Create a custom validation message for length constraints
 */
export function getLengthMessage(type: 'min' | 'max', length: number, language: Language): string {
  if (type === 'min') {
    return language === 'zh'
      ? `最少需要 ${length} 个字符`
      : `Minimum ${length} characters required`;
  } else {
    return language === 'zh' ? `最多允许 ${length} 个字符` : `Maximum ${length} characters allowed`;
  }
}
