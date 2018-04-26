let cancelClickThreshold = 8;
let showPressTimeout = 180;
let longClickTimeout = 500 + showPressTimeout;

export default class Gesture {
  constructor() {
    this.eventMap = new Map();
    this.down = {x:0, y:0, time: 0};
    this.cancelClick = false;
    this.singleTapUp = false;
    this.click = 0;
    this.clickInterruptTimer;
    this.fireClickTimer; // might be canceled by double click
    this.scrollX = 0;
    this.scrollY = 0;
  }

  onTouchStart(event) {
    var x = event.touches[0].pageX;
    var y = event.touches[0].pageY;

    if (Math.abs(x - this.down.x) > cancelClickThreshold
      || Math.abs(y - this.down.y) > cancelClickThreshold) {
      this.click = 0;
    }

    this.down = { x: x, y: y, time: new Date().getTime() };
    this.cancelClick = false;
    this.singleTapUp = false;
    this.scrollX = x;
    this.scrollY = y;
    if (this.clickInterruptTimer) {
      clearTimeout(this.clickInterruptTimer);
    }

    // if within 300 received touchEnd
    // and not canceled by double click then it is single tap
    this.fireClickTimer = setTimeout(() => {
      this.fireClickEvent({x:x, y:y});
    }, 300);
  }

  onTouchMove(event) {
    var x = event.touches[0].pageX;
    var y = event.touches[0].pageY;
    if (Math.abs(x - this.down.x) > cancelClickThreshold 
    || Math.abs(y - this.down.y) > cancelClickThreshold) {
      this.cancelClick = true;
      this.click = 0;
    }

    let dx = x - this.scrollX;
    let dy = y - this.scrollY;
    this.fireEvent('scroll', {x:x,y:y}, dx, dy);
    this.scrollX = x;
    this.scrollY = y;
  }

  onTouchEnd(event) {
    var x = event.changedTouches[0].pageX;
    var y = event.changedTouches[0].pageY;
    if (Math.abs(x - this.down.x) > cancelClickThreshold
      || Math.abs(y - this.down.y) > cancelClickThreshold) {
      this.cancelClick = true;
      this.click = 0;
    }

    var upTime = new Date().getTime();
    if (!this.cancelClick) {
      this.click++;
      if (this.click == 2) {
        clearTimeout(this.fireClickTimer);
        this.fireEvent('doubleClick', {x:x, y:y});
      } else if (upTime - this.down.time > longClickTimeout) {
        this.click = 0;
        this.fireEvent('longClick', { x: x, y: y });
      } else {
        this.singleTapUp = true;
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
