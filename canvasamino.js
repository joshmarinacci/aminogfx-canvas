var amino = require('aminogfx');
var input = amino.input;
var Core = amino.Core;

var fontmap = {};
var dprint_text = "";
function dprint(str) {
    dprint_text = str;
}


function CPropAnim(target,name) {
    this._from = null;
    this._to = null;
    this._duration = 1000;
    this._loop = 1;
    this._delay = 0;
    this._autoreverse = 0;
    /*
    if(remap[name]) {
        name = remap[name];
    }
    */
    this._then_fun = null;

    this.from = function(val) {  this._from = val;        return this;  }
    this.to   = function(val) {  this._to = val;          return this;  }
    this.dur  = function(val) {  this._duration = val;    return this;  }
    this.delay= function(val) {  this._delay = val;       return this;  }
    this.loop = function(val) {  this._loop = val;        return this;  }
    this.then = function(fun) {  this._then_fun = fun;    return this;  }
    this.autoreverse = function(val) { this._autoreverse = val?1:0; return this;  }

    this.start = function() {
        var self = this;
        setTimeout(function(){
            //var nat = amino.getCore().getNative();
            var nat = canvas_native;
            self.handle = nat.createAnim(target.handle, name, self._from, self._to, self._duration, self._loop, self._autoreverse);
            nat.updateAnimProperty(self.handle, 'count', self._loop);
            nat.updateAnimProperty(self.handle, 'autoreverse', self._autoreverse);
            nat.updateAnimProperty(self.handle, 'lerpprop', 17); //17 is cubic in out
            Core.getCore().anims.push(self.handle);
            self.handle.init(Core.getCore());
        },this._delay);
        return this;
    }

    this.finish = function() {
        if(this._then_fun != null) {
            this._then_fun();
        }
    }


}

var pending = false;
function scheduleRepaint() {
    if(!pending) {
        pending = true;
        requestAnimationFrame(function() {
            canvas_native.tick(Core.getCore());
            pending = false;
            if(Core.getCore().animsrunning === true) scheduleRepaint();
        });
    }
}

var canvas_native = {
    list:[],
    dirty: false,

    createDefaultFont: function(path) {
        //console.log('creating native font ' + path);
        return new CanvasFont(this.domctx);
    },
    registerFont:function(args) {
        fontmap[args.name] = new CanvasFont(this.domctx,args.name);
    },
    init: function() {
        //console.log("canvas amino doesn't really do an init");
    },
    startEventLoop: function() {
        //console.log("canvas amino pretending to start an event loop");
    },
    setEventCallback: function(cb) {
        //console.log("pretending to set an event callback");
    },
    createWindow: function(core,w,h) {
        fontmap['source']  = new CanvasFont(this.domctx,'source');//_dirname+"/fonts/SourceSansPro-Regular.ttf");
        fontmap['awesome'] = new CanvasFont(this.domctx,'awesome');//__dirname+"/fonts/fontawesome-webfont.ttf");
        core.defaultFont = fontmap['source'];
        this.domcanvas.width = this.domcanvas.clientWidth;
        this.domcanvas.height = this.domcanvas.clientHeight;
    },
    getFont: function(name) {
        return fontmap[name];
    },
    createRect: function() {
        var rect = {
            "kind":"CanvasRect",
            x:0,
            y:0,
            w:100,
            h:100,
            r:0.5,
            g:0.5,
            b:0.5,
            visible:1,
            draw: function(g) {
                if(this.visible != 1) return;
                g.save();
                g.translate(this.x,this.y);
                g.scale(this.scalex,this.scaley);
                if(this.opacity != 1.0) {
                    g.globalAlpha = this.opacity;
                }
                g.fillStyle = 'rgb('+this.r*255+','+this.g*255+','+this.b*255+')';
                if(this.texid) {
                    //console.log(" now texid = ",this.texid);
                    g.drawImage(this.texid, 0,0);
                } else {
                    g.fillRect(0,0,this.w,this.h);
                }
                g.restore();
            }
        };
        this.list.push(rect);
        return rect;
    },
    createPoly: function() {
        var rect = {
            "kind":"CanvasPoly",
            tx:0,
            ty:0,
            w:100,
            h:100,
            r:0.5,
            g:0.5,
            b:0.5,
            visible:1,
            geometry:[0,0,0,  100,0,0,  100,100,0],
            dimension: -1,
            draw: function(g) {
                if(this.dimension < 2) throw new Error("Polygon with invalid dimension!",this.dimension);
                if(this.visible != 1) return;
                g.save();
                if(this.opacity != 1.0) {
                    g.globalAlpha = this.opacity;
                }
                g.translate(this.tx,this.ty);
                g.scale(this.scalex,this.scaley);
                g.fillStyle = 'rgb('+this.r*255+','+this.g*255+','+this.b*255+')';
                g.beginPath();
                var gm = this.geometry;
                for(var i=0; i<this.geometry.length; i+=this.dimension) {
                    if(i == 0) {
                        g.moveTo(gm[i],gm[i+1]);
                    } else {
                        g.lineTo(gm[i],gm[i+1]);
                    }
                }
                if(this.closed) {
                    g.closePath();
                }
                if(this.filled) {
                    g.fill();
                } else {
                    g.stroke();
                }
                g.restore();
            }
        }
        this.list.push(rect);
        return rect;
    },
    createGroup: function() {
        var group = {
            kind:"CanvasGroup",
            children:[],
            x:0,
            y:0,
            sx:1,
            sy:1,
            visible:1,
            draw: function(g) {
                if(this.visible != 1) return;
                g.save();
                g.translate(this.x,this.y);
                g.scale(this.sx,this.sy);

                if(this.cliprect == 1) {
                    g.beginPath();
                    g.rect(0,0,this.w,this.h);
                    g.clip();
                }

                for(var i=0; i<this.children.length; i++) {
                    this.children[i].draw(g);
                }
                g.restore();
            }
        }
        this.list.push(group);
        return group;
    },
    createText: function() {
        var text = {
            kind:"CanvasText",
            text:"foo",
            x:0,
            y:0,
            visible:1,
            r:1.0,
            g:1.0,
            b:1.0,
            draw: function(g) {
                if(this.visible != 1) return;
                g.save();
                g.fillStyle = "rgb("+this.r*255+","+this.g*255+","+this.b*255+")";
                g.font = this.fontSize +"px "+this.fontId+", sans-serif";
                g.fillText(this.text,this.x,this.y);
                g.restore();
            }
        };
        return text;
    },
    createCanvasDirectNode: function() {
        var node = {
            'kind':'CanvasDirectNode',
            tx:0,
            ty:0,
            w:100,
            h:100,
            drawFunc: null,
            draw: function(g) {
                if(this.drawFunc) {
                    this.drawFunc(g);
                }
                //console.log("drawing the canvas node");
            }
        }
        this.list.push(node);
        return node;
    },
    addNodeToGroup: function(h1,h2) {
        h2.children.push(h1);
    },
    removeNodeFromGroup: function(h1, h2) {
        var n = h2.children.indexOf(h1);
        h2.children.splice(n,1);
    },

    loadImage: function(path,cb) {
        var img = new Image();
        img.onload = function() {
            img.texid = img;
            img.w = img.width;
            img.h = img.height;
            cb(img);
        }
        img.src = path;
    },
    updateProperty: function(handle, key, value) {
        handle[key] = value;
        scheduleRepaint();
    },
    setRoot: function(root) {
        this.root = root;
    },
    tick: function(core) {
        this.sendValidate();
        this.processAnims(core);
        var w = this.domcanvas.width;
        var h = this.domcanvas.height;
        var g = this.domctx;
        if(core.stage.transparent() === true) {
            g.clearRect(0,0,w,h);
        } else {
            g.fillStyle = core.stage.fill();
            g.fillRect(0,0,w,h);
        }
        g.save();
        if(core.stage.smooth() === false) {
            g.webkitImageSmoothingEnabled = false;
            g.mozImageSmoothingEnabled = false;
        }
        this.root.draw(g);
        g.restore();
        //draw debug overlay
        /*
        g.fillStyle = "white";
        g.fillRect(0,0,200,30);
        g.fillStyle = "black";
        g.fillText(dprint_text,30,10);
        */
    },
    setWindowSize: function(w,h) {
        //NO OP
    },
    getWindowSize: function() {
        return {
            w: this.domcanvas.width,
            h: this.domcanvas.height
        };
    },
    createPropAnim: function(obj,name) {
        return new CPropAnim(obj,name);
    },
    createAnim: function(handle,prop,start,end,dur,count,rev) {
        return new CanvasPropAnim(handle,prop,start,end,dur,count,rev);
    },
    updateAnimProperty: function(handle, prop, value) {
        //console.log("pretending to update");
    },
    processAnims: function(core) {
        core.animsrunning = false;
        core.anims.forEach(function(anim) {
            anim.update();
            if(anim.active) {
                core.animsrunning = true;
            }
        });
    },
    sendValidate: function() {
        input.processEvent(Core.getCore(),{
            type: "validate"
        });
    }
};
Core.native = canvas_native;

function CanvasPropAnim(handle, prop, start,end,duration, count, rev) {
    this.target = handle;
    this.prop = prop;
    this.start = start;
    this.end = end;
    this.duration = duration;
    var FORWARD = 1;
    var BACKWARDS = 2;
    var FOREVER = -1;
    var direction = FORWARD;
    this.count = 1;
    var loopcount = count;
    this.autoreverse = rev;
    this.afterCallbacks = [];
    this.beforeCallbacks = [];

    this.active = true;
    this.applyValue = function(val) {
        this.target[this.prop] = val;
    };

    this.init = function(core) {
        this.startTime = Date.now();
    };

    this.setInterpolator = function(lerptype) {
        this.lerptype = lerptype;
        return this;
    };

    this.setCount = function(count) {
        this.count = count;
        loopcount = this.count;
        return this;
    };

    this.setAutoreverse = function(av) {
        this.autoreverse = av;
        return this;
    };

    this.finish = function() {
        this.node[this.prop] = this.end;
        for(var i in this.afterCallbacks) {
            this.afterCallbacks[i]();
        }
    }
    /** @func after(cb)  Sets a callback to be called when the animation finishes. Note: an infinite animation will never finish. */
    this.after = function(cb) {
        this.afterCallbacks.push(cb);
        return this;
    }

    this.before = function(cb) {
        this.beforeCallbacks.push(cb);
        return this;
    }
    this.toggle = function() {
        if(this.autoreverse == true) {
            if(direction == FORWARD) {
                direction = BACKWARDS;
            } else {
                direction = FORWARD;
            }
        }
    }
    this.endAnimation = function() {
        this.applyValue(this.end);
        this.active = false;
    }
    this.update = function() {
        if(!this.active) return;
        this.currentTime = Date.now();
        var t = (this.currentTime - this.startTime)/this.duration;
        if(t > 1) {
            if(loopcount == FOREVER) {
                this.startTime = this.currentTime;
                t = 0;
                this.toggle();
            }
            if(loopcount > 0) {
                loopcount--;
                if(loopcount > 0) {
                    t = 0;
                    this.startTime = this.currentTime;
                    this.toggle();
                } else {
                    this.endAnimation();
                    return;
                }
            }
        }
        if(direction == BACKWARDS) {
            t = 1-t;
        }
        //console.log(t);
        var val = (end-start)*t + start;
        this.applyValue(val);
    }
}

function CanvasFont(g,name) {
    this.g = g;
    this.name = name;
    this.calcStringWidth = function(str, size, weight, style) {
        g.font = size+"px sans-serif";
        var metrics = this.g.measureText(str);
        return metrics.width;
    };
    this.getHeight = function(size, weight, style) {
        g.font = size+"px sans-serif";
        return this.g.measureText('M').width;
    };
    this.getHeightMetrics = function(size, weight, style) {
        if(size == undefined) {
            throw new Error("SIZE IS UNDEFINED");
        }
        return {
            ascender: size,
            descender: -size/5
            //ascender: amino.sgtest.getFontAscender(size, this.getNative(size, weight, style)),
            //descender: amino.sgtest.getFontDescender(size, this.getNative(size, weight, style)),
        };
    }
    this.getNative = function(size,weight,style) {
        return this.name;
    };
}

//does platform specific native event handler setup
function attachEvent(node,name,func) {
    if(node.addEventListener) {
        node.addEventListener(name,func,false);
    } else if(node.attachEvent) {
        node.attachEvent(name,func);
    }
};

function toXY(e) {
    var rect = e.target.getBoundingClientRect();
    return {
        x: e.pageX-rect.left,
        y: e.pageY-rect.top
    }
}

function setupEventHandlers(core) {
    var dom = canvas_native.domcanvas;
    attachEvent(window,'resize',function(e) {
        dom.width = dom.clientWidth;
        dom.height = dom.clientHeight;
        input.processEvent(Core.getCore(),{
            type:"windowsize",
            width:dom.width,
            height:dom.height
        });
    });
    attachEvent(dom,'mousedown',function(e){
        e.preventDefault();
        var pt = toXY(e);
        input.processEvent(Core.getCore(),{
            type:"mouseposition",
            x:pt.x,
            y:pt.y
        });
        input.processEvent(Core.getCore(),{
            type:"mousebutton",
            button:0,
            state:1
        });
    });
    attachEvent(dom,'mousemove',function(e){
        var pt = toXY(e);
        e.preventDefault();
        input.processEvent(Core.getCore(),{
            type:"mouseposition",
            x:pt.x,
            y:pt.y
        });
    });
    attachEvent(dom,'mouseup',function(e){
        var pt = toXY(e);
        e.preventDefault();
        //mouseState.pressed = false;
        input.processEvent(Core.getCore(),{
            type:"mouseposition",
            x:pt.x,
            y:pt.y
        });
        input.processEvent(Core.getCore(),{
            type:"mousebutton",
            button:0,
            state:0
        });
    });

    attachEvent(window, 'touchstart', function(e) {
        var pt = toXY(e.touches[0]);
        //dprint("touchstart: " + pt.x + " " + pt.y);
        e.preventDefault();
        input.processEvent(Core.getCore(), {
            type: "mouseposition",
            x:pt.x,
            y:pt.y
        });
        input.processEvent(Core.getCore(),{
            type:"mousebutton",
            button:0,
            state:1
        });
    });

    attachEvent(dom,'touchmove',function(e){
        var pt = toXY(e.touches[0]);
        //dprint("touchmove: " + pt.x + " " + pt.y);
        e.preventDefault();
        input.processEvent(Core.getCore(),{
            type:"mouseposition",
            x:pt.x,
            y:pt.y
        });
    });

    attachEvent(dom,'touchend',function(e){
        var pt = toXY(e.changedTouches[0]);
        //dprint("touchend: " + pt.x + " " + pt.y);
        e.preventDefault();
        mouseState.pressed = false;
        input.processEvent(Core.getCore(),{
            type:"mouseposition",
            x:pt.x,
            y:pt.y
        });
        input.processEvent(Core.getCore(),{
            type:"mousebutton",
            button:0,
            state:0
        });
    });

    var keyRemap = {
        190:46, // period
        188:44 // comma
    };

    attachEvent(window,'keydown',function(e){
        if(e.metaKey) return;
        //e.preventDefault();
        var key = e.keyCode;
        if(keyRemap[key]) {
            key = keyRemap[key];
        }
        input.processEvent(Core.getCore(),{
                type:"keypress",
                keycode: key,
                shift:   e.shiftKey?1:0,
                control: e.ctrlKey?1:0,
                system:  e.metaKey?1:0
        });
    });
    attachEvent(window,'keyup',function(e){
        //e.preventDefault();
        input.processEvent(Core.getCore(),{
                type:"keyrelease",
                keycode: e.keyCode
        });
    });
    /*
    if(window.DeviceMotionEvent) {
        console.log("motion IS supported");
        attachEvent(window,'devicemotion',function(e){
            //self.processAccelEvent(Events.AccelerometerChanged, e);
        });
    } else {
        console.log("motion not supported");
    }
    */

}

exports.setCanvas = function(domcanvas) {
    if(domcanvas == null) throw new Error("couldn't find canvas with id " + id);
    canvas_native.domcanvas = domcanvas;
    canvas_native.domctx = domcanvas.getContext('2d');
    if(canvas_native.domctx == null) throw new Error("couldn't get a 2d context");
};

amino.native = canvas_native;
amino.start = function(cb) {
    if(!cb) throw new Error("CB parameter missing to start app");
    Core.setCore(new Core());
    var core = Core.getCore();
    core.native = canvas_native;
    amino.native = canvas_native;
    setupEventHandlers(core);
    core.handleWindowSizeEvent = function(evt) {
        scheduleRepaint();
    }
    core.init();
    var dom = canvas_native.domcanvas;
    var stage = core.createStage(dom.width,dom.height);
    cb(core,stage);
    core.start();
}
