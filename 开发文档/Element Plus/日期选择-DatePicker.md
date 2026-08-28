# DatePicker 日期时间选择器

> 来源：[官方文档](https://element-plus.org/zh-CN/component/date-picker.html)

用于选择或输入日期

## 选择某一天 
以”日“为基本单位，基础的日期选择控件

基本单位由 `type` 属性指定。 通过 `shortcuts` 配置快捷选项， 通过 `disabledDate` 函数，来设置禁用掉的日期。

largedefaultsmall

Default

Picker with quick options

_

```vue
<template>
  <el-radio-group v-model="size" aria-label="size control" class="mb-4">
    <el-radio-button value="large">large</el-radio-button>
    <el-radio-button value="default">default</el-radio-button>
    <el-radio-button value="small">small</el-radio-button>
  </el-radio-group>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">Default</span>
      <el-date-picker
        v-model="value1"
        type="date"
        placeholder="Pick a day"
        :size="size"
      />
    </div>
    <div class="block">
      <span class="demonstration">Picker with quick options</span>
      <el-date-picker
        v-model="value2"
        type="date"
        placeholder="Pick a day"
        :disabled-date="disabledDate"
        :shortcuts="shortcuts"
        :size="size"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const size = ref<'default' | 'large' | 'small'>
const value1 = ref
const value2 = ref
const shortcuts = [
  {
    text: 'Today',
    value: new Date(),
  },
  {
    text: 'Yesterday',
    value: () => {
      const date = new Date
      date.setTime(date.getTime() - 3600 * 1000 * 24)
      return date
    },
  },
  {
    text: 'A week ago',
    value: () => {
      const date = new Date
      date.setTime(date.getTime() - 3600 * 1000 * 24 * 7)
      return date
    },
  },
]

const disabledDate = (time: Date) => {
  return time.getTime() > Date.now
}
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .block {
  padding: 1.5rem 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
  min-width: 300px;
}

.demo-date-picker .block:last-child {
  border-right: none;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
}

@media screen and (max-width: 768px) {
  .demo-date-picker .block {
    flex: 0 0 100%;
    padding: 1rem 0;
    min-width: auto;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}
</style>
```

隐藏源代码

## 其他日期单位 
You can choose week, month, year, quarter or multiple dates by extending the standard date picker component.

Week

Year

Month

Quarter

Dates

Years

Months

Quarters

_

```vue
<template>
  <div class="demo-date-picker">
    <div class="container">
      <div class="block">
        <span class="demonstration">Week</span>
        <el-date-picker
          v-model="value1"
          type="week"
          format="[Week] ww"
          placeholder="Pick a week"
        />
      </div>
      <div class="block">
        <span class="demonstration">Year</span>
        <el-date-picker
          v-model="value3"
          type="year"
          placeholder="Pick a year"
        />
      </div>
      <div class="block">
        <span class="demonstration">Month</span>
        <el-date-picker
          v-model="value5"
          type="month"
          placeholder="Pick a month"
        />
      </div>
      <div class="block">
        <span class="demonstration">Quarter</span>
        <el-date-picker
          v-model="value7"
          type="quarter"
          placeholder="Pick a quarter"
        />
      </div>
    </div>
    <div class="container">
      <div class="block">
        <span class="demonstration">Dates</span>
        <el-date-picker
          v-model="value2"
          type="dates"
          placeholder="Pick one or more dates"
        />
      </div>
      <div class="block">
        <span class="demonstration">Years</span>
        <el-date-picker
          v-model="value4"
          type="years"
          placeholder="Pick one or more years"
        />
      </div>
      <div class="block">
        <span class="demonstration">Months</span>
        <el-date-picker
          v-model="value6"
          type="months"
          placeholder="Pick one or more months"
        />
      </div>
      <div class="block">
        <span class="demonstration">Quarters</span>
        <el-date-picker
          v-model="value8"
          type="quarters"
          placeholder="Pick one or more quarters"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref
const value2 = ref
const value3 = ref
const value4 = ref
const value5 = ref
const value6 = ref
const value7 = ref
const value8 = ref
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .container {
  flex: 1;
  min-width: 300px;
  border-right: solid 1px var(--el-border-color);
}

.demo-date-picker .container:last-child {
  border-right: none;
}

.demo-date-picker .block {
  padding: 1.5rem 0;
  text-align: center;
}

.demo-date-picker .container .block:not(:first-child) {
  border-top: solid 1px var(--el-border-color);
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
}

@media screen and (max-width: 768px) {
  .demo-date-picker .container {
    flex: 0 0 100%;
    min-width: auto;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .container:last-child {
    border-bottom: none;
  }

  .demo-date-picker .block {
    padding: 1rem 0;
  }

  .demo-date-picker .container .block:not(:first-child) {
    border-top: solid 1px var(--el-border-color);
  }
}
</style>
```

隐藏源代码

## 选择一段时间 
你可以通过如下例子来学习如何设置一个日期范围选择器。

在选择日期范围时，默认情况下左右面板会联动。 如果希望两个面板各自独立切换当前月份，可以使用 `unlink-panels` 属性解除联动。

largedefaultsmall

Default

To

With quick options

To

_

```vue
<template>
  <el-radio-group v-model="size" aria-label="size control" class="mb-4">
    <el-radio-button value="large">large</el-radio-button>
    <el-radio-button value="default">default</el-radio-button>
    <el-radio-button value="small">small</el-radio-button>
  </el-radio-group>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">Default</span>
      <el-date-picker
        v-model="value1"
        type="daterange"
        range-separator="To"
        start-placeholder="Start date"
        end-placeholder="End date"
        :size="size"
      />
    </div>
    <div class="block">
      <span class="demonstration">With quick options</span>
      <el-date-picker
        v-model="value2"
        type="daterange"
        unlink-panels
        range-separator="To"
        start-placeholder="Start date"
        end-placeholder="End date"
        :shortcuts="shortcuts"
        :size="size"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const size = ref<'default' | 'large' | 'small'>
const value1 = ref
const value2 = ref
const shortcuts = [
  {
    text: 'Last week',
    value: () => {
      const end = new Date
      const start = new Date
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: 'Last month',
    value: () => {
      const end = new Date
      const start = new Date
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: 'Last 3 months',
    value: () => {
      const end = new Date
      const start = new Date
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .block {
  padding: 1.5rem 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.demo-date-picker .block:last-child {
  border-right: none;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
}

@media screen and (max-width: 1200px) {
  .demo-date-picker .block {
    flex: 0 0 100%;
    padding: 1rem 0;
    min-width: auto;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}
</style>
```

隐藏源代码

## 选择月份范围 
你当然还可以选择一个月的范围。

在选择月份范围时，默认情况下左右面板会联动。 如果希望两个面板各自独立切换当前年份，可以使用 `unlink-panels` 属性解除联动。

Default

To

With quick options

To

_

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">Default</span>
      <el-date-picker
        v-model="value1"
        type="monthrange"
        range-separator="To"
        start-placeholder="Start month"
        end-placeholder="End month"
      />
    </div>
    <div class="block">
      <span class="demonstration">With quick options</span>
      <el-date-picker
        v-model="value2"
        type="monthrange"
        unlink-panels
        range-separator="To"
        start-placeholder="Start month"
        end-placeholder="End month"
        :shortcuts="shortcuts"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref
const value2 = ref
const shortcuts = [
  {
    text: 'This month',
    value: [new Date(), new Date()],
  },
  {
    text: 'This year',
    value: () => {
      const end = new Date
      const start = new Date(new Date().getFullYear(), 0)
      return [start, end]
    },
  },
  {
    text: 'Last 6 months',
    value: () => {
      const end = new Date
      const start = new Date
      start.setMonth(start.getMonth() - 6)
      return [start, end]
    },
  },
]
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .block {
  padding: 1.5rem 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
  min-width: 300px;
}

.demo-date-picker .block:last-child {
  border-right: none;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
}

@media screen and (max-width: 768px) {
  .demo-date-picker .block {
    flex: 0 0 100%;
    padding: 1rem 0;
    min-width: auto;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}
</style>
```

隐藏源代码

## 年份范围2.8.0 
你可以通过如下例子来学习如何设置一个年份范围选择器。

在选择范围时，默认情况下左右面板会联动。 如果希望两个面板各自独立切换当前年份，可以使用 `unlink-panels` 属性解除联动。

Default

To

With quick options

To

_

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">Default</span>
      <el-date-picker
        v-model="value1"
        type="yearrange"
        range-separator="To"
        start-placeholder="Start Year"
        end-placeholder="End Year"
      />
    </div>
    <div class="block">
      <span class="demonstration">With quick options</span>
      <el-date-picker
        v-model="value2"
        type="yearrange"
        unlink-panels
        range-separator="To"
        start-placeholder="Start Year"
        end-placeholder="End Year"
        :shortcuts="shortcuts"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref
const value2 = ref
const shortcuts = [
  {
    text: 'This Year',
    value: [new Date(), new Date()],
  },
  {
    text: 'Last 10 years',
    value: () => {
      const end = new Date
      const start = new Date
        new Date().setFullYear(new Date().getFullYear() - 10)
      )
      return [start, end]
    },
  },
  {
    text: 'Next 50 years',
    value: () => {
      const start = new Date
      const end = new Date
        new Date().setFullYear(new Date().getFullYear() + 50)
      )
      return [start, end]
    },
  },
]
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .block {
  padding: 1.5rem 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
  min-width: 300px;
}

.demo-date-picker .block:last-child {
  border-right: none;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
}

@media screen and (max-width: 768px) {
  .demo-date-picker .block {
    flex: 0 0 100%;
    padding: 1rem 0;
    min-width: auto;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}
</style>
```

隐藏源代码

## Quarter Range 2.14.5 
Picking a quarter range is supported.

在选择范围时，默认情况下左右面板会联动。 如果希望两个面板各自独立切换当前年份，可以使用 `unlink-panels` 属性解除联动。

Default

To

With quick options

To

_

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">Default</span>
      <el-date-picker
        v-model="value1"
        type="quarterrange"
        range-separator="To"
        start-placeholder="Start quarter"
        end-placeholder="End quarter"
      />
    </div>
    <div class="block">
      <span class="demonstration">With quick options</span>
      <el-date-picker
        v-model="value2"
        type="quarterrange"
        unlink-panels
        range-separator="To"
        start-placeholder="Start quarter"
        end-placeholder="End quarter"
        :shortcuts="shortcuts"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref
const value2 = ref
const shortcuts = [
  {
    text: 'This quarter',
    value: () => {
      const now = new Date
      const quarter = Math.floor(now.getMonth() / 3)
      const start = new Date(now.getFullYear(), quarter * 3, 1)
      return [start, now]
    },
  },
  {
    text: 'Last 4 quarters',
    value: () => {
      const end = new Date
      const start = new Date
      start.setMonth(start.getMonth() - 12)
      return [start, end]
    },
  },
  {
    text: 'Next 8 quarters',
    value: () => {
      const start = new Date
      const end = new Date
      end.setMonth(end.getMonth() + 24)
      return [start, end]
    },
  },
]
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .block {
  padding: 1.5rem 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
  min-width: 300px;
}

.demo-date-picker .block:last-child {
  border-right: none;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
}

@media screen and (max-width: 768px) {
  .demo-date-picker .block {
    flex: 0 0 100%;
    padding: 1rem 0;
    min-width: auto;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}
</style>
```

隐藏源代码

## 单个面板 2.14.0 
默认日期选择器范围有两个面板。 如果你想要一个面板设置 `single-panel` 属性。

date range

\-

month range

\-

year range

\-

quarter range

\-

_

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">date range</span>
      <el-date-picker v-model="value1" type="daterange" single-panel />
    </div>
    <div class="block">
      <span class="demonstration">month range</span>
      <el-date-picker v-model="value2" type="monthrange" single-panel />
    </div>
    <div class="block">
      <span class="demonstration">year range</span>
      <el-date-picker v-model="value3" type="yearrange" single-panel />
    </div>
    <div class="block">
      <span class="demonstration">quarter range</span>
      <el-date-picker v-model="value4" type="quarterrange" single-panel />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref
const value2 = ref
const value3 = ref
const value4 = ref
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .block {
  padding: 1.5rem 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.demo-date-picker .block:last-child {
  border-right: none;
}

.demo-date-picker .block :deep(.el-date-editor) {
  width: 300px;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
  width: 100%;
}

@media screen and (max-width: 1200px) {
  .demo-date-picker .block {
    flex: 0 0 50%;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:nth-child(2n) {
    border-right: none;
  }

  .demo-date-picker .block:nth-last-child(-n + 2):nth-child(2n + 1),
  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}

@media screen and (max-width: 768px) {
  .demo-date-picker .block {
    flex: 0 0 100%;
    padding: 1rem 0;
    min-width: auto;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}
</style>
```

隐藏源代码

## 默认值 
日期选择器会在用户未选择任何日期的时候默认展示当天的日期。 你也可以使用 `default-value` 来修改这个默认的日期。 请注意该值需要是一个可以解析的 `new Date()` 对象。

如果类型是 `daterange`, `default-value` 则会设置左边窗口的默认值。

date

daterange

\-

_

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">date</span>
      <el-date-picker
        v-model="value1"
        type="date"
        placeholder="Pick a date"
        :default-value="new Date(2010, 9, 1)"
      />
    </div>
    <div class="block">
      <span class="demonstration">daterange</span>
      <el-date-picker
        v-model="value2"
        type="daterange"
        start-placeholder="Start Date"
        end-placeholder="End Date"
        :default-value="[new Date(2010, 9, 1), new Date(2010, 10, 1)]"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref
const value2 = ref
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .block {
  padding: 1.5rem 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.demo-date-picker .block:last-child {
  border-right: none;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
}

@media screen and (max-width: 768px) {
  .demo-date-picker .block {
    flex: 0 0 100%;
    padding: 1rem 0;
    min-width: auto;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}
</style>
```

隐藏源代码

## 日期格式 
使用`format`指定输入框的格式。 使用 `value-format` 指定绑定值的格式。

默认情况下，组件接受并返回`Date`对象。

在 [这里](https://day.js.org/docs/en/display/format#list-of-all-available-formats) 查看 Day.js 支持的所有格式。

WARNING

请一定要注意传入参数的大小写是否正确

Emits Date object

Value:

Use value-format

Value：

Timestamp

Value：

_

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">Emits Date object</span>
      <div class="demonstration">Value: {{ value1 }}</div>
      <el-date-picker
        v-model="value1"
        type="date"
        placeholder="Pick a Date"
        format="YYYY/MM/DD"
      />
    </div>
    <div class="block">
      <span class="demonstration">Use value-format</span>
      <div class="demonstration">Value：{{ value2 }}</div>
      <el-date-picker
        v-model="value2"
        type="date"
        placeholder="Pick a Date"
        format="YYYY/MM/DD"
        value-format="YYYY-MM-DD"
      />
    </div>
    <div class="block">
      <span class="demonstration">Timestamp</span>
      <div class="demonstration">Value：{{ value3 }}</div>
      <el-date-picker
        v-model="value3"
        type="date"
        placeholder="Pick a Date"
        format="YYYY/MM/DD"
        value-format="x"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref
const value2 = ref
const value3 = ref
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .block {
  padding: 1.5rem 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.demo-date-picker .block:last-child {
  border-right: none;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
  width: 100%;
}

@media screen and (max-width: 1200px) {
  .demo-date-picker .block {
    flex: 0 0 50%;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:nth-child(2n) {
    border-right: none;
  }

  .demo-date-picker .block:nth-last-child(-n + 2):nth-child(2n + 1),
  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}

@media screen and (max-width: 768px) {
  .demo-date-picker .block {
    flex: 0 0 100%;
    padding: 1rem 0;
    min-width: auto;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker .block:last-child {
    border-bottom: none;
  }
}
</style>
```

隐藏源代码

## 默认显示日期 
在选择日期范围时，你可以指定起始日期和结束日期的默认时间。

默认情况下，开始日期和结束日期的时间部分都是选择日期当日的 `00:00:00`。 通过 `default-time` 可以分别指定开始日期和结束日期的具体时刻。 它接受最多两个日期对象的数组。 其中第一项控制起始日期的具体时刻，第二项控制结束日期的具体时刻。

Component value：

\-

_

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <p>Component value：{{ value }}</p>
      <el-date-picker
        v-model="value"
        type="daterange"
        start-placeholder="Start date"
        end-placeholder="End date"
        value-format="YYYY-MM-DD HH:mm:ss"
        :default-time="defaultTime"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref
const defaultTime = ref<[Date, Date]>
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 2, 1, 23, 59, 59),
])
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}
.demo-date-picker .block {
  padding: 30px 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
}
.demo-date-picker .block:last-child {
  border-right: none;
}
</style>
```

隐藏源代码

## 设置自定义前缀的内容 
前缀内容可以被自定义。

当你从其他vue组件或由渲染函数生成的组件中导入组件时, 你可以设置 `prefix-icon` 属性来定制前缀内容

set prefix-icon

_

pre

_

_

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">set prefix-icon</span>
      <el-date-picker
        v-model="value1"
        type="date"
        placeholder="Pick a day"
        :prefix-icon="customPrefix"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, ref, shallowRef } from 'vue'

const value1 = ref
const customPrefix = shallowRef
  render() {
    return h
  },
})
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}
.demo-date-picker .block {
  padding: 30px 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  flex: 1;
}
.demo-date-picker .block:last-child {
  border-right: none;
}
.demo-date-picker .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 20px;
}
</style>
```

隐藏源代码

## 自定义内容 
弹出框的内容是可以自定义的，在插槽内你可以获取到当前单元格的数据 请注意，自定义内容结构应与默认结构一致，否则可能风格会不一致。

value-on-clear

_

```vue
<template>
  <div class="demo-date-picker">
    <el-date-picker
      v-model="value"
      type="date"
      placeholder="Pick a day"
      format="YYYY/MM/DD"
      value-format="YYYY-MM-DD"
    >
      <template #default="cell">
        <div class="cell" :class="{ current: cell.isCurrent }">
          <span class="text">{{ cell.text }}</span>
          <span v-if="isHoliday(cell)" class="holiday" />
        </div>
      </template>
    </el-date-picker>
    <el-date-picker v-model="month" type="month" placeholder="Pick a month">
      <template #default="cell">
        <div class="el-date-table-cell" :class="{ current: cell.isCurrent }">
          <span class="el-date-table-cell__text">{{ cell.text + 1 }}期</span>
        </div>
      </template>
    </el-date-picker>
    <el-date-picker v-model="year" type="year" placeholder="Pick a year">
      <template #default="cell">
        <div class="el-date-table-cell" :class="{ current: cell.isCurrent }">
          <span class="el-date-table-cell__text">{{ cell.text + 1 }}y</span>
        </div>
      </template>
    </el-date-picker>
    <el-date-picker
      v-model="quarter"
      type="quarter"
      placeholder="Pick a quarter"
    >
      <template #default="cell">
        <div class="el-date-table-cell" :class="{ current: cell.isCurrent }">
          <span class="el-date-table-cell__text">Q{{ +cell.text + 1 }}</span>
        </div>
      </template>
    </el-date-picker>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref
const month = ref
const year = ref
const quarter = ref
const holidays = [
  '2021-10-01',
  '2021-10-02',
  '2021-10-03',
  '2021-10-04',
  '2021-10-05',
  '2021-10-06',
  '2021-10-07',
]

const isHoliday = ({ dayjs }) => {
  return holidays.includes(dayjs.format('YYYY-MM-DD'))
}
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.demo-date-picker > * {
  margin: 0 !important;
}

.cell {
  height: 30px;
  padding: 3px 0;
  box-sizing: border-box;
}

.cell .text {
  width: 24px;
  height: 24px;
  display: block;
  margin: 0 auto;
  line-height: 24px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
}

.cell.current .text {
  background: #626aef;
  color: #fff;
}

.cell .holiday {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--el-color-danger);
  border-radius: 50%;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
}

@media screen and (max-width: 768px) {
  .demo-date-picker {
    gap: 1.5rem;
  }
}
</style>
```

隐藏源代码

## 自定义图标 2.8.0 
使用插槽自定义图标。

date

date range

\-

month range

\-

year range

To

quarter range

To

_

```vue
<template>
  <div class="demo-date-picker-icon">
    <div class="block">
      <div class="demonstration">date</div>
      <el-date-picker
        v-model="value1"
        type="date"
        placeholder="Pick a day"
        format="YYYY/MM/DD"
        value-format="YYYY-MM-DD"
      >
        <template #prev-month>
          <el-icon><CaretLeft /></el-icon>
        </template>
        <template #next-month>
          <el-icon><CaretRight /></el-icon>
        </template>
        <template #prev-year>
          <el-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                  />
                </g>
              </g>
            </svg>
          </el-icon>
        </template>
        <template #next-year>
          <el-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                  />
                </g>
              </g>
            </svg>
          </el-icon>
        </template>
      </el-date-picker>
    </div>
    <div class="block">
      <div class="demonstration">date range</div>
      <el-date-picker
        v-model="value2"
        type="daterange"
        start-placeholder="Start date"
        end-placeholder="End date"
        format="YYYY/MM/DD"
        value-format="YYYY-MM-DD"
        unlink-panels
      >
        <template #prev-month>
          <el-icon><CaretLeft /></el-icon>
        </template>
        <template #next-month>
          <el-icon><CaretRight /></el-icon>
        </template>
        <template #prev-year>
          <el-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                  />
                </g>
              </g>
            </svg>
          </el-icon>
        </template>
        <template #next-year>
          <el-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                  />
                </g>
              </g>
            </svg>
          </el-icon>
        </template>
      </el-date-picker>
    </div>
    <div class="block">
      <div class="demonstration">month range</div>
      <el-date-picker
        v-model="value3"
        type="monthrange"
        start-placeholder="Start date"
        end-placeholder="End date"
        format="YYYY/MM/DD"
        value-format="YYYY-MM-DD"
        unlink-panels
      >
        <template #prev-month>
          <el-icon><CaretLeft /></el-icon>
        </template>
        <template #next-month>
          <el-icon><CaretRight /></el-icon>
        </template>
        <template #prev-year>
          <el-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                  />
                </g>
              </g>
            </svg>
          </el-icon>
        </template>
        <template #next-year>
          <el-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                  />
                </g>
              </g>
            </svg>
          </el-icon>
        </template>
      </el-date-picker>
    </div>
    <div class="block">
      <div class="demonstration">year range</div>
      <el-date-picker
        v-model="value4"
        type="yearrange"
        range-separator="To"
        start-placeholder="Start Year"
        end-placeholder="End Year"
      >
        <template #prev-year>
          <el-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                  />
                </g>
              </g>
            </svg>
          </el-icon>
        </template>
        <template #next-year>
          <el-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                  />
                </g>
              </g>
            </svg>
          </el-icon>
        </template>
      </el-date-picker>
    </div>
    <div class="block">
      <div class="demonstration">quarter range</div>
      <el-date-picker
        v-model="value5"
        type="quarterrange"
        range-separator="To"
        start-placeholder="Start quarter"
        end-placeholder="End quarter"
      >
        <template #prev-year>
          <el-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                  />
                </g>
              </g>
            </svg>
          </el-icon>
        </template>
        <template #next-year>
          <el-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                  />
                </g>
              </g>
            </svg>
          </el-icon>
        </template>
      </el-date-picker>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { CaretLeft, CaretRight } from '@element-plus/icons-vue'

const value1 = ref
const value2 = ref
const value3 = ref
const value4 = ref
const value5 = ref
</script>

<style scoped>
.demo-date-picker-icon {
  display: grid;
  width: 100%;
}

.demo-date-picker-icon .block {
  padding: 1.5rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.demo-date-picker-icon .block :deep(.el-date-editor) {
  width: 100%;
  max-width: 360px;
}

.demo-date-picker-icon .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 1rem;
  width: 100%;
}

@media screen and (min-width: 1201px) {
  .demo-date-picker-icon {
    grid-template-columns: repeat(6, 1fr);
  }

  .demo-date-picker-icon .block {
    border-right: solid 1px var(--el-border-color);
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker-icon .block:nth-child(1),
  .demo-date-picker-icon .block:nth-child(2) {
    grid-column: span 3;
  }

  .demo-date-picker-icon .block:nth-child(2) {
    border-right: none;
  }

  .demo-date-picker-icon .block:nth-child(3),
  .demo-date-picker-icon .block:nth-child(4),
  .demo-date-picker-icon .block:nth-child(5) {
    grid-column: span 2;
    border-bottom: none;
  }

  .demo-date-picker-icon .block:nth-child(5) {
    border-right: none;
  }
}

@media screen and (min-width: 769px) and (max-width: 1200px) {
  .demo-date-picker-icon {
    grid-template-columns: repeat(2, 1fr);
  }

  .demo-date-picker-icon .block {
    grid-column: span 1;
    border-right: solid 1px var(--el-border-color);
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker-icon .block:nth-child(2n) {
    border-right: none;
  }

  .demo-date-picker-icon .block:nth-child(5) {
    grid-column: span 2;
    border-right: none;
    border-bottom: none;
  }
}

@media screen and (max-width: 768px) {
  .demo-date-picker-icon {
    grid-template-columns: 1fr;
  }

  .demo-date-picker-icon .block {
    grid-column: 1 / -1;
    padding: 1rem 0;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .demo-date-picker-icon .block:last-child {
    border-bottom: none;
  }
}
</style>
```

隐藏源代码

更详细的数据类型，请查看下表

ts

```
interface DateCell {
  column: number
  customClass: string | undefined
  disabled: boolean
  end: boolean
  inRange: boolean
  row: number
  selected: Dayjs | undefined
  isCurrent: boolean | undefined
  isSelected: boolean
  renderText: string | undefined
  start: boolean
  text: number
  timestamp: number
  date: Date
  dayjs: Dayjs
  type: 'normal' | 'today' | 'week' | 'next-month' | 'prev-month'
}
```

## 国际化 
由于 Element Plus 的默认语言为英语，如果你需要设置其它的语言，请参考[国际化](/zh-CN/guide/i18n)文档。

要注意的是：日期相关的文字（月份，每一周的第一天等等）也都是通过国际化来配置的。

## API 
### 属性 
属性名

说明

类型

默认

model-value / v-model

绑定值，如果是 `range` 选择器，数组长度应为 2

`number` / `string` / `Date` / `array`

''

readonly

只读

`boolean`

false

disabled

禁用

`boolean`

false

size

输入框尺寸

`enum`

—

editable

文本框可输入

`boolean`

true

clearable

是否显示清除按钮

`boolean`

true

placeholder

非范围选择时的占位内容

`string`

''

start-placeholder

范围选择时开始日期的占位内容

`string`

—

end-placeholder

范围选择时结束日期的占位内容

`string`

—

type

type of the picker. `quarter`, `quarters`, and `quarterrange` are supported since 2.14.5

`enum`

date

format

显示在输入框中的格式

`string` 参考 [日期格式
YYYY-MM-DD

popper-class

DatePicker 下拉框的类名

`string`

—

popper-style

弹出内容的自定义样式

`string` / `object`

—

popper-options

自定义 popper 选项，更多请参考 [popper.js
`object`

{}

range-separator

选择范围时的分隔符

`string`

'-'

default-value

可选，选择器打开时默认显示的时间

`object`

—

default-time

范围选择时选中日期所使用的当日内具体时刻

`object`

—

value-format

可选，绑定值的格式。 不指定则绑定值为 Date 对象

`string` 参考 [日期格式
—

id

等价于原生 input `id` 属性

`string` / `array`

—

name

等价于原生 input `name` 属性

`string` / `array`

''

unlink-panels

在范围选择器里取消两个日期面板之间的联动

`boolean`

false

single-panel 2.14.0

在范围选择器中只显示一个面板

`boolean`

false

prefix-icon

自定义前缀图标 如果 `type`的值是`TimeLikeType`，那么就是 `Clock`，不然就是 `Calendar`

`string` / `object`

''

clear-icon

自定义清除图标

`string` / `object`

`CircleClose`

validate-event

是否触发表单验证

`boolean`

true

disabled-date

一个用来判断该日期是否被禁用的函数，接受一个 Date 对象作为参数。 应该返回一个 Boolean 值。

`Function`

—

shortcuts

设置快捷选项，需要传入数组对象

`array`

[]

cell-class-name

设置自定义类名

`Function`

—

teleported

是否将 date-picker 的下拉列表插入至 body 元素

`boolean`

true

empty-values 2.7.0

组件的空值配置， [参考config-provider
`array`

—

value-on-clear 2.7.0

清空选项的值， [参考config-provider
`string` / `number` / `boolean` / `Function`

—

fallback-placements 2.8.4

Tooltip 可用的 positions 请查看[popper.js 文档
`array`

['bottom', 'top', 'right', 'left']

placement 2.8.4

下拉框出现的位置

`Placement`

bottom

show-footer 2.10.5

是否显示 footer

`boolean`

true

show-confirm 2.11.0

是否显示确定按钮

`boolean`

true

show-week-number 2.10.3

显示周数
`boolean`

你好

automatic-dropdown 2.11.4

该属性决定在输入框获得焦点时日期选择面板是否弹出。 （在 3.0 版本中，默认值将设置为 false）

`boolean`

true

### 事件 
事件名

说明

类型

change

当用户确认值或点击外部时触发

`Function`

blur

在组件 Input 失去焦点时触发

`Function`

focus

在组件 Input 获得焦点时触发

`Function`

clear 2.7.7

当点击清除按钮时触发

`Function`

calendar-change

在日历所选日期更改时触发 仅用于 `range`

`Function`

panel-change

当日期面板改变时触发。

`Function`

visible-change

当 DatePicker 的下拉列表出现/消失时触发

`Function`

### 插槽 
名称

说明

default

自定义单元格内容

range-separator

自定义范围分割符内容

prev-month 2.8.0

上个月的图标

next-month 2.8.0

下个月的图标

prev-year 2.8.0

上一年图标

next-year 2.8.0

下一年图标

### 暴露 
方法名

说明

类型

focus

使组件获取焦点

`Function`

blur 2.8.7

使组件失去焦点

`Function`

handleOpen 2.2.16

打开日期选择器弹窗

`Function`

handleClose 2.2.16

关闭日期选择器弹窗

`Function`

## 类型声明 
显示类型声明

ts

```
import type { Options as PopperOptions } from '@popperjs/core'

type TimeLikeType = 'datetime' | 'datetimerange'

type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'
```

## 源代码 
[组件](https://github.com/element-plus/element-plus/tree/dev/packages/components/date-picker) • [样式](https://github.com/element-plus/element-plus/tree/dev/packages/theme-chalk/src/date-picker.scss) • [文档
## 贡献者 
[![](https://avatars.githubusercontent.com/u/15975785?v=4&size=64)](https://github.com/jw-foss)[![](https://avatars.githubusercontent.com/u/91417411?v=4&size=64)](https://github.com/Dsaquel)[![](https://avatars.githubusercontent.com/u/24516654?v=4&size=64)](https://github.com/btea)[![](https://avatars.githubusercontent.com/u/6481596?v=4&size=64)](https://github.com/sxzz)[![](https://avatars.githubusercontent.com/u/25154432?v=4&size=64)](https://github.com/YunYouJun)[![](https://avatars.githubusercontent.com/u/23313167?v=4&size=64)](https://github.com/tolking)[![](https://avatars.githubusercontent.com/u/45450994?v=4&size=64)](https://github.com/warmthsea)[![](https://avatars.githubusercontent.com/u/26672484?v=4&size=64)](https://github.com/msidolphin)[![](https://avatars.githubusercontent.com/u/23251408?v=4&size=64)](https://github.com/chenxch)[![](https://avatars.githubusercontent.com/u/23100055?v=4&size=64)](https://github.com/holazz)[![](https://avatars.githubusercontent.com/u/61937205?v=4&size=64)](https://github.com/keeplearning66)[![](https://avatars.githubusercontent.com/u/30518686?v=4&size=64)](https://github.com/emojiiii)[![](https://avatars.githubusercontent.com/u/93767616?v=4&size=64)](https://github.com/makedopamine)[![](https://avatars.githubusercontent.com/u/46493087?v=4&size=64)](https://github.com/FrontEndDog)[![](https://avatars.githubusercontent.com/u/21104054?v=4&size=64)](https://github.com/Alanscut)[![](https://avatars.githubusercontent.com/u/29560987?v=4&size=64)](https://github.com/adaex)[![](https://avatars.githubusercontent.com/u/24290011?v=4&size=64)](https://github.com/xingyixiang)[![](https://avatars.githubusercontent.com/u/34408516?v=4&size=64)](https://github.com/betavs)[![](https://avatars.githubusercontent.com/u/34681550?v=4&size=64)](https://github.com/zhixiaotong)[![](https://avatars.githubusercontent.com/u/50739490?v=4&size=64)](https://github.com/Chuck-Lau)[![](https://avatars.githubusercontent.com/u/33827314?v=4&size=64)](https://github.com/gjfei)[![](https://avatars.githubusercontent.com/u/57385187?v=4&size=64)](https://github.com/opengraphica)[![](https://avatars.githubusercontent.com/u/58726932?v=4&size=64)](https://github.com/rzzf)[![](https://avatars.githubusercontent.com/u/43703884?v=4&size=64)](https://github.com/DDDDD12138)[![](https://avatars.githubusercontent.com/u/41944818?v=4&size=64)](https://github.com/CherishTheYouth)[![](https://avatars.githubusercontent.com/u/38392315?v=4&size=64)](https://github.com/kooriookami)[![](https://avatars.githubusercontent.com/u/69044080?v=4&size=64)](https://github.com/wzc520pyfm)[![](https://avatars.githubusercontent.com/u/226283245?v=4&size=64)](https://github.com/E66Crisp)[![](https://avatars.githubusercontent.com/u/144010?v=4&size=64)](https://github.com/purepear)[![](https://avatars.githubusercontent.com/u/24487727?v=4&size=64)](https://github.com/LostElkByte)[![](https://avatars.githubusercontent.com/u/19850462?v=4&size=64)](https://github.com/jeff-fe)[![](https://avatars.githubusercontent.com/u/56141625?v=4&size=64)](https://github.com/micaiguai)[![](https://avatars.githubusercontent.com/u/110156942?v=4&size=64)](https://github.com/a92126)[![](https://avatars.githubusercontent.com/u/29867660?v=4&size=64)](https://github.com/yuhengshen)[![](https://avatars.githubusercontent.com/u/22286818?v=4&size=64)](https://github.com/fratzinger)[![](https://avatars.githubusercontent.com/u/45327166?v=4&size=64)](https://github.com/jyp114110)[![](https://avatars.githubusercontent.com/u/54931083?v=4&size=64)](https://github.com/ShuaiNingZH)[![](https://avatars.githubusercontent.com/u/117748716?v=4&size=64)](https://github.com/thinkasany)[![](https://avatars.githubusercontent.com/u/56016153?v=4&size=64)](https://github.com/zzjiaxiang)[![](https://avatars.githubusercontent.com/u/54665054?v=4&size=64)](https://github.com/lyric-zemin)[![](https://avatars.githubusercontent.com/u/6340506?v=4&size=64)](https://github.com/mdoi2)[![](https://avatars.githubusercontent.com/u/81006731?v=4&size=64)](https://github.com/Panzer-Jack)[![](https://avatars.githubusercontent.com/u/58782768?v=4&size=64)](https://github.com/dddssw)[![](https://avatars.githubusercontent.com/u/84657208?v=4&size=64)](https://github.com/xiaodong2008)[![](https://avatars.githubusercontent.com/u/31533594?v=4&size=64)](https://github.com/Gnalvin)[![](https://avatars.githubusercontent.com/u/57935341?v=4&size=64)](https://github.com/yuchenii)[![](https://avatars.githubusercontent.com/u/42532333?v=4&size=64)](https://github.com/ivan0525)[![](https://avatars.githubusercontent.com/u/1726061?v=4&size=64)](https://github.com/Justineo)[![](https://avatars.githubusercontent.com/u/108655466?v=4&size=64)](https://github.com/Karolis-Stoncius)[![](https://avatars.githubusercontent.com/u/18509404?v=4&size=64)](https://github.com/inottn)[![](https://avatars.githubusercontent.com/u/79386745?v=4&size=64)](https://github.com/kamesan012)[![](https://avatars.githubusercontent.com/u/55378595?v=4&size=64)](https://github.com/evanryuu)[![](https://avatars.githubusercontent.com/u/10278227?v=4&size=64)](https://github.com/HeftyKoo)[![](https://avatars.githubusercontent.com/u/35163869?v=4&size=64)](https://github.com/Brain777777)[![](https://avatars.githubusercontent.com/u/30046649?v=4&size=64)](https://github.com/MrWeilian)[![](https://avatars.githubusercontent.com/u/26035718?v=4&size=64)](https://github.com/SnowingFox)[![](https://avatars.githubusercontent.com/u/17247526?v=4&size=64)](https://github.com/nabaonan)[![](https://avatars.githubusercontent.com/u/12124478?v=4&size=64)](https://github.com/Hades-li)[![](https://avatars.githubusercontent.com/u/44761321?v=4&size=64)](https://github.com/xiaoxian521)[![](https://avatars.githubusercontent.com/u/49087880?v=4&size=64)](https://github.com/pany-ang)[![](https://avatars.githubusercontent.com/u/145281501?v=4&size=64)](https://github.com/typed-sigterm)[![](https://avatars.githubusercontent.com/u/121680374?v=4&size=64)](https://github.com/kaine0923)[![](https://avatars.githubusercontent.com/u/30114549?v=4&size=64)](https://github.com/loosheng)[![](https://avatars.githubusercontent.com/u/25458528?v=4&size=64)](https://github.com/weidehai)[![](https://avatars.githubusercontent.com/u/82928935?v=4&size=64)](https://github.com/verger-guo)[![](https://avatars.githubusercontent.com/u/4075314?v=4&size=64)](https://github.com/Giwayume)[![](https://avatars.githubusercontent.com/u/44187480?v=4&size=64)](https://github.com/banbri)[![](https://avatars.githubusercontent.com/u/17680888?v=4&size=64)](https://github.com/iamkun)[![](https://avatars.githubusercontent.com/u/35101675?v=4&size=64)](https://github.com/shenX-2021)[![](https://avatars.githubusercontent.com/u/19464247?v=4&size=64)](https://github.com/lily-elephant)[![](https://avatars.githubusercontent.com/u/26999792?v=4&size=64)](https://github.com/plainheart)[![](https://avatars.githubusercontent.com/u/82012629?v=4&size=64)](https://github.com/0song)[![](https://avatars.githubusercontent.com/u/6134068?v=4&size=64)
[Date Picker Panel 日期选择器面板
[DateTime Picker 日期时间选择器](https://element-plus.org/zh-CN/component/datetime-picker)
