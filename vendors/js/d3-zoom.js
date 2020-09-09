// // https://d3js.org/d3-zoom/ v1.8.3 Copyright 2019 Mike Bostock
// (function (global, factory) {
// typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-dispatch'), require('d3-drag'), require('d3-interpolate'), require('d3-selection'), require('d3-transition')) :
// typeof define === 'function' && define.amd ? define(['exports', 'd3-dispatch', 'd3-drag', 'd3-interpolate', 'd3-selection', 'd3-transition'], factory) :
// (global = global || self, factory(global.d3 = global.d3 || {}, global.d3, global.d3, global.d3, global.d3, global.d3));
// }(this, function (exports, d3Dispatch, d3Drag, d3Interpolate, d3Selection, d3Transition) { 'use strict';

// function constant(x) {
//   return function() {
//     return x;
//   };
// }

// function ZoomEvent(target, type, transform) {
//   this.target = target;
//   this.type = type;
//   this.transform = transform;
// }

// function Transform(k, x, y) {
//   this.k = k;
//   this.x = x;
//   this.y = y;
// }

// Transform.prototype = {
//   constructor: Transform,
//   scale: function(k) {
//     return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
//   },
//   translate: function(x, y) {
//     return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
//   },
//   apply: function(point) {
//     return [point[0] * this.k + this.x, point[1] * this.k + this.y];
//   },
//   applyX: function(x) {
//     return x * this.k + this.x;
//   },
//   applyY: function(y) {
//     return y * this.k + this.y;
//   },
//   invert: function(location) {
//     return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
//   },
//   invertX: function(x) {
//     return (x - this.x) / this.k;
//   },
//   invertY: function(y) {
//     return (y - this.y) / this.k;
//   },
//   rescaleX: function(x) {
//     return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
//   },
//   rescaleY: function(y) {
//     return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
//   },
//   toString: function() {
//     return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
//   }
// };

// var identity = new Transform(1, 0, 0);

// transform.prototype = Transform.prototype;

// function transform(node) {
//   while (!node.__zoom) if (!(node = node.parentNode)) return identity;
//   return node.__zoom;
// }

// function nopropagation() {
//   d3Selection.event.stopImmediatePropagation();
// }

// function noevent() {
//   d3Selection.event.preventDefault();
//   d3Selection.event.stopImmediatePropagation();
// }

// // Ignore right-click, since that should open the context menu.
// function defaultFilter() {
//   return !d3Selection.event.ctrlKey && !d3Selection.event.button;
// }

// function defaultExtent() {
//   var e = this;
//   if (e instanceof SVGElement) {
//     e = e.ownerSVGElement || e;
//     if (e.hasAttribute("viewBox")) {
//       e = e.viewBox.baseVal;
//       return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
//     }
//     return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
//   }
//   return [[0, 0], [e.clientWidth, e.clientHeight]];
// }

// function defaultTransform() {
//   return this.__zoom || identity;
// }

// function defaultWheelDelta() {
//   return -d3Selection.event.deltaY * (d3Selection.event.deltaMode === 1 ? 0.05 : d3Selection.event.deltaMode ? 1 : 0.002);
// }

// function defaultTouchable() {
//   return navigator.maxTouchPoints || ("ontouchstart" in this);
// }

// function defaultConstrain(transform, extent, translateExtent) {
//   var dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0],
//       dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0],
//       dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1],
//       dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];
//   return transform.translate(
//     dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
//     dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
//   );
// }

// function zoom() {
//   var filter = defaultFilter,
//       extent = defaultExtent,
//       constrain = defaultConstrain,
//       wheelDelta = defaultWheelDelta,
//       touchable = defaultTouchable,
//       scaleExtent = [0, Infinity],
//       translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]],
//       duration = 250,
//       interpolate = d3Interpolate.interpolateZoom,
//       listeners = d3Dispatch.dispatch("start", "zoom", "end"),
//       touchstarting,
//       touchending,
//       touchDelay = 500,
//       wheelDelay = 150,
//       clickDistance2 = 0;

//   function zoom(selection) {
//     selection
//         .property("__zoom", defaultTransform)
//         .on("wheel.zoom", wheeled)
//         .on("mousedown.zoom", mousedowned)
//         .on("dblclick.zoom", dblclicked)
//       .filter(touchable)
//         .on("touchstart.zoom", touchstarted)
//         .on("touchmove.zoom", touchmoved)
//         .on("touchend.zoom touchcancel.zoom", touchended)
//         .style("touch-action", "none")
//         .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
//   }

//   zoom.transform = function(collection, transform, point) {
//     var selection = collection.selection ? collection.selection() : collection;
//     selection.property("__zoom", defaultTransform);
//     if (collection !== selection) {
//       schedule(collection, transform, point);
//     } else {
//       selection.interrupt().each(function() {
//         gesture(this, arguments)
//             .start()
//             .zoom(null, typeof transform === "function" ? transform.apply(this, arguments) : transform)
//             .end();
//       });
//     }
//   };

//   zoom.scaleBy = function(selection, k, p) {
//     zoom.scaleTo(selection, function() {
//       var k0 = this.__zoom.k,
//           k1 = typeof k === "function" ? k.apply(this, arguments) : k;
//       return k0 * k1;
//     }, p);
//   };

//   zoom.scaleTo = function(selection, k, p) {
//     zoom.transform(selection, function() {
//       var e = extent.apply(this, arguments),
//           t0 = this.__zoom,
//           p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p,
//           p1 = t0.invert(p0),
//           k1 = typeof k === "function" ? k.apply(this, arguments) : k;
//       return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
//     }, p);
//   };

//   zoom.translateBy = function(selection, x, y) {
//     zoom.transform(selection, function() {
//       return constrain(this.__zoom.translate(
//         typeof x === "function" ? x.apply(this, arguments) : x,
//         typeof y === "function" ? y.apply(this, arguments) : y
//       ), extent.apply(this, arguments), translateExtent);
//     });
//   };

//   zoom.translateTo = function(selection, x, y, p) {
//     zoom.transform(selection, function() {
//       var e = extent.apply(this, arguments),
//           t = this.__zoom,
//           p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
//       return constrain(identity.translate(p0[0], p0[1]).scale(t.k).translate(
//         typeof x === "function" ? -x.apply(this, arguments) : -x,
//         typeof y === "function" ? -y.apply(this, arguments) : -y
//       ), e, translateExtent);
//     }, p);
//   };

//   function scale(transform, k) {
//     k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
//     return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
//   }

//   function translate(transform, p0, p1) {
//     var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
//     return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
//   }

//   function centroid(extent) {
//     return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
//   }

//   function schedule(transition, transform, point) {
//     transition
//         .on("start.zoom", function() { gesture(this, arguments).start(); })
//         .on("interrupt.zoom end.zoom", function() { gesture(this, arguments).end(); })
//         .tween("zoom", function() {
//           var that = this,
//               args = arguments,
//               g = gesture(that, args),
//               e = extent.apply(that, args),
//               p = point == null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point,
//               w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
//               a = that.__zoom,
//               b = typeof transform === "function" ? transform.apply(that, args) : transform,
//               i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
//           return function(t) {
//             if (t === 1) t = b; // Avoid rounding error on end.
//             else { var l = i(t), k = w / l[2]; t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k); }
//             g.zoom(null, t);
//           };
//         });
//   }

//   function gesture(that, args, clean) {
//     return (!clean && that.__zooming) || new Gesture(that, args);
//   }

//   function Gesture(that, args) {
//     this.that = that;
//     this.args = args;
//     this.active = 0;
//     this.extent = extent.apply(that, args);
//     this.taps = 0;
//   }

//   Gesture.prototype = {
//     start: function() {
//       if (++this.active === 1) {
//         this.that.__zooming = this;
//         this.emit("start");
//       }
//       return this;
//     },
//     zoom: function(key, transform) {
//       if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0]);
//       if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0]);
//       if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0]);
//       this.that.__zoom = transform;
//       this.emit("zoom");
//       return this;
//     },
//     end: function() {
//       if (--this.active === 0) {
//         delete this.that.__zooming;
//         this.emit("end");
//       }
//       return this;
//     },
//     emit: function(type) {
//       d3Selection.customEvent(new ZoomEvent(zoom, type, this.that.__zoom), listeners.apply, listeners, [type, this.that, this.args]);
//     }
//   };

//   function wheeled() {
//     if (!filter.apply(this, arguments)) return;
//     var g = gesture(this, arguments),
//         t = this.__zoom,
//         k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))),
//         p = d3Selection.mouse(this);

//     // If the mouse is in the same location as before, reuse it.
//     // If there were recent wheel events, reset the wheel idle timeout.
//     if (g.wheel) {
//       if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
//         g.mouse[1] = t.invert(g.mouse[0] = p);
//       }
//       clearTimeout(g.wheel);
//     }

//     // If this wheel event won’t trigger a transform change, ignore it.
//     else if (t.k === k) return;

//     // Otherwise, capture the mouse point and location at the start.
//     else {
//       g.mouse = [p, t.invert(p)];
//       d3Transition.interrupt(this);
//       g.start();
//     }

//     noevent();
//     g.wheel = setTimeout(wheelidled, wheelDelay);
//     g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));

//     function wheelidled() {
//       g.wheel = null;
//       g.end();
//     }
//   }

//   function mousedowned() {
//     if (touchending || !filter.apply(this, arguments)) return;
//     var g = gesture(this, arguments, true),
//         v = d3Selection.select(d3Selection.event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true),
//         p = d3Selection.mouse(this),
//         x0 = d3Selection.event.clientX,
//         y0 = d3Selection.event.clientY;

//     d3Drag.dragDisable(d3Selection.event.view);
//     nopropagation();
//     g.mouse = [p, this.__zoom.invert(p)];
//     d3Transition.interrupt(this);
//     g.start();

//     function mousemoved() {
//       noevent();
//       if (!g.moved) {
//         var dx = d3Selection.event.clientX - x0, dy = d3Selection.event.clientY - y0;
//         g.moved = dx * dx + dy * dy > clickDistance2;
//       }
//       g.zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = d3Selection.mouse(g.that), g.mouse[1]), g.extent, translateExtent));
//     }

//     function mouseupped() {
//       v.on("mousemove.zoom mouseup.zoom", null);
//       d3Drag.dragEnable(d3Selection.event.view, g.moved);
//       noevent();
//       g.end();
//     }
//   }

//   function dblclicked() {
//     if (!filter.apply(this, arguments)) return;
//     var t0 = this.__zoom,
//         p0 = d3Selection.mouse(this),
//         p1 = t0.invert(p0),
//         k1 = t0.k * (d3Selection.event.shiftKey ? 0.5 : 2),
//         t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, arguments), translateExtent);

//     noevent();
//     if (duration > 0) d3Selection.select(this).transition().duration(duration).call(schedule, t1, p0);
//     else d3Selection.select(this).call(zoom.transform, t1);
//   }

//   function touchstarted() {
//     if (!filter.apply(this, arguments)) return;
//     var touches = d3Selection.event.touches,
//         n = touches.length,
//         g = gesture(this, arguments, d3Selection.event.changedTouches.length === n),
//         started, i, t, p;

//     nopropagation();
//     for (i = 0; i < n; ++i) {
//       t = touches[i], p = d3Selection.touch(this, touches, t.identifier);
//       p = [p, this.__zoom.invert(p), t.identifier];
//       if (!g.touch0) g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
//       else if (!g.touch1 && g.touch0[2] !== p[2]) g.touch1 = p, g.taps = 0;
//     }

//     if (touchstarting) touchstarting = clearTimeout(touchstarting);

//     if (started) {
//       if (g.taps < 2) touchstarting = setTimeout(function() { touchstarting = null; }, touchDelay);
//       d3Transition.interrupt(this);
//       g.start();
//     }
//   }

//   function touchmoved() {
//     if (!this.__zooming) return;
//     var g = gesture(this, arguments),
//         touches = d3Selection.event.changedTouches,
//         n = touches.length, i, t, p, l;

//     noevent();
//     if (touchstarting) touchstarting = clearTimeout(touchstarting);
//     g.taps = 0;
//     for (i = 0; i < n; ++i) {
//       t = touches[i], p = d3Selection.touch(this, touches, t.identifier);
//       if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
//       else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
//     }
//     t = g.that.__zoom;
//     if (g.touch1) {
//       var p0 = g.touch0[0], l0 = g.touch0[1],
//           p1 = g.touch1[0], l1 = g.touch1[1],
//           dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
//           dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
//       t = scale(t, Math.sqrt(dp / dl));
//       p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
//       l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
//     }
//     else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
//     else return;
//     g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
//   }

//   function touchended() {
//     if (!this.__zooming) return;
//     var g = gesture(this, arguments),
//         touches = d3Selection.event.changedTouches,
//         n = touches.length, i, t;

//     nopropagation();
//     if (touchending) clearTimeout(touchending);
//     touchending = setTimeout(function() { touchending = null; }, touchDelay);
//     for (i = 0; i < n; ++i) {
//       t = touches[i];
//       if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
//       else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
//     }
//     if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
//     if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0]);
//     else {
//       g.end();
//       // If this was a dbltap, reroute to the (optional) dblclick.zoom handler.
//       if (g.taps === 2) {
//         var p = d3Selection.select(this).on("dblclick.zoom");
//         if (p) p.apply(this, arguments);
//       }
//     }
//   }

//   zoom.wheelDelta = function(_) {
//     return arguments.length ? (wheelDelta = typeof _ === "function" ? _ : constant(+_), zoom) : wheelDelta;
//   };

//   zoom.filter = function(_) {
//     return arguments.length ? (filter = typeof _ === "function" ? _ : constant(!!_), zoom) : filter;
//   };

//   zoom.touchable = function(_) {
//     return arguments.length ? (touchable = typeof _ === "function" ? _ : constant(!!_), zoom) : touchable;
//   };

//   zoom.extent = function(_) {
//     return arguments.length ? (extent = typeof _ === "function" ? _ : constant([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
//   };

//   zoom.scaleExtent = function(_) {
//     return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
//   };

//   zoom.translateExtent = function(_) {
//     return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
//   };

//   zoom.constrain = function(_) {
//     return arguments.length ? (constrain = _, zoom) : constrain;
//   };

//   zoom.duration = function(_) {
//     return arguments.length ? (duration = +_, zoom) : duration;
//   };

//   zoom.interpolate = function(_) {
//     return arguments.length ? (interpolate = _, zoom) : interpolate;
//   };

//   zoom.on = function() {
//     var value = listeners.on.apply(listeners, arguments);
//     return value === listeners ? zoom : value;
//   };

//   zoom.clickDistance = function(_) {
//     return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
//   };

//   return zoom;
// }

// exports.zoom = zoom;
// exports.zoomIdentity = identity;
// exports.zoomTransform = transform;

// Object.defineProperty(exports, '__esModule', { value: true });

// }));


// https://d3js.org/d3-zoom/ v1.8.3 Copyright 2019 Mike Bostock
! function (t, n) {
    "object" == typeof exports && "undefined" != typeof module ? n(exports, require("d3-dispatch"), require("d3-drag"), require("d3-interpolate"), require("d3-selection"), require("d3-transition")) : "function" == typeof define && define.amd ? define(["exports", "d3-dispatch", "d3-drag", "d3-interpolate", "d3-selection", "d3-transition"], n) : n((t = t || self).d3 = t.d3 || {}, t.d3, t.d3, t.d3, t.d3, t.d3)
}(this, function (t, n, e, o, i, u) {
    "use strict";

    function r(t) {
        return function () {
            return t
        }
    }

    function s(t, n, e) {
        this.target = t, this.type = n, this.transform = e
    }

    function h(t, n, e) {
        this.k = t, this.x = n, this.y = e
    }
    h.prototype = {
        constructor: h,
        scale: function (t) {
            return 1 === t ? this : new h(this.k * t, this.x, this.y)
        },
        translate: function (t, n) {
            return 0 === t & 0 === n ? this : new h(this.k, this.x + this.k * t, this.y + this.k * n)
        },
        apply: function (t) {
            return [t[0] * this.k + this.x, t[1] * this.k + this.y]
        },
        applyX: function (t) {
            return t * this.k + this.x
        },
        applyY: function (t) {
            return t * this.k + this.y
        },
        invert: function (t) {
            return [(t[0] - this.x) / this.k, (t[1] - this.y) / this.k]
        },
        invertX: function (t) {
            return (t - this.x) / this.k
        },
        invertY: function (t) {
            return (t - this.y) / this.k
        },
        rescaleX: function (t) {
            return t.copy().domain(t.range().map(this.invertX, this).map(t.invert, t))
        },
        rescaleY: function (t) {
            return t.copy().domain(t.range().map(this.invertY, this).map(t.invert, t))
        },
        toString: function () {
            return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")"
        }
    };
    var c = new h(1, 0, 0);

    function a(t) {
        for (; !t.__zoom;)
            if (!(t = t.parentNode)) return c;
        return t.__zoom
    }

    function f() {
        i.event.stopImmediatePropagation()
    }

    function l() {
        i.event.preventDefault(), i.event.stopImmediatePropagation()
    }

    function m() {
        return !i.event.ctrlKey && !i.event.button
    }

    function p() {
        var t = this;
        return t instanceof SVGElement ? (t = t.ownerSVGElement || t).hasAttribute("viewBox") ? [
            [(t = t.viewBox.baseVal).x, t.y],
            [t.x + t.width, t.y + t.height]
        ] : [
            [0, 0],
            [t.width.baseVal.value, t.height.baseVal.value]
        ] : [
            [0, 0],
            [t.clientWidth, t.clientHeight]
        ]
    }

    function v() {
        return this.__zoom || c
    }

    function d() {
        return -i.event.deltaY * (1 === i.event.deltaMode ? .05 : i.event.deltaMode ? 1 : .002)
    }

    function y() {
        return navigator.maxTouchPoints || "ontouchstart" in this
    }

    function z(t, n, e) {
        var o = t.invertX(n[0][0]) - e[0][0],
            i = t.invertX(n[1][0]) - e[1][0],
            u = t.invertY(n[0][1]) - e[0][1],
            r = t.invertY(n[1][1]) - e[1][1];
        return t.translate(i > o ? (o + i) / 2 : Math.min(0, o) || Math.max(0, i), r > u ? (u + r) / 2 : Math.min(0, u) || Math.max(0, r))
    }
    a.prototype = h.prototype, t.zoom = function () {
        var t, a, _ = m,
            g = p,
            x = z,
            k = d,
            w = y,
            M = [0, 1 / 0],
            T = [
                [-1 / 0, -1 / 0],
                [1 / 0, 1 / 0]
            ],
            b = 250,
            Y = o.interpolateZoom,
            X = n.dispatch("start", "zoom", "end"),
            q = 500,
            E = 150,
            V = 0;

        function B(t) {
            t.property("__zoom", v).on("wheel.zoom", K).on("mousedown.zoom", A).on("dblclick.zoom", H).filter(w).on("touchstart.zoom", N).on("touchmove.zoom", O).on("touchend.zoom touchcancel.zoom", W).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
        }

        function D(t, n) {
            return (n = Math.max(M[0], Math.min(M[1], n))) === t.k ? t : new h(n, t.x, t.y)
        }

        function P(t, n, e) {
            var o = n[0] - e[0] * t.k,
                i = n[1] - e[1] * t.k;
            return o === t.x && i === t.y ? t : new h(t.k, o, i)
        }

        function I(t) {
            return [(+t[0][0] + +t[1][0]) / 2, (+t[0][1] + +t[1][1]) / 2]
        }

        function S(t, n, e) {
            t.on("start.zoom", function () {
                j(this, arguments).start()
            }).on("interrupt.zoom end.zoom", function () {
                j(this, arguments).end()
            }).tween("zoom", function () {
                var t = this,
                    o = arguments,
                    i = j(t, o),
                    u = g.apply(t, o),
                    r = null == e ? I(u) : "function" == typeof e ? e.apply(t, o) : e,
                    s = Math.max(u[1][0] - u[0][0], u[1][1] - u[0][1]),
                    c = t.__zoom,
                    a = "function" == typeof n ? n.apply(t, o) : n,
                    f = Y(c.invert(r).concat(s / c.k), a.invert(r).concat(s / a.k));
                return function (t) {
                    if (1 === t) t = a;
                    else {
                        var n = f(t),
                            e = s / n[2];
                        t = new h(e, r[0] - n[0] * e, r[1] - n[1] * e)
                    }
                    i.zoom(null, t)
                }
            })
        }

        function j(t, n, e) {
            return !e && t.__zooming || new G(t, n)
        }

        function G(t, n) {
            this.that = t, this.args = n, this.active = 0, this.extent = g.apply(t, n), this.taps = 0
        }

        function K() {
            if (_.apply(this, arguments)) {
                var t = j(this, arguments),
                    n = this.__zoom,
                    e = Math.max(M[0], Math.min(M[1], n.k * Math.pow(2, k.apply(this, arguments)))),
                    o = i.mouse(this);
                if (t.wheel) t.mouse[0][0] === o[0] && t.mouse[0][1] === o[1] || (t.mouse[1] = n.invert(t.mouse[0] = o)), clearTimeout(t.wheel);
                else {
                    if (n.k === e) return;
                    t.mouse = [o, n.invert(o)], u.interrupt(this), t.start()
                }
                l(), t.wheel = setTimeout(function () {
                    t.wheel = null, t.end()
                }, E), t.zoom("mouse", x(P(D(n, e), t.mouse[0], t.mouse[1]), t.extent, T))
            }
        }

        function A() {
            if (!a && _.apply(this, arguments)) {
                var t = j(this, arguments, !0),
                    n = i.select(i.event.view).on("mousemove.zoom", function () {
                        if (l(), !t.moved) {
                            var n = i.event.clientX - r,
                                e = i.event.clientY - s;
                            t.moved = n * n + e * e > V
                        }
                        t.zoom("mouse", x(P(t.that.__zoom, t.mouse[0] = i.mouse(t.that), t.mouse[1]), t.extent, T))
                    }, !0).on("mouseup.zoom", function () {
                        n.on("mousemove.zoom mouseup.zoom", null), e.dragEnable(i.event.view, t.moved), l(), t.end()
                    }, !0),
                    o = i.mouse(this),
                    r = i.event.clientX,
                    s = i.event.clientY;
                e.dragDisable(i.event.view), f(), t.mouse = [o, this.__zoom.invert(o)], u.interrupt(this), t.start()
            }
        }

        function H() {
            if (_.apply(this, arguments)) {
                var t = this.__zoom,
                    n = i.mouse(this),
                    e = t.invert(n),
                    o = t.k * (i.event.shiftKey ? .5 : 2),
                    u = x(P(D(t, o), n, e), g.apply(this, arguments), T);
                l(), b > 0 ? i.select(this).transition().duration(b).call(S, u, n) : i.select(this).call(B.transform, u)
            }
        }

        function N() {
            if (_.apply(this, arguments)) {
                var n, e, o, r, s = i.event.touches,
                    h = s.length,
                    c = j(this, arguments, i.event.changedTouches.length === h);
                for (f(), e = 0; e < h; ++e) o = s[e], r = [r = i.touch(this, s, o.identifier), this.__zoom.invert(r), o.identifier], c.touch0 ? c.touch1 || c.touch0[2] === r[2] || (c.touch1 = r, c.taps = 0) : (c.touch0 = r, n = !0, c.taps = 1 + !!t);
                t && (t = clearTimeout(t)), n && (c.taps < 2 && (t = setTimeout(function () {
                    t = null
                }, q)), u.interrupt(this), c.start())
            }
        }

        function O() {
            if (this.__zooming) {
                var n, e, o, u, r = j(this, arguments),
                    s = i.event.changedTouches,
                    h = s.length;
                for (l(), t && (t = clearTimeout(t)), r.taps = 0, n = 0; n < h; ++n) e = s[n], o = i.touch(this, s, e.identifier), r.touch0 && r.touch0[2] === e.identifier ? r.touch0[0] = o : r.touch1 && r.touch1[2] === e.identifier && (r.touch1[0] = o);
                if (e = r.that.__zoom, r.touch1) {
                    var c = r.touch0[0],
                        a = r.touch0[1],
                        f = r.touch1[0],
                        m = r.touch1[1],
                        p = (p = f[0] - c[0]) * p + (p = f[1] - c[1]) * p,
                        v = (v = m[0] - a[0]) * v + (v = m[1] - a[1]) * v;
                    e = D(e, Math.sqrt(p / v)), o = [(c[0] + f[0]) / 2, (c[1] + f[1]) / 2], u = [(a[0] + m[0]) / 2, (a[1] + m[1]) / 2]
                } else {
                    if (!r.touch0) return;
                    o = r.touch0[0], u = r.touch0[1]
                }
                r.zoom("touch", x(P(e, o, u), r.extent, T))
            }
        }

        function W() {
            if (this.__zooming) {
                var t, n, e = j(this, arguments),
                    o = i.event.changedTouches,
                    u = o.length;
                for (f(), a && clearTimeout(a), a = setTimeout(function () {
                        a = null
                    }, q), t = 0; t < u; ++t) n = o[t], e.touch0 && e.touch0[2] === n.identifier ? delete e.touch0 : e.touch1 && e.touch1[2] === n.identifier && delete e.touch1;
                if (e.touch1 && !e.touch0 && (e.touch0 = e.touch1, delete e.touch1), e.touch0) e.touch0[1] = this.__zoom.invert(e.touch0[0]);
                else if (e.end(), 2 === e.taps) {
                    var r = i.select(this).on("dblclick.zoom");
                    r && r.apply(this, arguments)
                }
            }
        }
        return B.transform = function (t, n, e) {
            var o = t.selection ? t.selection() : t;
            o.property("__zoom", v), t !== o ? S(t, n, e) : o.interrupt().each(function () {
                j(this, arguments).start().zoom(null, "function" == typeof n ? n.apply(this, arguments) : n).end()
            })
        }, B.scaleBy = function (t, n, e) {
            B.scaleTo(t, function () {
                var t = this.__zoom.k,
                    e = "function" == typeof n ? n.apply(this, arguments) : n;
                return t * e
            }, e)
        }, B.scaleTo = function (t, n, e) {
            B.transform(t, function () {
                var t = g.apply(this, arguments),
                    o = this.__zoom,
                    i = null == e ? I(t) : "function" == typeof e ? e.apply(this, arguments) : e,
                    u = o.invert(i),
                    r = "function" == typeof n ? n.apply(this, arguments) : n;
                return x(P(D(o, r), i, u), t, T)
            }, e)
        }, B.translateBy = function (t, n, e) {
            B.transform(t, function () {
                return x(this.__zoom.translate("function" == typeof n ? n.apply(this, arguments) : n, "function" == typeof e ? e.apply(this, arguments) : e), g.apply(this, arguments), T)
            })
        }, B.translateTo = function (t, n, e, o) {
            B.transform(t, function () {
                var t = g.apply(this, arguments),
                    i = this.__zoom,
                    u = null == o ? I(t) : "function" == typeof o ? o.apply(this, arguments) : o;
                return x(c.translate(u[0], u[1]).scale(i.k).translate("function" == typeof n ? -n.apply(this, arguments) : -n, "function" == typeof e ? -e.apply(this, arguments) : -e), t, T)
            }, o)
        }, G.prototype = {
            start: function () {
                return 1 == ++this.active && (this.that.__zooming = this, this.emit("start")), this
            },
            zoom: function (t, n) {
                return this.mouse && "mouse" !== t && (this.mouse[1] = n.invert(this.mouse[0])), this.touch0 && "touch" !== t && (this.touch0[1] = n.invert(this.touch0[0])), this.touch1 && "touch" !== t && (this.touch1[1] = n.invert(this.touch1[0])), this.that.__zoom = n, this.emit("zoom"), this
            },
            end: function () {
                return 0 == --this.active && (delete this.that.__zooming, this.emit("end")), this
            },
            emit: function (t) {
                i.customEvent(new s(B, t, this.that.__zoom), X.apply, X, [t, this.that, this.args])
            }
        }, B.wheelDelta = function (t) {
            return arguments.length ? (k = "function" == typeof t ? t : r(+t), B) : k
        }, B.filter = function (t) {
            return arguments.length ? (_ = "function" == typeof t ? t : r(!!t), B) : _
        }, B.touchable = function (t) {
            return arguments.length ? (w = "function" == typeof t ? t : r(!!t), B) : w
        }, B.extent = function (t) {
            return arguments.length ? (g = "function" == typeof t ? t : r([
                [+t[0][0], +t[0][1]],
                [+t[1][0], +t[1][1]]
            ]), B) : g
        }, B.scaleExtent = function (t) {
            return arguments.length ? (M[0] = +t[0], M[1] = +t[1], B) : [M[0], M[1]]
        }, B.translateExtent = function (t) {
            return arguments.length ? (T[0][0] = +t[0][0], T[1][0] = +t[1][0], T[0][1] = +t[0][1], T[1][1] = +t[1][1], B) : [
                [T[0][0], T[0][1]],
                [T[1][0], T[1][1]]
            ]
        }, B.constrain = function (t) {
            return arguments.length ? (x = t, B) : x
        }, B.duration = function (t) {
            return arguments.length ? (b = +t, B) : b
        }, B.interpolate = function (t) {
            return arguments.length ? (Y = t, B) : Y
        }, B.on = function () {
            var t = X.on.apply(X, arguments);
            return t === X ? B : t
        }, B.clickDistance = function (t) {
            return arguments.length ? (V = (t = +t) * t, B) : Math.sqrt(V)
        }, B
    }, t.zoomIdentity = c, t.zoomTransform = a, Object.defineProperty(t, "__esModule", {
        value: !0
    })
});