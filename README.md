# MiniKit
MiniKit是一个微信小程序（小游戏）工具箱

## 手势识别
首先需要将原始事件传给gesture.js
```js
import Gesture from 'gesture';
let gesture = new Gesture();

wx.onTouchStart(function (res) {
  gesture.onTouchStart(res);
});

wx.onTouchMove(function (res) {
  gesture.onTouchMove(res);
});

wx.onTouchEnd(function (res) {
  gesture.onTouchEnd(res);
});
```


* 按下
```js
gesture.on('showPress', (event) => {
  let x = event.x;
  let y = event.y;
});
```

* 单击
```js
gesture.on('click', (event) => {
  let x = event.x;
  let y = event.y;
});
```

* 双击
```js
gesture.on('doubleClick', (event) => {
  let x = event.x;
  let y = event.y;
});
```

* 长按
```js
gesture.on('longClick', (event) => {
  let x = event.x;
  let y = event.y;
});
```

* scroll
```js
gesture.on('scroll', (event, dx, dy) => {
  // dx, dy为delta值，一般需要累加到某个变量上, 如
  scrollX += dx;
});
```

* fling
```js
gesture.on('fling', (down, event, vx, vy) => {
  // vx, vy为速度
});
```
