/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 * dep是可以有多个的可观察值
 * 指令订阅它。
 */
export default class Dep {
  static target: ?Watcher;   //  target 是一个Watcher
  id: number;
  subs: Array<Watcher>;     // subs是一个有多个Watcher的数组

  constructor() {
    this.id = uid++
    this.subs = []
  }

  /*
   *  添加订阅者(依赖)
   */
  addSub(sub: Watcher) {
    this.subs.push(sub)
  }
  /*
     *  删除订阅者(依赖)
  */
  removeSub(sub: Watcher) {
    remove(this.subs, sub)
  }

  /*
   检查当前Dep.target是否存在以及判断这个watcher已经被添加到了相应的依赖当中，
   如果没有则添加订阅者(依赖)，如果已经被添加了那么就不做处理
  */
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  /*
   通知订阅者(依赖)更新
  */
  notify() {
    // stabilize the subscriber list first
    // 首先稳定(?确定)用户列表
    const subs = this.subs.slice()  // slice() 方法可从已有的数组中返回选定的元素。
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
// 当前目标观察者被评估。
// 这是全球唯一的，因为可能只有一个
// 观察员在任何时候被评估。
// Dep的实现当中还有一个非常重要的属性就是Dep.target，
//它事实就上就是一个订阅者，只有当Dep.target(订阅者)存在的时候，
//调用属性的getter函数的时候才能完成依赖的收集工作。
Dep.target = null
const targetStack = []

export function pushTarget(_target: Watcher) {
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}

export function popTarget() {
  Dep.target = targetStack.pop()
}
