/**
 * 表单验证规则
 */

// 必填验证
export const requiredRule = (message = '此项为必填项') => {
  return { required: true, message, trigger: 'blur' }
}

// 手机号验证
export const phoneRule = (message = '请输入正确的手机号') => {
  return {
    pattern: /^1[3-9]\d{9}$/,
    message,
    trigger: 'blur'
  }
}

// 邮箱验证
export const emailRule = (message = '请输入正确的邮箱地址') => {
  return {
    type: 'email',
    message,
    trigger: 'blur'
  }
}

// 身份证号验证
export const idCardRule = (message = '请输入正确的身份证号') => {
  return {
    pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
    message,
    trigger: 'blur'
  }
}

// 统一社会信用代码验证
export const creditCodeRule = (message = '请输入正确的统一社会信用代码') => {
  return {
    pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
    message,
    trigger: 'blur'
  }
}

// 数字范围验证
export const numberRangeRule = (min, max, message) => {
  return {
    validator: (rule, value, callback) => {
      if (value === '' || value === null || value === undefined) {
        callback()
      } else {
        const num = Number(value)
        if (num < min || num > max) {
          callback(new Error(message || `请输入${min}到${max}之间的数字`))
        } else {
          callback()
        }
      }
    },
    trigger: 'blur'
  }
}

// 最小长度验证
export const minLengthRule = (min, message) => {
  return {
    min,
    message: message || `长度不能少于${min}个字符`,
    trigger: 'blur'
  }
}

// 最大长度验证
export const maxLengthRule = (max, message) => {
  return {
    max,
    message: message || `长度不能超过${max}个字符`,
    trigger: 'blur'
  }
}

// 密码验证
export const passwordRule = (message = '密码长度为6-20位') => {
  return {
    min: 6,
    max: 20,
    message,
    trigger: 'blur'
  }
}

// 确认密码验证
export const confirmPasswordRule = (passwordField = 'password') => {
  return {
    validator: (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== passwordField) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }
}

// URL验证
export const urlRule = (message = '请输入正确的URL地址') => {
  return {
    pattern: /^https?:\/\/.+/,
    message,
    trigger: 'blur'
  }
}

// 常用表单验证规则集合
export const commonRules = {
  required: requiredRule,
  phone: phoneRule,
  email: emailRule,
  idCard: idCardRule,
  creditCode: creditCodeRule,
  password: passwordRule,
  url: urlRule
}
