const TOUCH_SLOP = 8;
const SHOW_PRESS_TIMEOUT = 100;
const DEFAULT_LONG_PRESS_TIMEOUT = 500;
const DOUBLE_TAP_TIMEOUT = 300;
const MINIMUM_FLING_VELOCITY = 2;
const MAXIMUM_FLING_VELOCITY = 100;

export default class Gesture {
  constructor() {
    this.eventMap = new Map();
    this.down = {x:0, y:0, time: 0};
    this.cancelClick = false;
    this.singleTapUp = false;
    this.click = 0;
    this.doubleClickTimer;
    this.fireShowPressTimer;
    this.fireClickTimer; // might be canceled by double click
    this.scrollX = 0;
    this.scrollY = 0;
    this.velocityTracker = new VelocityTracker();
  }

  onTouchStart(event) {
    let x = event.touches[0].pageX;
    let y = event.touches[0].pageY;

    if (Math.abs(x - this.down.x) > TOUCH_SLOP
      || Math.abs(y - this.down.y) > TOUCH_SLOP) {
      this.click = 0;
    }

    this.down = { x: x, y: y, time: new Date().getTime() };
    this.cancelClick = false;
    this.singleTapUp = false;
    this.scrollX = x;
    this.scrollY = y;
    if (this.doubleClickTimer) {
      clearTimeout(this.doubleClickTimer);
    }

    clearTimeout(this.fireShowPressTimer);
    this.fireShowPressTimer = setTimeout(() => {
      this.fireEvent('showPress', { x: x, y: y });
    }, SHOW_PRESS_TIMEOUT);

    // if within 300 received touchEnd
    // and not canceled by double click then it is single tap
    this.fireClickTimer = setTimeout(() => {
      this.fireClickEvent({x:x, y:y});
    }, 300);
  }

  onTouchMove(event) {
    let x = event.touches[0].pageX;
    let y = event.touches[0].pageY;
    this.velocityTracker.addMovement({ x: x, y: y, time: new Date().getTime() });
    if (Math.abs(x - this.down.x) > TOUCH_SLOP 
    || Math.abs(y - this.down.y) > TOUCH_SLOP) {
      this.cancelClick = true;
      this.click = 0;
      clearTimeout(this.fireShowPressTimer);
    }

    if (this.cancelClick) {
      let dx = x - this.scrollX;
      let dy = y - this.scrollY;
      this.fireEvent('scroll', {x:x,y:y}, dx, dy);
    }
    this.scrollX = x;
    this.scrollY = y;
  }

  onTouchEnd(event) {
    let x = event.changedTouches[0].pageX;
    let y = event.changedTouches[0].pageY;
    if (Math.abs(x - this.down.x) > TOUCH_SLOP
      || Math.abs(y - this.down.y) > TOUCH_SLOP) {
      this.cancelClick = true;
      this.click = 0;
    }

    clearTimeout(this.fireShowPressTimer);

    let upTime = new Date().getTime();
    if (!this.cancelClick) {
      this.click++;
      if (this.click == 2) {
        clearTimeout(this.fireClickTimer);
        this.fireEvent('doubleClick', {x:x, y:y});
      } else if (upTime - this.down.time > DEFAULT_LONG_PRESS_TIMEOUT) {
        this.click = 0;
        this.fireEvent('longClick', { x: x, y: y });
      } else {
        this.singleTapUp = true;
        this.doubleClickTimer = setTimeout(()=>{
          this.click = 0;
        }, DOUBLE_TAP_TIMEOUT);
      }
    } else {
      this.velocityTracker.computeCurrentVelocity(10);
      let vx = this.velocityTracker.getXVelocity();
      let vy = this.velocityTracker.getYVelocity();
      this.fireEvent('fling', this.down, { x: x, y: y, time: upTime }, vx, vy);
    }
  }

  on(event, callback) {
    this.eventMap.set(event, callback);
  }

  fireEvent(eventType, event, ...more) {
    let callback = this.eventMap.get(eventType);
    if (callback !== undefined) {
      callback(event, ...more);
    }
  }

  fireClickEvent(event) {
    if (!this.cancelClick && this.singleTapUp) {
      this.click = 0;
      this.fireEvent('click', event);
    }
  }
}

class VelocityTracker {
  constructor() {
    this.movements = [];
    this.velocity = {vx:0, vy:0};
  }

  addMovement(movement) {
    if (this.movements.length >= 5) {
      this.movements.splice(0, 1);
    }
    this.movements.push(movement);
  }

  computeCurrentVelocity(factor) {
    let length = this.movements.length;
    if (length < 2) {
      return;
    }
    let fx = this.movements[0].x;
    let lx = this.movements[length - 1].x;
    let fy = this.movements[0].y;
    let ly = this.movements[length - 1].y;
    let ft = this.movements[0].time;
    let lt = this.movements[length - 1].time;
    this.velocity.vx = (lx - fx) / (lt - ft) * factor;
    this.velocity.vy = (ly - fy) / (lt - ft) * factor;

    if (Math.abs(this.velocity.vx) < MINIMUM_FLING_VELOCITY) {
      this.velocity.vx = 0;
    } else if (Math.abs(this.velocity.vx) > MAXIMUM_FLING_VELOCITY) {
      this.velocity.vx = this.getSign(this.velocity.vx) * MAXIMUM_FLING_VELOCITY;
    }

    if (Math.abs(this.velocity.vy) < MINIMUM_FLING_VELOCITY) {
      this.velocity.vy = 0;
    } else if (Math.abs(this.velocity.vy) > MAXIMUM_FLING_VELOCITY) {
      this.velocity.vy = this.getSign(this.velocity.vy) * MAXIMUM_FLING_VELOCITY;
    }
  }

  getXVelocity() {
    return this.velocity.vx;
  }

  getYVelocity() {
    return this.velocity.vy;
  }

  clear() {
    this.movements = [];
    this.velocity = { vx: 0, vy: 0 };
  }

  getSign(num) {
    return num < 0 ? -1 : 1;
  }
}
