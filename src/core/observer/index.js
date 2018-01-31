/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 * 默认情况下，当设置反应属性时，新值为
  *也转换成反应。 但是道具传递的时候，
  *我们不想强制转换，因为这个值可能是一个嵌套的值
  *在冻结的数据结构下。 转换它将打败优化。
 */
export const observerState = {
  shouldConvert: true
}

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 * 每个观察者都附有观察者类
  *对象。 一旦连接，观察者转换目标
  *对象的属性键到getter / setters中
  *收集依赖关系并发送更新。
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number;
  // number of vms that has this object as root $data
  //  将此对象作为根$ data的vms数量

  constructor(value: any) {
    this.value = value
    // dep记录了和这个value值的相关依赖
    this.dep = new Dep()
    this.vmCount = 0
    // value其实就是vm._data, 即在vm._data上添加__ob__属性
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      // 首先判断是否能使用__proto__属性
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
      // 遍历数组，并将obj类型的属性改为getter/setter实现
      this.observeArray(value)
    } else {
      // 遍历obj上的属性，将每个属性改为getter/setter实现
      this.walk(value)
    }
  }

  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   * 遍历每个属性并将其转换为
   * getter / setter。 这个方法只能在调用的时候调用
   * 值类型是Object。
   * 将每个property对应的属性都转化为getter/setters,只能是当这个value的类型为Object时
   */
  walk(obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i], obj[keys[i]])
    }
  }

  /**
   * Observe a list of Array items.
   * 观察数组项目的列表。
   */
  observeArray(items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 * 通过拦截来增加目标对象或数组
 * 原型链使用__proto__
 */
function protoAugment(target, src: Object, keys: any) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 * 通过定义增加一个目标对象或数组
 * 隐藏属性。
 */
/* istanbul ignore next */
function copyAugment(target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
  *尝试创建一个值的观察者实例，
  *如果成功观察，则返回新的观察者，
  *或现有的观察者，如果该值已经有一个。
 */
export function observe(value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    observerState.shouldConvert &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value)  // 判断这对象是否是可扩展的
    &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 定义对象的反应性属性。
 */
export function defineReactive(
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 每个属性新建一个dep实例，管理这个属性的依赖
  const dep = new Dep()

  // 查找key 在obj上的描叙
  const property = Object.getOwnPropertyDescriptor(obj, key)
  // 如果这个属性是不可配的，即无法更改
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 迎合(?准备)预定义的getter / setter
  const getter = property && property.get
  const setter = property && property.set

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val
      //每次new一个watcher（订阅者）对象的时候需要计算依赖的dep对象，Dep.target就是当前正在计算依赖的watcher对象
      if (Dep.target) {
        // 调用属性的getter方法时，存在Dep.target则将当前dep和watcher绑定
        // Dep.target.addDep(this)
        // 即添加watch函数
        // dep.depend()及调用了dep.addSub()只不过中间需要判断是否这个id的dep已经被包含在内了
        dep.depend()
        // childOb也添加依赖
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter(newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
       // 对得到的新值进行observe
      childOb = !shallow && observe(newVal)
      // 调用属性的setter方法时，dep同时发布一次属性变化的通知到所有依赖的watcher对象
      dep.notify()  //通知 Watcher 相应的依赖进行更新
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set(target: Array<any> | Object, key: any, val: any): any {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del(target: Array<any> | Object, key: any) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray(value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
