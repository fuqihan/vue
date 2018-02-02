/* @flow */

import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * Query an element selector if it's not an element already.
 * 查询元素选择器，如果它不是一个元素已经。
 */
export function query (el: string | Element): Element {
  if (typeof el === 'string') {
    // querySelector() 方法返回文档中匹配指定 CSS 选择器的一个元素
    const selected = document.querySelector(el)
    if (!selected) {
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}
