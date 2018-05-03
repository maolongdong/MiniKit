const TOUCH_SLOP = 8;
const SHOW_PRESS_TIMEOUT = 100;
const DEFAULT_LONG_PRESS_TIMEOUT = 500;
const DOUBLE_TAP_TIMEOUT = 300;

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
  }

  onTouchStart(event) {
    var x = event.touches[0].pageX;
    var y = event.touches[0].pageY;

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
    var x = event.touches[0].pageX;
    var y = event.touches[0].pageY;
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
    var x = event.changedTouches[0].pageX;
    var y = event.changedTouches[0].pageY;
    if (Math.abs(x - this.down.x) > TOUCH_SLOP
      || Math.abs(y - this.down.y) > TOUCH_SLOP) {
      this.cancelClick = true;
      this.click = 0;
    }

    clearTimeout(this.fireShowPressTimer);

    var upTime = new Date().getTime();
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
