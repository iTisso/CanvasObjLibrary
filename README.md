CanvasObjLibrary
================

To draw object in canvas

How to use? Go to wiki Page!

Here is a demo:[http://jiastorage.duapp.com/demo/CanvasObjLibrary/][demo]
> 提示:右键图片，中键图片，左击图片或太鼓，鼠标位于文字上方然后滚动鼠标滚轮。会有惊喜哦
> 确保输入焦点不在canvas中(目前为了防止按键冲突，我让canvas垄断了所有键盘事件，还在想解决方案)，然后打开浏览器控制台，输入`gui.Debug.on()`


Nya~
------------------------
已知问题（如果有人修正了这里的问题请把错误从这里去掉然后添加进下面的log）
------------------------

某些情况下鼠标坐标计算错误

图形库中的arc图形的overflow属性为"hidden"时会出问题

一个很麻烦的问题：
库里有一对mouseX和mouseY属性，他们都是通过mousemove事件来触发并改变值的，库内部元素的大部分鼠标事件都依赖这两个值来判断被触发事件的元素， 不过mousemove事件改变这两个值似乎有些延迟，所以打开Debug模式以后会发现下面的这两个值似乎没有随你的鼠标移动停止而停止，这有些降低用户体验


------------------------
更新log
------------------------
JiaJiaJun:添加合成效果，添加图形库
[demo]:http://jiastorage.duapp.com/demo/CanvasObjLibrary/