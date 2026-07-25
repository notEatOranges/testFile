# pbsf-validator

Validation utilities from `@pbsf/validator` for form validation.

## Usage

```bash
/skill pbsf-validator
```

## Import

```javascript
import {
  isPhone,
  isTel,
  isIdCard,
  isEmail,
  isURL,
  isHttp,
  isExternal,
  isValidPassword,
  isZipCodePass,
  isPassportPass,
  isHkPass,
  isTwPass,
  isSocialCreditCode,
  isNumberStr,
  isString,
  isArray,
  isAlphabets,
  isLowerCase,
  isUpperCase,
  isPic
} from '@pbsf/validator';
```

## Phone and Telephone Validation

### isPhone - Mobile Number

```javascript
import { isPhone } from '@pbsf/validator';

// In form validation rules
const rules = reactive({
  phone: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback();
        } else if (!isPhone(value)) {
          callback(new Error('请输入正确的手机号'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
});
```

### isTel - Landline Number

```javascript
import { isTel } from '@pbsf/validator';

// Phone field accepts either mobile or landline
const rules = reactive({
  contactPhone: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback();
        } else if (!isPhone(value) && !isTel(value)) {
          callback(new Error('请输入正确的联系电话'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
});
```

## ID Card and Document Validation

### isIdCard - Chinese ID Card

```javascript
import { isIdCard } from '@pbsf/validator';

const rules = reactive({
  idCard: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback();
        } else if (!isIdCard(value)) {
          callback(new Error('请输入正确的身份证号'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
});
```

### isPassportPass - Passport

```javascript
import { isPassportPass } from '@pbsf/validator';

const rules = reactive({
  passport: [
    { validator: (rule, value, callback) => {
      if (value && !isPassportPass(value)) {
        callback(new Error('请输入正确的护照号码'));
      } else {
        callback();
      }
    }, trigger: 'blur' },
  ],
});
```

### isHkPass - Hong Kong/Macau Pass

```javascript
import { isHkPass } from '@pbsf/validator';
```

### isTwPass - Taiwan Pass

```javascript
import { isTwPass } from '@pbsf/validator';
```

### isSocialCreditCode - Unified Social Credit Code

```javascript
import { isSocialCreditCode } from '@pbsf/validator';

const rules = reactive({
  creditCode: [
    { validator: (rule, value, callback) => {
      if (value && !isSocialCreditCode(value)) {
        callback(new Error('请输入正确的统一社会信用代码'));
      } else {
        callback();
      }
    }, trigger: 'blur' },
  ],
});
```

### isZipCodePass - Zip Code

```javascript
import { isZipCodePass } from '@pbsf/validator';
```

## Email and URL Validation

### isEmail - Email Address

```javascript
import { isEmail } from '@pbsf/validator';

const rules = reactive({
  email: [
    { validator: (rule, value, callback) => {
      if (value && !isEmail(value)) {
        callback(new Error('请输入正确的邮箱地址'));
      } else {
        callback();
      }
    }, trigger: 'blur' },
  ],
});
```

### isURL - URL

```javascript
import { isURL } from '@pbsf/validator';

// Checks if string is a valid URL
if (isURL(urlString)) {
  // Valid URL
}
```

### isHttp - HTTP/HTTPS URL

```javascript
import { isHttp } from '@pbsf/validator';

// Checks if URL starts with http:// or https://
if (isHttp(urlString)) {
  // HTTP/HTTPS URL
}
```

### isExternal - External Link

```javascript
import { isExternal } from '@pbsf/validator';

// Checks if path is an external link
if (isExternal(path)) {
  // External link
}
```

### isPic - Image URL

```javascript
import { isPic } from '@pbsf/validator';

// Checks if URL is an image (png, jpg, jpeg, webp, gif, bmp, svg)
if (isPic(urlString)) {
  // Image URL
}
```

## Password Validation

### isValidPassword - Password Strength

```javascript
import { isValidPassword } from '@pbsf/validator';

// Password rules:
// - Length: 8-18 characters
// - Must contain: numbers, letters, special characters (2+ types)
// - Special chars: @ # $ % ^ & *
// - Case sensitive
// - No spaces

const rules = reactive({
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!isValidPassword(value)) {
        callback(new Error('密码长度8-18位，必须包含数字、字母、特殊字符(@#$%^&*)中的两种或以上'));
      } else {
        callback();
      }
    }, trigger: 'blur' },
  ],
});
```

## String and Number Validation

### isNumberStr - Numeric String

```javascript
import { isNumberStr } from '@pbsf/validator';

// Checks if string contains only numbers
if (isNumberStr(str)) {
  // String is numeric
}
```

### isString - String Type Check

```javascript
import { isString } from '@pbsf/validator';

if (isString(value)) {
  // Value is a string
}
```

### isArray - Array Type Check

```javascript
import { isArray } from '@pbsf/validator';

if (isArray(value)) {
  // Value is an array
}
```

### isAlphabets - Letters Only

```javascript
import { isAlphabets } from '@pbsf/validator';

// Checks if string contains only letters (a-z, A-Z)
if (isAlphabets(str)) {
  // String is alphabetic
}
```

### isLowerCase - Lowercase Letters

```javascript
import { isLowerCase } from '@pbsf/validator';

// Checks if string is all lowercase letters
if (isLowerCase(str)) {
  // String is lowercase
}
```

### isUpperCase - Uppercase Letters

```javascript
import { isUpperCase } from '@pbsf/validator';

// Checks if string is all uppercase letters
if (isUpperCase(str)) {
  // String is uppercase
}
```

## Regex Patterns (Available but less commonly used)

```javascript
import {
  phonePattern,      // Phone number regex
  telPattern,        // Telephone regex
  emailPattern,      // Email regex
  idCardPattern,     // ID card regex
  urlPattern,        // URL regex
  numberPattren,     // Number regex
  passportPattren,   // Passport regex
  hkPassPattren,     // HK/Macau pass regex
  twPassPattren,     // Taiwan pass regex
  socialCreditCodePattern,  // Social credit code regex
  zipCodePattern     // Zip code regex
} from '@pbsf/validator';
```

## Complete Form Validation Example

```vue
<template>
  <el-form ref="formRef" :model="form" :rules="rules">
    <el-form-item label="手机号" prop="phone">
      <el-input v-model="form.phone" />
    </el-form-item>
    <el-form-item label="联系电话" prop="contactPhone">
      <el-input v-model="form.contactPhone" />
    </el-form-item>
    <el-form-item label="身份证号" prop="idCard">
      <el-input v-model="form.idCard" />
    </el-form-item>
    <el-form-item label="邮箱" prop="email">
      <el-input v-model="form.email" />
    </el-form-item>
  </el-form>
</template>

<script setup>
import { isPhone, isTel, isIdCard, isEmail } from '@pbsf/validator';

const rules = reactive({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && !isPhone(value)) {
        callback(new Error('请输入正确的手机号'));
      } else {
        callback();
      }
    }, trigger: 'blur' },
  ],
  contactPhone: [
    { validator: (rule, value, callback) => {
      if (value && !isPhone(value) && !isTel(value)) {
        callback(new Error('请输入正确的联系电话'));
      } else {
        callback();
      }
    }, trigger: 'blur' },
  ],
  idCard: [
    { validator: (rule, value, callback) => {
      if (value && !isIdCard(value)) {
        callback(new Error('请输入正确的身份证号'));
      } else {
        callback();
      }
    }, trigger: 'blur' },
  ],
  email: [
    { validator: (rule, value, callback) => {
      if (value && !isEmail(value)) {
        callback(new Error('请输入正确的邮箱地址'));
      } else {
        callback();
      }
    }, trigger: 'blur' },
  ],
});
</script>
```

## Key Points

1. Import validators: `import { isPhone, isTel, ... } from '@pbsf/validator';`
2. Use in custom validator functions with `callback(new Error('message'))` for invalid values
3. Always check if value exists before validating (optional fields)
4. Common pattern: `if (!value) { callback(); } else if (!isPhone(value)) { callback(new Error('...')); } else { callback(); }`
5. For combined validation (phone OR tel), use: `!isPhone(value) && !isTel(value)`
