
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var dist = createCommonjsModule(function (module, exports) {
    (function () {function wb(a){return a&&a.__esModule?{d:a.default}:{d:a}}var xb={};function yb(t,e){var i=Object.keys(t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);e&&(o=o.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})),i.push.apply(i,o);}return i}function od(t){for(var e=1;e<arguments.length;e++){var i=null!=arguments[e]?arguments[e]:{};e%2?yb(i,!0).forEach(function(e){pd(t,e,i[e]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(i)):yb(i).forEach(function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(i,e));});}return t}function pd(t,e,i){return e in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}function qd(){}var zb=function($){return null==$?qd:function(){return this.querySelector($)}};var rd=function(e){"function"!=typeof e&&(e=zb(e));for(var r=this._groups,t=r.length,a=new Array(t),l=0;l<t;++l)for(var $,_,o=r[l],n=o.length,i=a[l]=new Array(n),p=0;p<n;++p)($=o[p])&&(_=e.call($,$.__data__,p,o))&&("__data__"in $&&(_.__data__=$.__data__),i[p]=_);return new m(a,this._parents)};function sd(){return []}var td=function(t){return null==t?sd:function(){return this.querySelectorAll(t)}};var ud=function(e){"function"!=typeof e&&(e=td(e));for(var r=this._groups,p=r.length,t=[],$=[],f=0;f<p;++f)for(var l,o=r[f],a=o.length,u=0;u<a;++u)(l=o[u])&&(t.push(e.call(l,l.__data__,u,o)),$.push(l));return new m(t,$)};var vd=function(r){return function(){return this.matches(r)}};var wd=function(r){"function"!=typeof r&&(r=vd(r));for(var e=this._groups,a=e.length,t=new Array(a),$=0;$<a;++$)for(var S,o=e[$],n=o.length,p=t[$]=[],i=0;i<n;++i)(S=o[i])&&r.call(S,S.__data__,i,o)&&p.push(S);return new m(t,this._parents)};var Ab=function(e){return new Array(e.length)};var xd=function(){return new m(this._enter||this._groups.map(Ab),this._parents)};function ia(e,t){this.ownerDocument=e.ownerDocument,this.namespaceURI=e.namespaceURI,this._next=null,this._parent=e,this.__data__=t;}ia.prototype={constructor:ia,appendChild:function(e){return this._parent.insertBefore(e,this._next)},insertBefore:function(e,t){return this._parent.insertBefore(e,t)},querySelector:function(e){return this._parent.querySelector(e)},querySelectorAll:function(e){return this._parent.querySelectorAll(e)}};var yd=function(r){return function(){return r}};var Bb="$";function zd(r,e,n,$,t,a){for(var c,i=0,o=e.length,l=a.length;i<l;++i)(c=e[i])?(c.__data__=a[i],$[i]=c):n[i]=new ia(r,a[i]);for(;i<o;++i)(c=e[i])&&(t[i]=c);}function Ad(r,e,n,$,t,a,c){var i,o,l,f={},q=e.length,_=a.length,O=new Array(q);for(i=0;i<q;++i)(o=e[i])&&(O[i]=l=Bb+c.call(o,o.__data__,i,e),l in f?t[i]=o:f[l]=o);for(i=0;i<_;++i)(o=f[l=Bb+c.call(r,a[i],i,a)])?($[i]=o,o.__data__=a[i],f[l]=null):n[i]=new ia(r,a[i]);for(i=0;i<q;++i)(o=e[i])&&f[O[i]]===o&&(t[i]=o);}var Bd=function(r,e){if(!r)return O=new Array(this.size()),l=-1,this.each(function(r){O[++l]=r;}),O;var n=e?Ad:zd,$=this._parents,t=this._groups;"function"!=typeof r&&(r=yd(r));for(var a=t.length,c=new Array(a),i=new Array(a),o=new Array(a),l=0;l<a;++l){var f=$[l],q=t[l],_=q.length,O=r.call(f,f&&f.__data__,l,$),d=O.length,u=i[l]=new Array(d),v=c[l]=new Array(d);n(f,q,u,v,o[l]=new Array(_),O,e);for(var p,y,h=0,x=0;h<d;++h)if(p=u[h]){for(h>=x&&(x=h+1);!(y=v[x])&&++x<d;);p._next=y||null;}}return (c=new m(c,$))._enter=i,c._exit=o,c};var Cd=function(){return new m(this._exit||this._groups.map(Ab),this._parents)};var Dd=function(e,t,r){var $=this.enter(),n=this,o=this.exit();return $="function"==typeof e?e($):$.append(e+""),null!=t&&(n=t(n)),null==r?o.remove():r(o),$&&n?$.merge(n).order():n};var Ed=function(r){for(var e=this._groups,t=r._groups,$=e.length,n=t.length,a=Math.min($,n),o=new Array($),x=0;x<a;++x)for(var p,i=e[x],l=t[x],u=i.length,f=o[x]=new Array(u),s=0;s<u;++s)(p=i[s]||l[s])&&(f[s]=p);for(;x<$;++x)o[x]=e[x];return new m(o,this._parents)};var Fd=function(){for(var e=this._groups,t=-1,r=e.length;++t<r;)for(var o,$=e[t],n=$.length-1,a=$[n];--n>=0;)(o=$[n])&&(a&&4^o.compareDocumentPosition(a)&&a.parentNode.insertBefore(o,a),a=o);return this};var Gd=function(r){function e(e,t){return e&&t?r(e.__data__,t.__data__):!e-!t}r||(r=Hd);for(var t=this._groups,n=t.length,$=new Array(n),a=0;a<n;++a){for(var w,o=t[a],i=o.length,u=$[a]=new Array(i),_=0;_<i;++_)(w=o[_])&&(u[_]=w);u.sort(e);}return new m($,this._parents).order()};function Hd(r,e){return r<e?-1:r>e?1:r>=e?0:NaN}var Id=function(){var t=arguments[0];return arguments[0]=this,t.apply(null,arguments),this};var Jd=function(){var t=new Array(this.size()),a=-1;return this.each(function(){t[++a]=this;}),t};var Kd=function(){for(var r=this._groups,t=0,e=r.length;t<e;++t)for(var $=r[t],o=0,u=$.length;o<u;++o){var a=$[o];if(a)return a}return null};var Ld=function(){var e=0;return this.each(function(){++e;}),e};var Md=function(){return !this.node()};var Nd=function(t){for(var r=this._groups,e=0,$=r.length;e<$;++e)for(var a,n=r[e],p=0,o=n.length;p<o;++p)(a=n[p])&&t.call(a,a.__data__,p,n);return this};function Od(t){return function(){this.removeAttribute(t);}}function Pd(t){return function(){this.removeAttributeNS(t.space,t.local);}}function Qd(t,r){return function(){this.setAttribute(t,r);}}function Rd(t,r){return function(){this.setAttributeNS(t.space,t.local,r);}}function Sd(t,r){return function(){var e=r.apply(this,arguments);null==e?this.removeAttribute(t):this.setAttribute(t,e);}}function Td(t,r){return function(){var e=r.apply(this,arguments);null==e?this.removeAttributeNS(t.space,t.local):this.setAttributeNS(t.space,t.local,e);}}var Ha="http://www.w3.org/1999/xhtml";var Cb={svg:"http://www.w3.org/2000/svg",xhtml:Ha,xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace",xmlns:"http://www.w3.org/2000/xmlns/"};var Db=function(e){var $=e+="",a=$.indexOf(":");return a>=0&&"xmlns"!==($=e.slice(0,a))&&(e=e.slice(a+1)),Cb.hasOwnProperty($)?{space:Cb[$],local:e}:e};var Ud=function(t,r){var e=Db(t);if(arguments.length<2){var a=this.node();return e.local?a.getAttributeNS(e.space,e.local):a.getAttribute(e)}return this.each((null==r?e.local?Pd:Od:"function"==typeof r?e.local?Td:Sd:e.local?Rd:Qd)(e,r))};function Vd(e){return function(){this.style.removeProperty(e);}}function Wd(e,t,r){return function(){this.style.setProperty(e,t,r);}}function Xd(e,t,r){return function(){var $=t.apply(this,arguments);null==$?this.style.removeProperty(e):this.style.setProperty(e,$,r);}}var Eb=function(e){return e.ownerDocument&&e.ownerDocument.defaultView||e.document&&e||e.defaultView};var Yd=function(e,t,r){return arguments.length>1?this.each((null==t?Vd:"function"==typeof t?Xd:Wd)(e,t,null==r?"":r)):Zd(this.node(),e)};function Zd(e,t){return e.style.getPropertyValue(t)||Eb(e).getComputedStyle(e,null).getPropertyValue(t)}function $d(r){return function(){delete this[r];}}function _d(r,t){return function(){this[r]=t;}}function ae(r,t){return function(){var n=t.apply(this,arguments);null==n?delete this[r]:this[r]=n;}}var be=function(r,t){return arguments.length>1?this.each((null==t?$d:"function"==typeof t?ae:_d)(r,t)):this.node()[r]};function Fb(s){return s.trim().split(/^|\s+/)}function Ia(s){return s.classList||new Gb(s)}function Gb(s){this._node=s,this._names=Fb(s.getAttribute("class")||"");}function Hb(s,t){for(var a=Ia(s),$=-1,e=t.length;++$<e;)a.add(t[$]);}function Ib(s,t){for(var a=Ia(s),$=-1,e=t.length;++$<e;)a.remove(t[$]);}function ce(s){return function(){Hb(this,s);}}function de(s){return function(){Ib(this,s);}}function ee(s,t){return function(){(t.apply(this,arguments)?Hb:Ib)(this,s);}}Gb.prototype={add:function(s){this._names.indexOf(s)<0&&(this._names.push(s),this._node.setAttribute("class",this._names.join(" ")));},remove:function(s){var t=this._names.indexOf(s);t>=0&&(this._names.splice(t,1),this._node.setAttribute("class",this._names.join(" ")));},contains:function(s){return this._names.indexOf(s)>=0}};var fe=function(s,t){var a=Fb(s+"");if(arguments.length<2){for(var $=Ia(this.node()),e=-1,n=a.length;++e<n;)if(!$.contains(a[e]))return !1;return !0}return this.each(("function"==typeof t?ee:t?ce:de)(a,t))};function ge(){this.textContent="";}function he(t){return function(){this.textContent=t;}}function ie(t){return function(){var n=t.apply(this,arguments);this.textContent=null==n?"":n;}}var je=function(t){return arguments.length?this.each(null==t?ge:("function"==typeof t?ie:he)(t)):this.node().textContent};function ke(){this.innerHTML="";}function le(n){return function(){this.innerHTML=n;}}function me(n){return function(){var t=n.apply(this,arguments);this.innerHTML=null==t?"":t;}}var ne=function(n){return arguments.length?this.each(null==n?ke:("function"==typeof n?me:le)(n)):this.node().innerHTML};function oe(){this.nextSibling&&this.parentNode.appendChild(this);}var pe=function(){return this.each(oe)};function qe(){this.previousSibling&&this.parentNode.insertBefore(this,this.parentNode.firstChild);}var re=function(){return this.each(qe)};function se(e){return function(){var r=this.ownerDocument,t=this.namespaceURI;return t===Ha&&r.documentElement.namespaceURI===Ha?r.createElement(e):r.createElementNS(t,e)}}function te(e){return function(){return this.ownerDocument.createElementNS(e.space,e.local)}}var Jb=function(e){var r=Db(e);return (r.local?te:se)(r)};var ue=function(t){var r="function"==typeof t?t:Jb(t);return this.select(function(){return this.appendChild(r.apply(this,arguments))})};function ve(){return null}var we=function(t,r){var e="function"==typeof t?t:Jb(t),$=null==r?ve:"function"==typeof r?r:zb(r);return this.select(function(){return this.insertBefore(e.apply(this,arguments),$.apply(this,arguments)||null)})};function xe(){var e=this.parentNode;e&&e.removeChild(this);}var ye=function(){return this.each(xe)};function ze(){return this.parentNode.insertBefore(this.cloneNode(!1),this.nextSibling)}function Ae(){return this.parentNode.insertBefore(this.cloneNode(!0),this.nextSibling)}var Be=function(e){return this.select(e?Ae:ze)};var Ce=function(t){return arguments.length?this.property("__data__",t):this.node().__data__};var De={},Kb=null;if("undefined"!=typeof document){var Ee=document.documentElement;"onmouseenter"in Ee||(De={mouseenter:"mouseover",mouseleave:"mouseout"});}function Fe(e,t,n){return e=Lb(e,t,n),function(t){var n=t.relatedTarget;n&&(n===this||8&n.compareDocumentPosition(this))||e.call(this,t);}}function Lb(e,t,n){return function(r){var $=Kb;Kb=r;try{e.call(this,this.__data__,t,n);}finally{Kb=$;}}}function Ge(e){return e.trim().split(/^|\s+/).map(function(e){var t="",n=e.indexOf(".");return n>=0&&(t=e.slice(n+1),e=e.slice(0,n)),{type:e,name:t}})}function He(e){return function(){var t=this.__on;if(t){for(var n,r=0,$=-1,i=t.length;r<i;++r)n=t[r],e.type&&n.type!==e.type||n.name!==e.name?t[++$]=n:this.removeEventListener(n.type,n.listener,n.capture);++$?t.length=$:delete this.__on;}}}function Ie(e,t,n){var r=De.hasOwnProperty(e.type)?Fe:Lb;return function($,i,p){var o,a=this.__on,v=r(t,i,p);if(a)for(var s=0,u=a.length;s<u;++s)if((o=a[s]).type===e.type&&o.name===e.name)return this.removeEventListener(o.type,o.listener,o.capture),this.addEventListener(o.type,o.listener=v,o.capture=n),void(o.value=t);this.addEventListener(e.type,v,n),o={type:e.type,name:e.name,value:t,listener:v,capture:n},a?a.push(o):this.__on=[o];}}var Je=function(e,t,n){var r,$,i=Ge(e+""),p=i.length;if(!(arguments.length<2)){for(o=t?Ie:He,null==n&&(n=!1),r=0;r<p;++r)this.each(o(i[r],t,n));return this}var o=this.node().__on;if(o)for(var a,v=0,s=o.length;v<s;++v)for(r=0,a=o[v];r<p;++r)if(($=i[r]).type===a.type&&$.name===a.name)return a.value};function Mb(t,n,e){var $=Eb(t),a=$.CustomEvent;"function"==typeof a?a=new a(n,e):(a=$.document.createEvent("Event"),e?(a.initEvent(n,e.bubbles,e.cancelable),a.detail=e.detail):a.initEvent(n,!1,!1)),t.dispatchEvent(a);}function Ke(t,n){return function(){return Mb(this,t,n)}}function Le(t,n){return function(){return Mb(this,t,n.apply(this,arguments))}}var Me=function(t,n){return this.each(("function"==typeof n?Le:Ke)(t,n))};var Ne=[null];function m(e,$){this._groups=e,this._parents=$;}m.prototype={constructor:m,select:rd,selectAll:ud,filter:wd,data:Bd,enter:xd,exit:Cd,join:Dd,merge:Ed,order:Fd,sort:Gd,call:Id,nodes:Jd,node:Kd,size:Ld,empty:Md,each:Nd,attr:Ud,style:Yd,property:be,classed:fe,text:je,html:ne,raise:pe,lower:re,append:ue,insert:we,remove:ye,clone:Be,datum:Ce,on:Je,dispatch:Me};var f=function(e){return "string"==typeof e?new m([[document.querySelector(e)]],[document.documentElement]):new m([[e]],Ne)};var Oe=function(){for(var e,r=Kb;e=r.sourceEvent;)r=e;return r};var Pe=function(e,t){var n=e.ownerSVGElement||e;if(n.createSVGPoint){var r=n.createSVGPoint();return r.x=t.clientX,r.y=t.clientY,[(r=r.matrixTransform(e.getScreenCTM().inverse())).x,r.y]}var i=e.getBoundingClientRect();return [t.clientX-i.left-e.clientLeft,t.clientY-i.top-e.clientTop]};var w=function(e){var $=Oe();return $.changedTouches&&($=$.changedTouches[0]),Pe(e,$)};function ja(){var n,r,t=Sb().unknown(void 0),e=t.domain,i=t.range,u=0,a=1,o=!1,$=0,l=0,g=.5;function d(){var t=e().length,d=a<u,p=d?a:u,c=d?u:a;n=(c-p)/Math.max(1,t-$+2*l),o&&(n=Math.floor(n)),p+=(c-p-n*(t-$))*g,r=n*(1-$),o&&(p=Math.round(p),r=Math.round(r));var f=Te(t).map(function(r){return p+n*r});return i(d?f.reverse():f)}return delete t.unknown,t.domain=function(n){return arguments.length?(e(n),d()):e()},t.range=function(n){return arguments.length?([u,a]=n,u=+u,a=+a,d()):[u,a]},t.rangeRound=function(n){return [u,a]=n,u=+u,a=+a,o=!0,d()},t.bandwidth=function(){return r},t.step=function(){return n},t.round=function(n){return arguments.length?(o=!!n,d()):o},t.padding=function(n){return arguments.length?($=Math.min(1,l=+n),d()):$},t.paddingInner=function(n){return arguments.length?($=Math.min(1,n),d()):$},t.paddingOuter=function(n){return arguments.length?(l=+n,d()):l},t.align=function(n){return arguments.length?(g=Math.max(0,Math.min(1,n)),d()):g},t.copy=function(){return ja(e(),[u,a]).round(o).paddingInner($).paddingOuter(l).align(g)},la.apply(d(),arguments)}function Nb(n){var r=n.copy;return n.padding=n.paddingOuter,delete n.paddingInner,delete n.paddingOuter,n.copy=function(){return Nb(r())},n}function Qe(){return Nb(ja.apply(null,arguments).paddingInner(1))}var Ob=function($,t){return $<t?-1:$>t?1:$>=t?0:NaN};var Pb=function(r){return 1===r.length&&(r=Re(r)),{left:function(n,t,e,$){for(null==e&&(e=0),null==$&&($=n.length);e<$;){var a=e+$>>>1;r(n[a],t)<0?e=a+1:$=a;}return e},right:function(n,t,e,$){for(null==e&&(e=0),null==$&&($=n.length);e<$;){var a=e+$>>>1;r(n[a],t)>0?$=a:e=a+1;}return e}}};function Re(r){return function(n,t){return Ob(r(n),t)}}var Qb=Pb(Ob),Se=Qb.right;var Te=function(t,e,r){t=+t,e=+e,r=(a=arguments.length)<2?(e=t,t=0,1):a<3?1:+r;for(var $=-1,a=0|Math.max(0,Math.ceil((e-t)/r)),c=new Array(a);++$<a;)c[$]=t+$*r;return c};var Ja=Math.sqrt(50),Ka=Math.sqrt(10),La=Math.sqrt(2),Ue=function($,t,r){var e,a,o,g,z=-1;if(r=+r,($=+$)===(t=+t)&&r>0)return [$];if((e=t<$)&&(a=$,$=t,t=a),0===(g=ka($,t,r))||!isFinite(g))return [];if(g>0)for($=Math.ceil($/g),t=Math.floor(t/g),o=new Array(a=Math.ceil(t-$+1));++z<a;)o[z]=($+z)*g;else for($=Math.floor($*g),t=Math.ceil(t*g),o=new Array(a=Math.ceil($-t+1));++z<a;)o[z]=($-z)/g;return e&&o.reverse(),o};function ka($,t,r){var e=(t-$)/Math.max(0,r),a=Math.floor(Math.log(e)/Math.LN10),o=e/Math.pow(10,a);return a>=0?(o>=Ja?10:o>=Ka?5:o>=La?2:1)*Math.pow(10,a):-Math.pow(10,-a)/(o>=Ja?10:o>=Ka?5:o>=La?2:1)}function Ma($,t,r){var e=Math.abs(t-$)/Math.max(0,r),a=Math.pow(10,Math.floor(Math.log(e)/Math.LN10)),o=e/a;return o>=Ja?a*=10:o>=Ka?a*=5:o>=La&&(a*=2),t<$?-a:a}function la(t,e){switch(arguments.length){case 0:break;case 1:this.range(t);break;default:this.range(e).domain(t);}return this}const Rb=Symbol("implicit");function Sb(){var t=new Map,n=[],e=[],r=Rb;function i(i){var $=i+"",o=t.get($);if(!o){if(r!==Rb)return r;t.set($,o=n.push(i));}return e[(o-1)%e.length]}return i.domain=function(e){if(!arguments.length)return n.slice();n=[],t=new Map;for(const r of e){const e=r+"";t.has(e)||t.set(e,n.push(r));}return i},i.range=function(t){return arguments.length?(e=Array.from(t),i):e.slice()},i.unknown=function(t){return arguments.length?(r=t,i):r},i.copy=function(){return Sb(n,e).unknown(r)},la.apply(i,arguments),i}function Ve(t){var r=t.domain;return t.ticks=function(t){var $=r();return Ue($[0],$[$.length-1],null==t?10:t)},t.tickFormat=function(t,$){var e=r();return Of(e[0],e[e.length-1],null==t?10:t,$)},t.nice=function($){null==$&&($=10);var e,i=r(),n=0,o=i.length-1,a=i[n],k=i[o];return k<a&&(e=a,a=k,k=e,e=n,n=o,o=e),(e=ka(a,k,$))>0?(a=Math.floor(a/e)*e,k=Math.ceil(k/e)*e,e=ka(a,k,$)):e<0&&(a=Math.ceil(a*e)/e,k=Math.floor(k*e)/e,e=ka(a,k,$)),e>0?(i[n]=Math.floor(a/e)*e,i[o]=Math.ceil(k/e)*e,r(i)):e<0&&(i[n]=Math.ceil(a*e)/e,i[o]=Math.floor(k*e)/e,r(i)),t},t}function A(){var t=Bc(z,z);return t.copy=function(){return Ac(t,A())},la.apply(t,arguments),Ve(t)}function x(){}var G=function(t,e,r){t.prototype=e.prototype=r,r.constructor=t;};function P(t,e){var r=Object.create(t.prototype);for(var o in e)r[o]=e[o];return r}var t=.7;var H=1/t;var I="\\s*([+-]?\\d+)\\s*",R="\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",e="\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",We=/^#([0-9a-f]{3})$/,Xe=/^#([0-9a-f]{6})$/,Ye=new RegExp("^rgb\\("+[I,I,I]+"\\)$"),Ze=new RegExp("^rgb\\("+[e,e,e]+"\\)$"),$e=new RegExp("^rgba\\("+[I,I,I,R]+"\\)$"),_e=new RegExp("^rgba\\("+[e,e,e,R]+"\\)$"),af=new RegExp("^hsl\\("+[R,e,e]+"\\)$"),bf=new RegExp("^hsla\\("+[R,e,e,R]+"\\)$"),Tb={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};function Ub(){return this.rgb().formatHex()}function cf(){return _b(this).formatHsl()}function Vb(){return this.rgb().formatRgb()}function S(r){var a;return r=(r+"").trim().toLowerCase(),(a=We.exec(r))?new g((a=parseInt(a[1],16))>>8&15|a>>4&240,a>>4&15|240&a,(15&a)<<4|15&a,1):(a=Xe.exec(r))?Wb(parseInt(a[1],16)):(a=Ye.exec(r))?new g(a[1],a[2],a[3],1):(a=Ze.exec(r))?new g(255*a[1]/100,255*a[2]/100,255*a[3]/100,1):(a=$e.exec(r))?Xb(a[1],a[2],a[3],a[4]):(a=_e.exec(r))?Xb(255*a[1]/100,255*a[2]/100,255*a[3]/100,a[4]):(a=af.exec(r))?$b(a[1],a[2]/100,a[3]/100,1):(a=bf.exec(r))?$b(a[1],a[2]/100,a[3]/100,a[4]):Tb.hasOwnProperty(r)?Wb(Tb[r]):"transparent"===r?new g(NaN,NaN,NaN,0):null}function Wb(r){return new g(r>>16&255,r>>8&255,255&r,1)}function Xb(r,a,e,$){return $<=0&&(r=a=e=NaN),new g(r,a,e,$)}function Na(r){return r instanceof x||(r=S(r)),r?new g((r=r.rgb()).r,r.g,r.b,r.opacity):new g}function ma(r,a,e,$){return 1===arguments.length?Na(r):new g(r,a,e,null==$?1:$)}function g(r,a,e,$){this.r=+r,this.g=+a,this.b=+e,this.opacity=+$;}function Yb(){return "#"+Oa(this.r)+Oa(this.g)+Oa(this.b)}function Zb(){var r=this.opacity;return (1===(r=isNaN(r)?1:Math.max(0,Math.min(1,r)))?"rgb(":"rgba(")+Math.max(0,Math.min(255,Math.round(this.r)||0))+", "+Math.max(0,Math.min(255,Math.round(this.g)||0))+", "+Math.max(0,Math.min(255,Math.round(this.b)||0))+(1===r?")":", "+r+")")}function Oa(r){return ((r=Math.max(0,Math.min(255,Math.round(r)||0)))<16?"0":"")+r.toString(16)}function $b(r,a,e,$){return $<=0?r=a=e=NaN:e<=0||e>=1?r=a=NaN:a<=0&&(r=NaN),new s(r,a,e,$)}function _b(r){if(r instanceof s)return new s(r.h,r.s,r.l,r.opacity);if(r instanceof x||(r=S(r)),!r)return new s;if(r instanceof s)return r;var a=(r=r.rgb()).r/255,e=r.g/255,$=r.b/255,t=Math.min(a,e,$),o=Math.max(a,e,$),n=NaN,i=o-t,f=(o+t)/2;return i?(n=a===o?(e-$)/i+6*(e<$):e===o?($-a)/i+2:(a-e)/i+4,i/=f<.5?o+t:2-o-t,n*=60):i=f>0&&f<1?0:n,new s(n,i,f,r.opacity)}function Pa(r,a,e,$){return 1===arguments.length?_b(r):new s(r,a,e,null==$?1:$)}function s(r,a,e,$){this.h=+r,this.s=+a,this.l=+e,this.opacity=+$;}function Qa(r,a,e){return 255*(r<60?a+(e-a)*r/60:r<180?e:r<240?a+(e-a)*(240-r)/60:a)}G(x,S,{copy:function(r){return Object.assign(new this.constructor,this,r)},displayable:function(){return this.rgb().displayable()},hex:Ub,formatHex:Ub,formatHsl:cf,formatRgb:Vb,toString:Vb}),G(g,ma,P(x,{brighter:function(r){return r=null==r?H:Math.pow(H,r),new g(this.r*r,this.g*r,this.b*r,this.opacity)},darker:function(r){return r=null==r?t:Math.pow(t,r),new g(this.r*r,this.g*r,this.b*r,this.opacity)},rgb:function(){return this},displayable:function(){return -.5<=this.r&&this.r<255.5&&-.5<=this.g&&this.g<255.5&&-.5<=this.b&&this.b<255.5&&0<=this.opacity&&this.opacity<=1},hex:Yb,formatHex:Yb,formatRgb:Zb,toString:Zb})),G(s,Pa,P(x,{brighter:function(r){return r=null==r?H:Math.pow(H,r),new s(this.h,this.s,this.l*r,this.opacity)},darker:function(r){return r=null==r?t:Math.pow(t,r),new s(this.h,this.s,this.l*r,this.opacity)},rgb:function(){var r=this.h%360+360*(this.h<0),a=isNaN(r)||isNaN(this.s)?0:this.s,e=this.l,$=e+(e<.5?e:1-e)*a,t=2*e-$;return new g(Qa(r>=240?r-240:r+120,t,$),Qa(r,t,$),Qa(r<120?r+240:r-120,t,$),this.opacity)},displayable:function(){return (0<=this.s&&this.s<=1||isNaN(this.s))&&0<=this.l&&this.l<=1&&0<=this.opacity&&this.opacity<=1},formatHsl:function(){var r=this.opacity;return (1===(r=isNaN(r)?1:Math.max(0,Math.min(1,r)))?"hsl(":"hsla(")+(this.h||0)+", "+100*(this.s||0)+"%, "+100*(this.l||0)+"%"+(1===r?")":", "+r+")")}}));var ac=Math.PI/180;var bc=180/Math.PI;var na=18,cc=.96422,dc=1,ec=.82521,fc=4/29,J=6/29,gc=3*J*J,df=J*J*J;function hc($){if($ instanceof i)return new i($.l,$.a,$.b,$.opacity);if($ instanceof n)return ic($);$ instanceof g||($=Na($));var r,t,v=Ua($.r),a=Ua($.g),f=Ua($.b),e=Ra((.2225045*v+.7168786*a+.0606169*f)/dc);return v===a&&a===f?r=t=e:(r=Ra((.4360747*v+.3850649*a+.1430804*f)/cc),t=Ra((.0139322*v+.0971045*a+.7141733*f)/ec)),new i(116*e-16,500*(r-e),200*(e-t),$.opacity)}function ef($,r,t,v){return 1===arguments.length?hc($):new i($,r,t,null==v?1:v)}function i($,r,t,v){this.l=+$,this.a=+r,this.b=+t,this.opacity=+v;}function Ra($){return $>df?Math.pow($,1/3):$/gc+fc}function Sa($){return $>J?$*$*$:gc*($-fc)}function Ta($){return 255*($<=.0031308?12.92*$:1.055*Math.pow($,1/2.4)-.055)}function Ua($){return ($/=255)<=.04045?$/12.92:Math.pow(($+.055)/1.055,2.4)}function ff($){if($ instanceof n)return new n($.h,$.c,$.l,$.opacity);if($ instanceof i||($=hc($)),0===$.a&&0===$.b)return new n(NaN,0<$.l&&$.l<100?0:NaN,$.l,$.opacity);var r=Math.atan2($.b,$.a)*bc;return new n(r<0?r+360:r,Math.sqrt($.a*$.a+$.b*$.b),$.l,$.opacity)}function Va($,r,t,v){return 1===arguments.length?ff($):new n($,r,t,null==v?1:v)}function n($,r,t,v){this.h=+$,this.c=+r,this.l=+t,this.opacity=+v;}function ic($){if(isNaN($.h))return new i($.l,0,0,$.opacity);var r=$.h*ac;return new i($.l,Math.cos(r)*$.c,Math.sin(r)*$.c,$.opacity)}G(i,ef,P(x,{brighter:function($){return new i(this.l+na*(null==$?1:$),this.a,this.b,this.opacity)},darker:function($){return new i(this.l-na*(null==$?1:$),this.a,this.b,this.opacity)},rgb:function(){var $=(this.l+16)/116,r=isNaN(this.a)?$:$+this.a/500,t=isNaN(this.b)?$:$-this.b/200;return r=cc*Sa(r),$=dc*Sa($),t=ec*Sa(t),new g(Ta(3.1338561*r-1.6168667*$-.4906146*t),Ta(-.9787684*r+1.9161415*$+.033454*t),Ta(.0719453*r-.2289914*$+1.4052427*t),this.opacity)}})),G(n,Va,P(x,{brighter:function($){return new n(this.h,this.c,this.l+na*(null==$?1:$),this.opacity)},darker:function($){return new n(this.h,this.c,this.l-na*(null==$?1:$),this.opacity)},rgb:function(){return ic(this).rgb()}}));var jc=-.14861,Wa=1.78277,Xa=-.29227,oa=-.90649,T=1.97294,kc=T*oa,lc=T*Wa,mc=Wa*Xa-oa*jc;function gf($){if($ instanceof B)return new B($.h,$.s,$.l,$.opacity);$ instanceof g||($=Na($));var r=$.r/255,t=$.g/255,e=$.b/255,C=(mc*e+kc*r-lc*t)/(mc+kc-lc),a=e-C,M=(T*(t-C)-Xa*a)/oa,i=Math.sqrt(M*M+a*a)/(T*C*(1-C)),X=i?Math.atan2(M,a)*bc-120:NaN;return new B(X<0?X+360:X,i,C,$.opacity)}function Ya($,r,t,e){return 1===arguments.length?gf($):new B($,r,t,null==e?1:e)}function B($,r,t,e){this.h=+$,this.s=+r,this.l=+t,this.opacity=+e;}G(B,Ya,P(x,{brighter:function($){return $=null==$?H:Math.pow(H,$),new B(this.h,this.s,this.l*$,this.opacity)},darker:function($){return $=null==$?t:Math.pow(t,$),new B(this.h,this.s,this.l*$,this.opacity)},rgb:function(){var $=isNaN(this.h)?0:(this.h+120)*ac,r=+this.l,t=isNaN(this.s)?0:this.s*r*(1-r),e=Math.cos($),C=Math.sin($);return new g(255*(r+t*(jc*e+Wa*C)),255*(r+t*(Xa*e+oa*C)),255*(r+t*(T*e)),this.opacity)}}));function oc($,t){return function(r){return $+r*t}}function kf($,t,r){return $=Math.pow($,r),t=Math.pow(t,r)-$,r=1/r,function(n){return Math.pow($+n*t,r)}}function lf($){return 1==($=+$)?j:function(t,r){return r-t?kf(t,r,$):pa(isNaN(t)?r:t)}}function j($,t){var r=t-$;return r?oc($,r):pa(isNaN($)?t:$)}var pa=function(t){return function(){return t}};var pc=function r($){var o=lf($);function e(r,$){var e=o((r=ma(r)).r,($=ma($)).r),a=o(r.g,$.g),t=o(r.b,$.b),i=j(r.opacity,$.opacity);return function($){return r.r=e($),r.g=a($),r.b=t($),r.opacity=i($),r+""}}return e.gamma=r,e}(1);var mf=function(r,e){var t,$=e?e.length:0,a=r?Math.min($,r.length):0,n=new Array(a),o=new Array($);for(t=0;t<a;++t)n[t]=ab(r[t],e[t]);for(;t<$;++t)o[t]=e[t];return function(r){for(t=0;t<a;++t)o[t]=n[t](r);return o}};var nf=function(e,t){var r=new Date;return t-=e=+e,function($){return r.setTime(e+t*$),r}};var v=function(t,$){return $-=t=+t,function(e){return t+$*e}};var of=function(e,r){var t,$={},i={};for(t in null!==e&&"object"==typeof e||(e={}),null!==r&&"object"==typeof r||(r={}),r)t in e?$[t]=ab(e[t],r[t]):i[t]=r[t];return function(e){for(t in $)i[t]=$[t](e);return i}};var $a=/[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,_a=new RegExp($a.source,"g");function pf(r){return function(){return r}}function qf(r){return function($){return r($)+""}}var rf=function(r,$){var n,e,t,a=$a.lastIndex=_a.lastIndex=0,u=-1,E=[],o=[];for(r+="",$+="";(n=$a.exec(r))&&(e=_a.exec($));)(t=e.index)>a&&(t=$.slice(a,t),E[u]?E[u]+=t:E[++u]=t),(n=n[0])===(e=e[0])?E[u]?E[u]+=e:E[++u]=e:(E[++u]=null,o.push({i:u,x:v(n,e)})),a=_a.lastIndex;return a<$.length&&(t=$.slice(a),E[u]?E[u]+=t:E[++u]=t),E.length<2?o[0]?qf(o[0].x):pf($):($=o.length,function(r){for(var n,e=0;e<$;++e)E[(n=o[e]).i]=n.x(r);return E.join("")})};var ab=function(r,$){var e,c=typeof $;return null==$||"boolean"===c?pa($):("number"===c?v:"string"===c?(e=S($))?($=e,pc):rf:$ instanceof S?pc:$ instanceof Date?nf:Array.isArray($)?mf:"function"!=typeof $.valueOf&&"function"!=typeof $.toString||isNaN($)?of:v)(r,$)};var sf=function(t,n){return n-=t=+t,function(r){return Math.round(t+n*r)}};var wf=function(t){return function(){return t}};var xf=function($){return +$};var yc=[0,1];function z(r){return r}function db(r,n){return (n-=r=+r)?function(t){return (t-r)/n}:wf(isNaN(n)?NaN:.5)}function zc(r){var n,t=r[0],e=r[r.length-1];return t>e&&(n=t,t=e,e=n),function(r){return Math.max(t,Math.min(e,r))}}function yf(r,n,t){var e=r[0],$=r[1],a=n[0],o=n[1];return $<e?(e=db($,e),a=t(o,a)):(e=db(e,$),a=t(a,o)),function(r){return a(e(r))}}function zf(r,n,t){var e=Math.min(r.length,n.length)-1,$=new Array(e),a=new Array(e),o=-1;for(r[e]<r[0]&&(r=r.slice().reverse(),n=n.slice().reverse());++o<e;)$[o]=db(r[o],r[o+1]),a[o]=t(n[o],n[o+1]);return function(n){var t=Se(r,n,1,e)-1;return a[t]($[t](n))}}function Ac(r,n){return n.domain(r.domain()).range(r.range()).interpolate(r.interpolate()).clamp(r.clamp()).unknown(r.unknown())}function Af(){var r,n,t,e,$,a,o=yc,i=yc,u=ab,p=z;function l(){return e=Math.min(o.length,i.length)>2?zf:yf,$=a=null,c}function c(n){return isNaN(n=+n)?t:($||($=e(o.map(r),i,u)))(r(p(n)))}return c.invert=function(t){return p(n((a||(a=e(i,o.map(r),v)))(t)))},c.domain=function(r){return arguments.length?(o=Array.from(r,xf),p===z||(p=zc(o)),l()):o.slice()},c.range=function(r){return arguments.length?(i=Array.from(r),l()):i.slice()},c.rangeRound=function(r){return i=Array.from(r),u=sf,l()},c.clamp=function(r){return arguments.length?(p=r?zc(o):z,c):p!==z},c.interpolate=function(r){return arguments.length?(u=r,l()):u},c.unknown=function(r){return arguments.length?(t=r,c):t},function(t,e){return r=t,n=e,l()}}function Bc(r,n){return Af()(r,n)}var eb,Bf,Cf;function Df($){return eb=Kf($),Bf=eb.format,Cf=eb.formatPrefix,eb}var ra=function(e,t){if((l=(e=t?e.toExponential(t-1):e.toExponential()).indexOf("e"))<0)return null;var l,n=e.slice(0,l);return [n.length>1?n[0]+n.slice(2):n,+e.slice(l+1)]};var K=function(t){return (t=ra(Math.abs(t)))?t[1]:NaN};var Ef=function(r,t){return function(e,n){for(var $=e.length,u=[],o=0,a=r[0],f=0;$>0&&a>0&&(f+a+1>n&&(a=Math.max(1,n-f)),u.push(e.substring($-=a,$+a)),!((f+=a+1)>n));)a=r[o=(o+1)%r.length];return u.reverse().join(t)}};var Ff=function(t){return function(e){return e.replace(/[0-9]/g,function(e){return t[+e]})}};var Gf=/^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;function sa(i){return new fb(i)}function fb(i){if(!(t=Gf.exec(i)))throw new Error("invalid format: "+i);var t;this.fill=t[1]||" ",this.align=t[2]||">",this.sign=t[3]||"-",this.symbol=t[4]||"",this.zero=!!t[5],this.width=t[6]&&+t[6],this.comma=!!t[7],this.precision=t[8]&&+t[8].slice(1),this.trim=!!t[9],this.type=t[10]||"";}sa.prototype=fb.prototype,fb.prototype.toString=function(){return this.fill+this.align+this.sign+this.symbol+(this.zero?"0":"")+(null==this.width?"":Math.max(1,0|this.width))+(this.comma?",":"")+(null==this.precision?"":"."+Math.max(0,0|this.precision))+(this.trim?"~":"")+this.type};var Hf=function(e){e:for(var r,t=e.length,a=1,$=-1;a<t;++a)switch(e[a]){case".":$=r=a;break;case"0":0===$&&($=a),r=a;break;default:if($>0){if(!+e[a])break e;$=0;}}return $>0?e.slice(0,$)+e.slice(r+1):e};var If;var Jf=function(e,p){var r,a=ra(e,p);if(!a)return e+"";var $=a[0],t=a[1],f=t-(r=If=3*Math.max(-8,Math.min(8,Math.floor(t/3))),r)+1,o=$.length;return f===o?$:f>o?$+new Array(f-o+1).join("0"):f>0?$.slice(0,f)+"."+$.slice(f):"0."+new Array(1-f).join("0")+ra(e,Math.max(0,p+f-1))[0]};var Cc=function(r,e){var t=ra(r,e);if(!t)return r+"";var $=t[0],a=t[1];return a<0?"0."+new Array(-a).join("0")+$:$.length>a+1?$.slice(0,a+1)+"."+$.slice(a+1):$+new Array(a-$.length+2).join("0")};var Dc={"%":function(t,r){return (100*t).toFixed(r)},b:function(t){return Math.round(t).toString(2)},c:function(t){return t+""},d:function(t){return Math.round(t).toString(10)},e:function(t,r){return t.toExponential(r)},f:function(t,r){return t.toFixed(r)},g:function(t,r){return t.toPrecision(r)},o:function(t){return Math.round(t).toString(8)},p:function(t,r){return Cc(100*t,r)},r:Cc,s:Jf,X:function(t){return Math.round(t).toString(16).toUpperCase()},x:function(t){return Math.round(t).toString(16)}};var Ec=function(t){return t};var Fc=["y","z","a","f","p","n","\xB5","m","","k","M","G","T","P","E","Z","Y"],Kf=function(r){var e=r.grouping&&r.thousands?Ef(r.grouping,r.thousands):Ec,t=r.currency,a=r.decimal,m=r.numerals?Ff(r.numerals):Ec,$=r.percent||"%";function i(r){var i=(r=sa(r)).fill,o=r.align,n=r.sign,p=r.symbol,f=r.zero,l=r.width,s=r.comma,u=r.precision,M=r.trim,c=r.type;"n"===c?(s=!0,c="g"):Dc[c]||(null==u&&(u=12),M=!0,c="g"),(f||"0"===i&&"="===o)&&(f=!0,i="0",o="=");var I="$"===p?t[0]:"#"===p&&/[boxX]/.test(c)?"0"+c.toLowerCase():"",V="$"===p?t[1]:/[%p]/.test(c)?$:"",h=Dc[c],g=/[defgprs%]/.test(c);function x(r){var t,$,p,x=I,d=V;if("c"===c)d=h(r)+d,r="";else {var v=(r=+r)<0;if(r=h(Math.abs(r),u),M&&(r=Hf(r)),v&&0==+r&&(v=!1),x=(v?"("===n?n:"-":"-"===n||"("===n?"":n)+x,d=("s"===c?Fc[8+If/3]:"")+d+(v&&"("===n?")":""),g)for(t=-1,$=r.length;++t<$;)if(48>(p=r.charCodeAt(t))||p>57){d=(46===p?a+r.slice(t+1):r.slice(t))+d,r=r.slice(0,t);break}}s&&!f&&(r=e(r,1/0));var y=x.length+r.length+d.length,q=y<l?new Array(l-y+1).join(i):"";switch(s&&f&&(r=e(q+r,q.length?l-d.length:1/0),q=""),o){case"<":r=x+r+d+q;break;case"=":r=x+q+r+d;break;case"^":r=q.slice(0,y=q.length>>1)+x+r+d+q.slice(y);break;default:r=q+x+r+d;}return m(r)}return u=null==u?6:/[gprs]/.test(c)?Math.max(1,Math.min(21,u)):Math.max(0,Math.min(20,u)),x.toString=function(){return r+""},x}return {format:i,formatPrefix:function(r,e){var t=i(((r=sa(r)).type="f",r)),a=3*Math.max(-8,Math.min(8,Math.floor(K(e)/3))),m=Math.pow(10,-a),$=Fc[8+a/3];return function(r){return t(m*r)+$}}}};Df({decimal:".",thousands:",",grouping:[3],currency:["$",""]});var Lf=function(e){return Math.max(0,-K(Math.abs(e)))};var Mf=function(t,$){return Math.max(0,3*Math.max(-8,Math.min(8,Math.floor(K($)/3)))-K(Math.abs(t)))};var Nf=function($,e){return $=Math.abs($),e=Math.abs(e)-$,Math.max(0,K(e)-K($))+1};var Of=function(a,r,e,i){var $,t=Ma(a,r,e);switch((i=sa(null==i?",f":i)).type){case"s":var p=Math.max(Math.abs(a),Math.abs(r));return null!=i.precision||isNaN($=Mf(t,p))||(i.precision=$),Cf(i,p);case"":case"e":case"g":case"p":case"r":null!=i.precision||isNaN($=Nf(t,Math.max(Math.abs(a),Math.abs(r))))||(i.precision=$-("e"===i.type));break;case"f":case"%":null!=i.precision||isNaN($=Lf(t))||(i.precision=$-2*("%"===i.type));}return Bf(i)};var gb=Array.prototype.slice;var Pf=function(x){return x};var hb=1,ib=2,jb=3,Y=4,Gc=1e-6;function Qf(t){return "translate("+(t+.5)+",0)"}function Rf(t){return "translate(0,"+(t+.5)+")"}function Sf(t){return function(r){return +t(r)}}function Tf(t){var r=Math.max(0,t.bandwidth()-1)/2;return t.round()&&(r=Math.round(r)),function($){return +t($)+r}}function Uf(){return !this.__axis}function Hc(t,r){var $=[],n=null,e=null,a=6,i=6,c=3,o=t===hb||t===Y?-1:1,l=t===Y||t===ib?"x":"y",s=t===hb||t===jb?Qf:Rf;function u(u){var M=null==n?r.ticks?r.ticks.apply(r,$):r.domain():n,F=null==e?r.tickFormat?r.tickFormat.apply(r,$):Pf:e,f=Math.max(a,0)+c,p=r.range(),v=+p[0]+.5,x=+p[p.length-1]+.5,m=(r.bandwidth?Tf:Sf)(r.copy()),h=u.selection?u.selection():u,g=h.selectAll(".domain").data([null]),d=h.selectAll(".tick").data(M,r).order(),k=d.exit(),y=d.enter().append("g").attr("class","tick"),b=d.select("line"),_=d.select("text");g=g.merge(g.enter().insert("path",".tick").attr("class","domain").attr("stroke","currentColor")),d=d.merge(y),b=b.merge(y.append("line").attr("stroke","currentColor").attr(l+"2",o*a)),_=_.merge(y.append("text").attr("fill","currentColor").attr(l,o*f).attr("dy",t===hb?"0em":t===jb?"0.71em":"0.32em")),u!==h&&(g=g.transition(u),d=d.transition(u),b=b.transition(u),_=_.transition(u),k=k.transition(u).attr("opacity",Gc).attr("transform",function(t){return isFinite(t=m(t))?s(t):this.getAttribute("transform")}),y.attr("opacity",Gc).attr("transform",function(t){var r=this.parentNode.__axis;return s(r&&isFinite(r=r(t))?r:m(t))})),k.remove(),g.attr("d",t===Y||t==ib?i?"M"+o*i+","+v+"H0.5V"+x+"H"+o*i:"M0.5,"+v+"V"+x:i?"M"+v+","+o*i+"V0.5H"+x+"V"+o*i:"M"+v+",0.5H"+x),d.attr("opacity",1).attr("transform",function(t){return s(m(t))}),b.attr(l+"2",o*a),_.attr(l,o*f).text(F),h.filter(Uf).attr("fill","none").attr("font-size",10).attr("font-family","sans-serif").attr("text-anchor",t===ib?"start":t===Y?"end":"middle"),h.each(function(){this.__axis=m;});}return u.scale=function(t){return arguments.length?(r=t,u):r},u.ticks=function(){return $=gb.call(arguments),u},u.tickArguments=function(t){return arguments.length?($=null==t?[]:gb.call(t),u):$.slice()},u.tickValues=function(t){return arguments.length?(n=null==t?null:gb.call(t),u):n&&n.slice()},u.tickFormat=function(t){return arguments.length?(e=t,u):e},u.tickSize=function(t){return arguments.length?(a=i=+t,u):a},u.tickSizeInner=function(t){return arguments.length?(a=+t,u):a},u.tickSizeOuter=function(t){return arguments.length?(i=+t,u):i},u.tickPadding=function(t){return arguments.length?(c=+t,u):c},u}function Vf(t){return Hc(jb,t)}function Wf(t){return Hc(Y,t)}const Xf=(t,{yScale:l,tickCount:e,fontFamily:i,unxkcdify:s,stroke:a})=>{t.append("g").call(Wf(l).tickSize(1).tickPadding(10).ticks(e,"s")),t.selectAll(".domain").attr("filter",s?null:"url(#xkcdify)").style("stroke",a),t.selectAll(".tick > text").style("font-family",i).style("font-size","16").style("fill",a);},Yf=(t,{xScale:l,tickCount:e,moveDown:i,fontFamily:s,unxkcdify:a,stroke:$})=>{t.append("g").attr("transform",`translate(0,${i})`).call(Vf(l).tickSize(0).tickPadding(6).ticks(e)),t.selectAll(".domain").attr("filter",a?null:"url(#xkcdify)").style("stroke",$),t.selectAll(".tick > text").style("font-family",s).style("font-size","16").style("fill",$);};var y={xAxis:Yf,yAxis:Xf};const Zf=(t,e,a)=>{t.append("text").style("font-size","20").style("font-weight","bold").style("fill",a).attr("x","50%").attr("y",30).attr("text-anchor","middle").text(e);},$f=(t,e,a)=>{t.append("text").style("font-size",17).style("fill",a).attr("x","50%").attr("y",t.attr("height")-10).attr("text-anchor","middle").text(e);},_f=(t,e,a)=>{t.append("text").attr("text-anchor","end").attr("dy",".75em").attr("transform","rotate(-90)").style("font-size",17).style("fill",a).text(e).attr("y",6).call(e=>{const a=e.node().getComputedTextLength();e.attr("x",0-t.attr("height")/2+a/2);});};var k={title:Zf,xLabel:$f,yLabel:_f};const b={positionType:{upLeft:1,upRight:2,downLeft:3,downRight:4}};class L{constructor({parent:t,title:i,items:e,position:s,unxkcdify:r,backgroundColor:o,strokeColor:h}){this.title=i,this.items=e,this.position=s,this.filter=r?null:"url(#xkcdify)",this.backgroundColor=o,this.strokeColor=h,this.svg=t.append("svg").attr("x",this._getUpLeftX()).attr("y",this._getUpLeftY()).style("visibility","hidden"),this.tipBackground=this.svg.append("rect").style("fill",this.backgroundColor).attr("fill-opacity",.9).attr("stroke",h).attr("stroke-width",2).attr("rx",5).attr("ry",5).attr("filter",this.filter).attr("width",this._getBackgroundWidth()).attr("height",this._getBackgroundHeight()).attr("x",5).attr("y",5),this.tipTitle=this.svg.append("text").style("font-size",15).style("font-weight","bold").style("fill",this.strokeColor).attr("x",15).attr("y",25).text(i),this.tipItems=e.map((t,i)=>{return this._generateTipItem(t,i)});}show(){this.svg.style("visibility","visible");}hide(){this.svg.style("visibility","hidden");}update({title:t,items:i,position:e}){if(t&&t!==this.title&&(this.title=t,this.tipTitle.text(t)),i&&JSON.stringify(i)!==JSON.stringify(this.items)){this.items=i,this.tipItems.forEach(t=>t.svg.remove()),this.tipItems=this.items.map((t,i)=>{return this._generateTipItem(t,i)});const t=Math.max(...this.tipItems.map(t=>t.width),this.tipTitle.node().getBBox().width);this.tipBackground.attr("width",t+15).attr("height",this._getBackgroundHeight());}e&&(this.position=e,this.svg.attr("x",this._getUpLeftX()),this.svg.attr("y",this._getUpLeftY()));}_generateTipItem(t,i){const e=this.svg.append("svg");e.append("rect").style("fill",t.color).attr("width",8).attr("height",8).attr("rx",2).attr("ry",2).attr("filter",this.filter).attr("x",15).attr("y",37+20*i),e.append("text").style("font-size","15").style("fill",this.strokeColor).attr("x",27).attr("y",37+20*i+8).text(t.text);const s=e.node().getBBox();return {svg:e,width:s.width+15,height:s.height+10}}_getBackgroundWidth(){const t=this.items.reduce((t,i)=>t>i.text.length?t:i.text.length,0);return 7.4*Math.max(t,this.title.length)+25}_getBackgroundHeight(){return 20*(this.items.length+1)+10}_getUpLeftX(){return this.position.type===b.positionType.upRight||this.position.type===b.positionType.downRight?this.position.x:this.position.x-this._getBackgroundWidth()-20}_getUpLeftY(){return this.position.type===b.positionType.downLeft||this.position.type===b.positionType.downRight?this.position.y:this.position.y-this._getBackgroundHeight()-20}}function M(A){A.append("defs").append("style").attr("type","text/css").text("@font-face {\n      font-family: \"xkcd\";\n      src: url(data:application/font-woff;charset=utf-8;base64,d09GRk9UVE8AAJx4AAsAAAAAxwwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABDRkYgAAAFGAAAlcwAAL0RC0F+QkZGVE0AAJsAAAAAGgAAABw+UK5QR0RFRgAAmuQAAAAcAAAAHgAnAJFPUy8yAAABZAAAAFUAAABgWJzhv2NtYXAAAAM4AAABywAAAyqDxHFiaGVhZAAAAQgAAAAxAAAANsz4KqBoaGVhAAABPAAAAB4AAAAkCEQESmhtdHgAAJscAAABXAAAAiwGQwpzbWF4cAAAAVwAAAAGAAAABgCLUABuYW1lAAABvAAAAXkAAALBbi7owXBvc3QAAAUEAAAAEwAAACD/gwAzeJxjYGRgYADiynnODfH8Nl8ZuJkjgCIMWyZ9YYDTwv++sSxgDgVyORiYQKIAPLQLYwAAAHicY2BkYGAO/feNwZflBAMQsCxgYGRABd0AbW8ElwAAAABQAACLAAB4nGNgZlzLOIGBlYGBSYcpnIGBoRxCM85i0GK4y8DAzMDKzAAGDQwM7UwMDA4MUBCQ5poCpBT+/2eK+M/A4MscysgF5DOC5BjXMgUwKAAhIwBQMwyLAAAAeJyNkE1OAkEQhV8D/hs3GuOyVwYTBjSewMzCDWEhCfuhaaADTJOexsjaA3gTt17B6Dm8gCfwTdMo0Y1MQn1Vr6rrB8ARniGw+g3wFlngQNxGrmBHqMhVxh8j13AsXiJv4VB8RN7GfmWXmaK2R+81VJUscCpakSs4Et3IVcYnkWs4F0+Rt3Am3iNv40R8IoXFHEs4GIwwhodEHQoXtCYonlGLHC08YEJlgATDEClzVaSyvo8FyZILNKilJI2MMYN7kgzdZvzKmoL+DbXNWhOUBJ1g19maGYpahilrrtHEJW2bEUWtfEkDqZ0vnRmNvayrC2nmSz+2eethogbJ0OZeKv45019464qGTJ3OvLnXMrWzmc0LeeNXqrF50rF5GdZOmWwqr5uXsm2Uzgt2WZ9Aokvrwok8w2wju8qZOZ07jjPiOlMO7Ojq0WKauf/V/px4Myf5/WZYa1WTfL/fC4cq4hElruKh0NOu4F7yipv8tPgzRJzhC2aqiNgAAAB4nI3RW08TQRgG4HdpOYggUBHb0uo4nNSWgwfkoBVBhXLSgoooAuVQjED4CSCnBLjzksQ7Em4Jl/4AErjlGjbwGyThBjK8u7MEDWCc5Nmv8+10951ZAMkAXBQmNx3A4BVJhewadt+FdLvvxqY9F/yVgX5MYhXr2MAWtrGDQ8NjxFwrwieCIiL9MiSjMi4Tckwp/ktg4MLVXhH4Y/WwHFVK7as99UutqZ9qWf1QC2pCdav8o10r1V7YTJhdZq1ZYIrdY530wpGLvHO9JSxiHCPMzmFUOF2vnQ7cD+znDdAk1dOqw7q37ojThsNau+UYpG3HEO04hunQkeArPBpGWWMaxvgJVjR8ZxyvxsQQPo3ZIQIadwER1LgfiIiGb4D0a5hiDWmYZo1qmGGNa5hlZT7JXJhjZSbJLPgK4/eMDVhgxhT846j1MJJc7uSU1LQr6VczMq9lZed4rufeyLvp9fnzA8Fbt8UdWVBYVFxy9979ULi0rLziwcNHjyufVFXX1D59Fnle9wL1DS9fvW5sija3tLa1v3kb6+h89/5D18fuT597vvT2WWc9qA/zP8as9Z3m5vVk+rQ7Ze39bIyPLC0mLn/G0N/TE5rzdrgAeJxjYGYAg/8NDMYMWAAAKBQBtgB4nDx8CYBkVXlutWPDiZpRp+2X5CUCmmhMosY9xriAiIKgICr70MzSM9PTe3d111516+5nvXvtW+/brDDADLuggKKRTYEBFWNekpdoFvN81b7OS95/irxUTfdUd1Xduvec//+W//yn+2Kvf32sr6/vjcnRAwe/emBmZCoe63tdrC924/YnY9uf6tv+9Ou2P7Nr+7dff9FPX7f8H2/addFXFv/jTa+/6A2xtx55539Q+l8P3nRha6f9e69f+PXf9789Fnvdm98M32Oxt8D3XX/wVvn4A/DtAXVP7F3y4Cj25th/i7099sex98U+EPt87KrYNbFrY1+L3Ri7JbY3dkfsQOxQbCQ2FpuMzcTmYtlYMYZjYawRW4mdjj0Q+2bsO7Hv9X2w73N9185NjHzoQx+77LX/Piv/+8CHP3fF+L4DM5MT1x6Zmzi8b2ZufGzfXPzA0OTk0ORVQ0dSU0eGJ4amhmaGJocm4GtuaOKKocsuH7r28qHrrx26fOjKK4au+NrQ164Z+uwVQ9dfP3T9NUOXXTN0zbVDX7586LLrhr76taFrZ/YdHDmwb+yrI4fH941MxIcPz+wb2zc1NTOZHJ6e2zc2MRnv/T82PDvbe3B4ZnhffHim93j/vpmh//xZPj8EP8998PMf/viHPvj+D1w+OZWaGTl8JH7Jew780SUjU6n4kcmJP5Xz8r5DkxPxSw7At5mR/XPxyZnZ915yuTzKyPzwJZdPjo9PTsxecln8tWdHJife9+XJCfnr4ZkDI/vGLvnw+z9wyTUjB4YnZod7R3ttmt93/fDhubF9M/JXl/znzMOtL/a62K7Y62P9sQtiF8aOxH4j9obYG2Nviv1mbDdM2ltib43tiQ3E3hYbhAn8rdhvx34n9t9jvxv7PZjMi2IXxy6JvSP2ztjvx/4g9q7Yu2N/GHtP7I9gkv8k9l6Y6PfH/hQm+4OxD8U+HPtI7KOxj8X+LPbx2J/HPhH7i9gnY5+KfTr2mdilsc/GLo99LnYFBMUXYldCYHwxdjUEx5diX4YAuS72ldj1sa9CoHw9dgMEy02xmyFgbo3dBkFze2wo1oEQORm7M/ZQ7LFYO5bos/rsPtxH+mhspI/18T7R5/S5fV6f3xf0hX1RX6mv3Ffpq/bV+up9jb5mX6uv3dfpW+hb7FvqW+5b6VvtW4NQvSxGZczuggF5vG9uF7vg9y984Tdu+I0H3jD+xve9qf2b2m/+y+4bdp9587m3Drz14MAlb8ODZ37ra789+zvp/779e+/+vb98+3MX8Yv1Sz71Dvb7Y3+gv/vGP5x4z11//LY/6Xtv+X1b73vy/c//6f/6QP1Df/Lhz3/kwEdbf/auj9/75//3E+f+4gef/NdPK59xLt132eHPTlyufc684tor7v78v1z5m1f+3y/uuvqt17z9S9/88qPXWl/54vWzX33v1/Z//aYbbr5x+eY33Hz3LU/d+tJt5/YWb39m6Bf7bt3/y4PewROH3nnonw5/f+TS0bePKeM/nvzc1JHp52Y/Hl+ff3fipdR9mWtzuwpvV/Lahw1qX0VfEDX3j/xM9JXK9bVP11eb/95542Jn+aaVq9dm1s9vXr4VP0aOt068cGrPvcP3Pn72c3O7d27YvdO494UvvDKg/GD7lcHDCraCo1zlo0JDA5cKg16Ld/rxR1je01x9PR+ygAUudSgXnLPI4w5tI3oneYG9jAYU+g/MyJ012qavOcgQNk0ZaP3ftEFCMSecCIvpVKWYZgrJnGUWk1oGz3lJL+mrLkWMurZje5YgFVqGT3AdweEfFTQKo3JQqpftBsJVXFZD07UFHJOml22Kdu9c13nlM+cHYt2P/vq6wSnVs42EmYd35rhCbP2r2tVkwteQZ/R7etledhpCiNBHzQtpzTnrf4P53GeMcxJxJvjc44aHdF+jcxraebMyaNu2QSwYCZy1U3QerpEcwioewjfzYkNxbU7roiUCEpRcn3J2D7ySLbNjrMmXaYQjq+OHuYrpYjpP5yilhoF2v/Kv35195Znn93S//sS1T9XPD8S3/6D7rkGPNlmDbcGweiXHJ8etQK/a7AhN0zlShLtGKEWElV9ljIq/1NdqZS+o6FXsYpdy6pohpvAKGGOEA41N4zzJEoMi5QJe5WV3vfJT6owHKO1qZn9O1UeNuD5BSvowMkZncX+eFIhNihZlrIIGjjGfdXjTucdOkNPkJK5aMDGYpagiJ49YRFOogaiNFaxYCWvUStk5+yZsEWxilejEJHAqcDxMkUkz1pyhwYjZ1KKqlS0WNEUj8mZQgxQZCRQU5j275JVcx647NfFQ4FCP5v8U3qNyetictHx7zkQpy7A11dApYQrPCj0yGoW7wkWGKqwfF2gBT+Mjdsoy4cgmNalGia87lmPCqWBh+yaCa4CwiqgHk82YjN6AOx6P3A4P4YnQ/ykNEHXu9xx4nlK4TJvOkmmyl2DHCLOhXiIR8XDgIc9teMLnHg0xt4XzcwcO6TCI4DINnApFO+h7gxQftXSSsTFhgnHqQ5QtwMUtI7G4zPqrrMI5hDglMFxW/hPUQruD1kt7um+9b//qo984fPbo3Q+/PPBo96rtfxy0DDNBkiSDTZsadFY1LMu2SW+ICYO7BU8gxRCWBrfkKFaIaSTglRhmgNiY3+BkRD7MBiqCk7XlcLTzApKqVXTgpJiN5+A+YSWwwlK2iuTsFUtKWQ+LLUhGH3PL1apwrr7J00baNBnJIDtuB9GYm3PyHHMMaW2H8ROHF7OoorIj/WyWKhyjgUVGuAFzkWesjEPCqOOige+EFVHjW6i1eOFS2UtdTDXHdlRXCUxeYDpgAGngYtsrccEC0iSLFDAAcbgxCPPQWa94InQ9txJtHKcuZfCs45eqZ0QHiRZ5DDesZWUp1VajVEV1UoArMzgJIcEc7oktUkIkatr9j2iClxb9OmPYt0OjlzqYyskcCgoUDTyuUMJZXZwkTsbJCQyAYmsYwhbbLGvCS3UGqVWkZKWfdogvh4kwjSGNwaCb6NzORwdp3MjSOLVtbNhINflaP1tzynQBRcGFPfgkApt5WkSf2z9o30JNC9LDcqzQdokPONBmImj6db8kADSs/SSLupe+d9AxhSXnnRVZgR+yx7UZM01wNqsoqq4BSPkFg5b7yZPsfghhh30TBsgPnRavcccu5dDOhTvvG6QzdJ5hbtg4yVCK9Yum2PSe8Z4guOS4gObyxpJw6nFykM6g3b/afsd3b/vRFwGu7vruX70wcFO3f9satCE7MOSvDjGOBioaTqbNIrYwRJxhpffitHpZ59aHlAivuZHXLi20mouoUgcYX6psRCu5DdvDHmWUySE3PJcaDhr4eLqcL48zlGB5XDDRtz41iJV+feSGL2UDQ1CHLJEGDUXJXeAihAsTDOLC9xteBDntGJ4J59FdOzOIqc1sboqM0OF0sgWbQtqoxCDm4eHrrpuZmZ21DGQZBgxA0dh7w/6vDd9USNAchdns5CoaoIREv069g6qtu+6pNCuNv//HcoXS8y/VG37gewzi4ybHK/kXU4fBPCJWNpZzFF2zk4DP1qlObjUnrtG/bicp9kYpZjbEi1mbLxVPjjzSOrmGji0zUW+Wy9UVtkBdJmPYzzeTdd0brQBjcXiHiwCyBIaQSFVMih7biQGe5DJKQVGShaxZtBnEiumRGm+Klt8WmBEX7qiCH9QAmXc/duer2xe82NdNvLir+yfb3x+cxkmrqFu2BbBh08SMntdyRLen7FF3sn7YVVrjvo5CGAFFNyx4HS6aU+OQuBDwBCeG7b31a0pD7am74mg5S2kdQMHrpcx9FNKSBSLk58rnTp5+BFWUft8oF1w9yvlWRH16ekl4TkBKpod5aq2HPjDlqBgV/UJJieDa3aDh3WMuIDvKOf1JzwL0wrZpWpamMtNUkK2lav2JRrydrKFCFEX9ruf5QpTry6cEZAkTlAmXtUjHfPILD+z1M9zhMwS1PjlYtyOzmqvmQcIkgbksU9UyuXShoMB1GiLjj99vriBzLViucZA0HI5DPeIR9OLOtwY9q6yEKmqmDbXfNnO5QmF6WtFnzKxNaEHknHhZC3XfKpsr+WcbrXuXEER5pr+TXpxt5UCPPLq9t0v7ll7e9dCvvzaYxoQUgb3gyhOQtlmqkXeTWQ6YKb+YXsn5NoqsJeEEkLU9WmCehGa3AqMmSImepM8ER5SXkblFfEtYIs2SNnzKx9rd5K5u9pODoMUkCka0VgxStYkNtZpdTG4VN+zAaJi1yVfI82t/h/wF4TZOdO459XDFc7jjcOGGPnNLSITFdn96UxdjmaJZ0GyrWEzNQpgQyGecLwxflT1kFU0Fmwh+IcEPYgICA+dvtuaAbObIYXK5n6rcFo74hWgGRbOrt1QTtfmlmYVUuegQj1ZpqwbUunvnM3f9+q2DOvCqkbRyBAuDW57umvXsPTfJYBOaq0XpxgE3g4Tijbuq0MWUuFXcoivGPuXK1B37b9XVomIZSibLzQTCGgCoTg1fKamB7tCI3xflWGth69TKydpKUGvdTR0EpAEh6ji1p7BDJCg6wYL4pXHS3LJ89bi+VlzW2khbHH1odt0ItMh2bRde+J98YDmHShpkoQk8inY/1Z359tef2dMdeWmg053frg0aJhBCyk6DjDnM4ixOLaYBWgP4FGAeUjXFS1dQpmyQXK4IQcd0XvRzUS4obEx0Uq2M7ozjSXyZmteBIEAfpWma65EeaU+BdkTH6KHh/sR8KiVPhsp0gwmxLQvUKIibArc7uUahxOt15IBQlif82CPwyHMw1s0Z6yNO2kn79iZugURwXVSKsM+3xGPiNKshXukvZz2zmq6lO0mQMSRirgBFJCGZRHUnCOq+n6ihoj+/nFhCLdx/0j4tqIcG7pAhepFH/YhXmIddO9BrdjsuFR4Zh/hOcwA7trC2uYkq1UoF0juyg3wrvWSIhKpZupFOzc0aejaFcK2fVPF9VolAjDCXl9R10DB83AdmJRSuFEL8kW7m/BfP7+keeeUTPxm4rnv82UEqtRtEL1tlj9JVtgZupArTS3z8qH2cnMV1168jDgSLI1yhdd03XUaG+K38DpES6MyFA3fQBbxKSvaSsWK6lpNl8xYkNdGSaOA6swC0n+NZ/jEMEZ6DCdlPbzZsIFYXeI2oWMOKbWEFrtYo6DlP8QpewbFB8Q1c9whvRN/g6AQjn+snd+BxkGWQ8Y7m54RbUgI1sj0XTh2EJSVA6gwCswqGAbIit/PJl/q6l/zdoIqnVPhcApduWhqE3yyfJBl1rjgzfRh4hRYy3EDMMORjneFaxtMrhuAubwmALnbilAhYTw+hcm35AWfDWRWV4jGzYcEg6B5mGsTwVnf+J5e+smfg0q7oPj04oGTwBP4oHiYzkiaJaRs4oSmQxqWJ0D7jBWyRt+HqLj3JzosNvsK+zdY40Bfz3Aj0L2nhZSIM3/AIBTExy3Zej+clMq1lun19S7/a9eDfD2ayYBiyMHJF+AAbm3JcGHYKwSy3F/SyVcIlH7mAX4wGLCpXVvwKaekV+zVb44DVg9g3hOGi+aZhJFJod/edf7X3+QGl+7G/GaQOkKjDvNICgxAqL0pZ4FaqWw5QEsSyU1pmICwupaK2IUO7eUwK5vo6HJg1j0uh0zrBeRRufUcHY+lpgcUI1bkmJkt5y4pjVc1ZKhDgGPgqqoNxQcW872p5mB4drI559IsStmwQQUrSTubHwRxamq31zI9u60rcmC7Ow290KdOzo/IDUyOgHyidu91QtLxwjGxu1E6HmpD+Cj7EtwOrqgOlchSIeom5MNIVuBoQZgTed/x75CLaOM4u3n1sO/fLvvZPuuGPd3UfWh0Ek8zkLXAjtxZ4TrlaqYalsOQ4nePyakH+Oog7ftNrlo5BDm2wBq1D4gHNUJe3M3+t1YBpXOIgHCVPFsuFmhJlQ1OYjqTruTAn5l2bGZ7lGBxsqIiXjIvA0MF12WKCKbZJiqZhwR1L4Jzp0Qf4FgMVi5kJvVCYn7oUJJYFSWSpE9YhupcOB4drR7nJYQAR1VtTjuKox45W1Yq2qDSNyPLoEu3QEvMgvl0geeTShTJYrHdvjwx6BqHL5Dhpmm2lpXh6abI55N9Gv4Lofj3eXxjOTE3PHhk9oB4sx/3pjcJSfolxa0E/Tu52jot2+RtOiID9yk45XCivAJKJzqojg9IUMngfWX9517e3nxqcMSFydVOjafExNk1vJxNkL965wdyPU4w4OpCDKQgKrZMAMWDvfCHvz4ruR51umk/kXrRaphgHMRbN/vgTP5EZl97+p8EEntXGsiOZRG5+fnLKNPSEVQAm1ITOSUUPrNAE4+RanAkhbaqE/kcfKkdh0PZLXiM6EzTtKu6Yrg12NsxJImZSRNhOEbhlQhvV5s1CcuQ1tsA2MrXRQ8DiRNXU4vTk4UOqmskVsunMxNT1X5FzVIhzguQswg9qMC8ds2+BNsc+ZiAqwdzJOgwRoHJZSCMWsTL3eEm8Qlq0RCsQMZF9t1vGLjmFGeCkAoqe1vzI9Xwa0lKlWowMT5e5KFTQYRrhjoqRRXrnzKb5UQkut7FrgD1tSeVgJpQijsL+WuWZZ8tV149C36tVFldLpUYjKstQFkI4nh9VvQgC2nGAtgS4FshuMIzA88GiqDKYiV461FgD8XXcAZIRRBIH15e0uhVaPqUiHF4ueCa3BGGI8JEAhDbGEqEZubiIR0iBoN3r6fPb177S1/0/53d1/1f3Q4PUtgqmUpyfHlWMojlnTRI0RWaD/skoBXpQ96ce1NtERgZHqpO2+4/o2nx9f2nCrtSnQB3lAq2ZKhtPJE8o69ay23HuEaWoZ25hnNlKJ4jC0tIJOXvyZJsL5XvI3b1RZ0Dy6jf1RaMlrGxDLemuLkxuODL/5nxbaN5NJSATylUYVj/0wnr74e8BtLmBA68Bk1H2ABtB/nCBgoq1XgA6sDl4Vl8VGabSrJAKQ+bnYevjxjRBt5O8MQnBCYitgXS1nJQbd/E6rbMAzmFRHOOnGDoGYwWCxJg5It8NtAU3rWio+QSmhbSah3lOI3OG2p1kM+0Fq/C+CB8rrBdbRUd3dO92CsbLSFAF7SbdlX/88x91pxN72i/f/kr38p985i+vfOEzPxlYj/399v8YTMOImKamanESJypRQAjp2l57Hg2ciZnDSpEMkSmnEGXqMxuZM+CHzpaFLPEwTst0q1QSaOBgrOrcy4UNAA9yDn3mwoF9MXoZv91LcYMrPUItMJVnGQk11/RNTj26CBCBQgFB5iHzTD8cw16wNnHNvJf9jfe3oIUUtuD8M1tgdRIaq2hgf8xqmi3sGGWLjRs5O48BKgemFMotfJFKg9uYwpPkg3ge4Wz/wKlY6oIROm0dUIaVOUOxFTsD00696Am36a+5i6wiOY1zBGMAV+PQdXSfX7v1ot3PNX+4/bEXbvzhnn/9UfcPnxk4u33l9v8eHHjxtvzO7xpftEy4PsBsbrAEyZGCLNeBWCEFexZ/iEwhfBvLhakg6xoefBgkBfaM034Qul4jbAcnKseM5jyqZpw0388mqGWM6sMsKMaNXGJS1TCMOyGKMqtO2wjmmM76WSfvGY4BAS9lquEafrFUrKstMzIpraEKmJWLchSDWyAmLtqaNks1pwBnp0mBDcFKHIsWHQvJOpIUsStT5aJrAQJK4U4lKJfB9Di4YpYsdE/uGW+r5fCVSq/0A+bT5ce3qHgNFcr1pYfAOhPmlJ0oaDm/1BeJa/RMpzwUdYotENflTLUQIBNsVE/lQxoYAkyzyPv7xYyZtidVbAOf+WwTsbOUBsLjp9waXWYPiw5MxtnjzjfcTlj1ym0ztMHcmI7uCl91kObYNG8B3nf/x0/AlsGkaHgkQeDjyWu2G2zkXGLqcOJIfi45bMVBbRXsItLj2k04g3Ps6zzpjPk5bz48un776nyor+bq2sOz36vcvYQC1wOBxKjvhX6z2mr3khmuv1Kt3yUWGeQ+XUC0WtjQAhu0BKCdO7UqS0WKo3gH2yPshsK8eUsmXkQqSBdpJ1gL9MX3fLdxtn6mvnh8Y3M18ktwWBfgFPlu0+QluDchRBxLSBLIlXQ26SrMwOgX//bxQQ9kDkuzBFa1bG4mn5/NDc8dYoeWMqViqNbURu4USC/mNMON0nrJJCeiB6pn7KUJtFvd5uc/+/LVj+3pnvtb0PSf3P7ZYDLD2MUAJeCzQGrP2zkyY86DljBMRcWmk/CPcrzOFpkJ5wNS2wNZEMjTY6ukRU6QJZAK7V4pFJu2aRRHPk8xkvrDUi3VLNi6ngDxNlrYa8xCABvpy4lCTTtr55A+bhwtzKopbAB/Gp65UKjoFQsUQa/cyOQah0Dl1XAxvNs/UTlXethbCxb9VX+Fan6ntNW+r7Ja21i4E+wV8IYU9QMfYJUFdhFoJAa40CRM9cCwQ/BJkgUeZuwib+ed9PMX7Z7Ybr7c13Wf3dX90jZIf3ooXShOzWeU5MjUrf5tp4Zr2VKxpqLI0I3+TGHkSDFjqHq2d0UgSW07f4Ro1gTf60LmwchhKaIOB5pjgU6TdGs79pmxH5jPdhquzatexVtZDMvI8TyfA222z4qSW3NOSU+MfUiwJX2p0MAC95yJGN3KlVRf65XofDf0Qz8qOW6lybVw1WsxTloIRp6AxwrVdVtgnl+kFir4/dRJbtigHORqj+0koryTd4osDUjELYWih/9s0DUh4eGwIC5I78wtqnIDRIeUMHGeVo2ihgrFMYAXk379mBYUI70hArextbVY9kRFlGgA7w9UpO3og45dViN1Y9ovODNOnKRMRU+nZotaAlTnPr6PF93iCjKqznJ/8M1j992/2a5g2syh3Ub3DIz+3u2dQYXM6UVD1tBtQKiJpKaPjs9NFsZBwGsEZ0fZbbWjqDq5Fj+ulu0zxAFegSRhdf5oe6mKCnf0U9NI2KZtpa8zZsyEEsdxUrQytgF8mLdySJvpFwAwwkDLWv+yRiSgCFAy8iIczoUDWN8Rtdb3omPlu/y10ikUHXPXq6tOUDkJstJzvR7UebKMBiagRJrUzvmo4JFKPwFBpAM4aqHpZZoAkr3aMAyrWxCyrjpezQikclVgcDWzpk7QqU8NbhorM9VhoVOaS2eS89nx7HAyrk+TeVJ0jEituif8Gmrcdeb0neUKuLKalMQb3z7fTXcv6Ot0d+16Yjs1mFYmrvQVRgIj1BugJUrC564bgOTzItf1vNIyB4ldJqEVYMfuAS3p2RvFL5A8KYR5DeV3fjZomaYlCVmZBVaPl9J1w7c9M6IoKIH+haG+mMsKo5D1LcFDN4icklvBC4YrbYlcUNScjIfiQUFXCnCe8z/+lz/+EVjDy7YvGOwtDbiuzwWN6KIZqSXLyXngyamsvGmOygFtDDyVkDrYtnp3k9hy2Up6GDsF3KOTCU+uSwqbm26R45LdMao8DDlfKINcpNUmu/jGna3BpAUBVAQpa+nEpGPkZiOTPqLECaSobttAwBikkKyZUfgRWXDBruIWQpANoKYA1AVvlQBjgWqk13Fc4SI/Wjjn1kBsy+UqHhzjZQrDANfkko65ZFdwScpWOdkCe0VXVqlkfQLtvrH70Pa5waJ5y03JWSnI5ODnlXzu8OGDR6aTeTVXsOSw25igHDg0nCFFzDnYh0ZyaW4lvjHmqdW5lWx9vppcnK6nkK8FmgBCAb1pcSvQPKNaKFkVR65MVJqVFvPVCNkCXAOgB5B/NL3s2zOr45tlPHw8W73lkWxF9wxfQqBYX5C6amP95Zd//gvb0qsYQlcN5xdAJ2po96vdq+8cee6fXv7is3sGLum+sn3N4PvpzkVqQlft2zDJIlCLqUDvd+XiL3A+wA5w0+P8Hu9eb5Z0PypAnfIlpyEakKRo4C0gDpggPo4cH+iTedYKrsFVuFqQZFMmOmoUrSFpP360c+XguHmYHXRu8nYuV22Vyqq3rDqAdFKtKYOqctUXbhfZJBiWSuK1chzHgLK91eqALvMF/g33+26bopCu4EX8mHmCrftw+JKo85AtcM8Dz+SxACRL1TKtCBUXDxbGQS/cePf2yUEVHBq29Jzt/PyPzv/F5oRUZ+tzYIqIoetGNn/LDdkcSqbzWduw9SOHpNUePmLr2LYM21aLTK8kKylKSzZIrpJTLXteAHAhM0CADg4CP6g3F1eqrXp7pV5dQF64sbmyuLTQaPEIpCX4J7PDgmQAJk7IsliunA/RdOvgicMn89V8ScYQ6AqRXLrloaKbDogzP4d2z010f7Ov/e1d3T8FBiM4bxbtAoCQoivG2GzPT8BN19Kzet4G8YdTyJrqD8BzLeAqHNHzQLSJHhdIUHX9Enf9uuM2m2h5uR5u+Bt+m3X0Rc0HccYMbkkEsSasopGZOQyjkc3NZ/fPjCbnMpZWiINvS7OZYM5LCMXBEM96SfExEiTiVbftwyh4pXbimLGAI0I8Vwjfcfhi6d6NpTZqVDeOQZ71FFUQNu/02m6LL9htXNEWTIAaLAmcOrmGCbgxX9eYXMXA3HCPhHkaZ1cUTQPV/00MGnYyoQEUGXkYxiR1FubLSkllAOAejUQoOG+2UWuBRv00AmlQUqPptTwzqQ6gg3b/tP5CX/d9z+3qjm//7iDIxXghnZ4pzNDbaIJYrhqmLNbKVYsCMr9GGm5doCXv9CmOpQmDu1ZJRQbkBNh2YVWtOq1RwcoAJAIuHhJl45TrLS6V/zF1mjJtvae1QSVapdy6UkXZ9vi6JiwG5MxVf94rgOjS6TTZb48qo2nNOjyqFdHwrXs/VRwu3A6SdoruZ5qbcFP+rNOrAsk1rvqU6IEl2N8oD/pFL4GoCEFiOJKS7E3cYfez71bPtVDTb5bB3UhAA4YjgenbDu6ZeEC01xbsHaRHKo1r+7LX5kfxJBl1Ct5Ebfpu407jpDgVrTbvP/fc1hpq1GqgyNaC01pHCay1iTAvTD/nFmoHnaHijJkvZGwBMIl9GuAHcFgsGT6QWhkUM9MD2dYgVV6mZsuasw22qRAMuVkjqZt2b329J9wzOXj6Z/sGZceJoQCiqwDmICTB1WBDN/ViIVdIa6Zc/JSQDNo0FBXuhbXqImXNUi0MRAgsyrvixT0Lz3ULz3/u5YGnu1Pbfz+YxnP5dPrA/ukvJm9QJowksKCFdThoMvdnxrB6PR5xhhCobAtkHfipDl2joSNqogxsUKdV8PdbvMa3RBWUtn+XzCV4ht3p/NK800Rstn/gVT6Mb8AJcz+hS/nIKJsCsKoaOMCKAAuAkk9z7q2ysvMt/CPzXhLiOimZZ5N/o3awa0Z2oLVMUawjrTwBbgL3RggVohEnbqG7PjoYGqWUn3YLIFDAPHvT8Cyu/AWMGdWoygy280G5PgpEHIjAa2E3qAvfq4iodGLxdKtRLpVJRUW7k13/V923v7Jn6cUbXuxe/8OBv+v+fPvUIKZKb1lefiQIUay4WX8UkLvIitRmGreNIkd5vh/sk02mdekmFcugOWoXQH6BoJOky0wGztJgs7RIdWdSpJ2kc6ssQvIx9zY08CLL8ZvZ7fz9PAViV3dAW4EFAlyvKOfmW7ZHQrkeWMWPsrIoi43QE2VvoSPRUlbZgxIWbsNrYiHqSCzajxolKzTKtmsFySV56jBrjhYkItUj7I5ObyQEc2AwNpuOw3r21ROLi6VKY6G0xFtS7b1W6Dkna94quEsCwoNQZFMjwBTtxA4OljB8quyIsiKzogMRmsIA+aJoE3sPjRemlKQBusSgM1nLALkhV6NnKCsXItU370yenTuWrCqO7ekgR90iM9xZZ07dq6g28JxqZ01Cx1gK4s2GgTmwQF0ky3Y2Q3ipH1iuQYHHrO9a95rnyMv6KviGECDGV+ueKDlnQ3DHJwSni0BpzWd+3td+aVfX2P73QRXPaXl9Oj98x+gNmanEMFaJDXODLVOdAYkvu1QwwrY+ZaWMWXuWpmkR/BmGrzEA/XiUcrPNr58+cF8arRUfwcuBz8HBQBQ/tRH6rrtYleb02JYXhVUnxAHCAaWZSiEymCrrtyC5LALGKZ9M3TEzpcwUbzFmyijrp1pa1faMilXWO+BnjpMT3hMhOBuY0Ebtvub60klU7axvVvx6WLdrakXfmg3+q0r/GkZFtsMQZ77jOSU4JRbySrYNSeOlm6pf9ONVE8YRvjjSvTEnAwjw4OoPttXEnsWffO7Zgae3+7YbEOWJhjxY0VX8+YrKUuFk9Y5gH0vTDMNEw/OmbqOkKkqZueS0bbAs1ZmUejt92s7r7PeQm60KvQUNvEonISWkQJNsQF8rCDdIxQztNVIRsqPBoWiR/mzFDxmLvJK3WetU15YatVOnpA8Lwl6BBDgULmjhFPdBhFbdqt+Bi2qxiteyuMRQEuAGRFVZDjLJbBWWKEu3wDYHuNcF1IvUTENG6p7sYMUoWxQidS1RUjvJjdloJkj7eTyBU+pBPZMdueWmqRRK5IcTKWNOH8pMU50SIUo88P6KPcwf9/7BfBDcTpX4CLcKdNU/FjyeWQWRv9Q98dPuHYk9x1+66jzA6APbTw9miGencMZO2VkyaRf0GX1CJyRhgB6xTarSAgheZJnKvIw3rgkduQX6qX56HRmzD8LoFXf+G4mLSZaX/XmmKde2iUQwmxulnERVaTWQb91lNAB2v1MugahaCzaDx2tn/DW+xiseXQe6Za91DjqqXOmi8Db3KjMDFzeLJ/WE+d4p05NLsdhB2AOcvk9816nwbyC29SDtf4y1cVV3MYgNUAvLZcd1Xb5scYR5v/DyPXo0edYtijzYZ4DtafEFc9JEpy6kbdKBtwRMql3AqZJzrrbgPhCc9VeZb3pW5AQ2ahgN7oZy3dQBFyVKti8rRNRhjaIAI+Il+SGGEnSeGaBD7tku/Kxv6Qe7uh/afmFw3ppIGjlsy94eQzVnTFCp6pg5k/oATxV33ojj1qS+H1kzZjzIOqqLF+wqXIIvIhCRHuQnrYjQqTiLrIz4ggMgisTWPaJ/ia+CKN50tkStLuCkYIipL6WxryyBiGEK4Dya5FU2asftr1nzGKmEtfv5RvRkeNpbwE7YiJo2+aEakSWzROswZaukRldxi6AWacDRSry2addwZER2bylfKts5dql3iwNoytG89wkvbcv10Mb57kdf7Dv+N13jhV3dm7dfGjSo3utwkP2LGh2aymTTmb2ftFPE1BK0105IJMRaX8JZnGAZnuKHhfCmnLlw0jUZqUz3UhAzDBB76lDJCC1fj+yaadJFbUVds1edEqSVbJxxgYWRx0GtE59873uyJiBcB+5+1FtMcmWbYvkEryB3kwWkQhp2vZeJ8hOqaacInFXgoNnErJinaPRqDUwmwRcD5gG+AhvaLM9nHLukeuYPwiapk6pkcUMbtjWkzeXnEnPx6XxxXlcsm2b5USdRirfTNcyVBa1uRSRE9rKxiLfwKnVEg0fSg7Jy9S4vZL1rpLzU8iPkeEJWisTSQuiW/Q2naTWtZd23Xbtu3lmoWhUTssfBJVnNZm7oRqUlWo2HadCls2HeTfiKMx0JPOWjpDvOZ8HDprrK+S+/vOf+l7qXvnrF+YGp7uPdnw7GWf/AqVvETt8skfW1Cqu5Pya/kGsgEMxweMzm6BzMHShVy8B56+PmToyMgWGY0i7p1ZZ1kFeqnSQZe4piR0UcuJP3BLPUehGMbxukquyDgLmRJU+gGuR16CmxJU7RkjiF+Gq/LwIegZ6vgsRDA1PfKZ1y6hhFBB/pJ0maobJF8F0854wyq55xjRKWBWSHtyIQXZ5VQWaTnGaPo4Ej/KeV7jvIX8MxyF2ipJTB1bIER3O8f+BIJocL+Ms0h8fwLJ4lCQppuXPfyvz2N4E9nvvCCwOv3rP9xOAlbxh4+h1vGHj1nW/Y/c8P/Wv3uRcO/3BPd+0FAMXnt58dvC4/b37BmJBFd90AjYAzeI7akVFVT5ptZ8Hd8ECtcwqDkC1/2c+TS+nX09flpooJ00yn5uIGnjJQyswG/dmgUNaqlq9EJrcBIfL2vGnbEPwZppbnhLEyyaXs9yzfqoPUaRgLWgfEUsPdqDkygoXDfffYcSYQ8wJyEaEAQ2613TkLYqvn0R3fv7cnmb9vg/giEY0QbRt3qqfsil2SgbUgpKE/5bkve5tkiYBkdXyHUt4USxTCzIwstp+hK5mFP59Du1vr37/phQGl+8z2zwZ1MpWW9R1VLSi3DF1+aX7eUPM5WXiUK2yMQd4FiAR2k5TtRZuwFvOA5HyjQwBBaAfeztMQ6EAfhbx9jZsTujNGJQkrTJfe/pPuR8jOG8k+qgrDy3p4mS9xh3ll7rKI3ofoL+l9/YG1AmbKMe8dldphGUw9w4EWqcfH7rmxMsNtqjED8UxQkCTs9OzbquzP6kUhpyGILF6lHaOClKXEcd0zvPSizL6RE5OrqWaijimln31Ya5gRJYaDbHhbWG4t/8OvakHJ21p2y6UFLia3EBYFpkEgkfp838kXdp3dPjdoWKSIryUz+DBOWLfTOXvIuJR92J/wpqqTZcU3CPWAK411JaBtuslrXtNb9Rb8Bxpn/FW8Cp9UWgzqjGPg6NCM/qv86Ohs2p12EqDp5m1w/8Zk/spMRiBD9nt6xbb5mHiMn6LfcDfdTed/4uP4LPEMV9YvExTNU8xUHe3+y+7fvdSNPb+n/eJVL1/zRPfe8wN/vX3h9i8GZf95r1lWNk/juQy4EjoxpuYzs4TNjSYmJkZM2Xaeris1I1SqRmCAvZRRNLolm2vkOgF2cq5sjScZYPtsBufZzhvp1/hNLMtyIL1kf02GF9DA87zAxtgMu4E2nWGe5Rm5JeK7ICBkFZFwS2DXYrQBOPDXIYuYDNLvchbViezyYdJePe+U2QP2Ci6TsuzItR4EZgqMvyUuvAVCbIMcR+TJqNBfyruysYK64PPCYgjGy7Hbdg0YYSXy3dWFUmXzLNo4e/qcrAv5KZFxJ8S7ZK87VUnRvsn4NNasjH0bPYjoCDWcnJNlGHyHEVhCijZH9MhYajxZFEICBsQODNAy3jn3OF10TgbPsS3yMHnIOm2W7KC4SgWi7sSa6qCiM8ZNYEpn+5XEns7Ll//o8093D54fqHT/8dd9g6qWH7NmjFH8GXEVO8pvpTOI7TX8fpCfZS1MLA49ET8xezJ1bOZs4rQRyiUS0lsZsEEcI4vnKzANhQsG1ousYORySpGP0kk08CTZeQubZkfRwDrf5+2lB+it3pddBQ1UIFtMmG/dU71exaDKF0UoZJmXnbFOwOsJeEqA7mX7JNmSBzpnb+J7EN6sT/ev3n78luN3VFP1uUqukjtzrYC8C21w1lYVAoTTBY9SRLHnuUFQFlW+7txHuv3mE3iTPes8wOrhcSeUnWWyidzT/GyAklGB5EGS3tl+sbv24q7udds/GJxRhD8zPzU3OTx7m5bVc6AjbG2aaEQxUrhgZ+wrWR6BscmxghijxE248/UDUaI+ujSzno3MkgHCDE6+zFGZ191QnKjcfezYGc/3fNnd0DreONY8Hi75W06D300XEFlnFWWtsJU4nqmB+Oy33OnFnvcEY6h541XV1cWYq4m0P+/Pqah22aCrtXJl33d90jDr5lK2kark2hNyvwB4PdXLwvDGER0yRvLjynRqVMmkp2+8KW9JN6LZaSNDc77iguwvo2I7dxeuEhAmOLAW7Pt5y3uifvfJR0uN9a1eXQVyDe0Ou9ZLe06/eNWL3aM/BNfz4e23DcpGBLC/DrsfTEOvdRnkUUP2I2CYVKuUK5lg5GR9t7dCS7jpH1zL+jbThS4yvkXSbtIdFTmMxs1pTbWSxYO5XE5KHtPOqVQzs/q8D+mPQpuk+kmRjpJJ/Amb0/cDi9D387HwgJNhYP8cywPUgQPTpteWBcEKD/G6Ddn5NJzHSXzOfoI1ZWdVCeJq03pGdLwz5U55uRH5x44TjgiT7Seu79dkd1a4wC7euaL7zsEt467petxXfLljxgQPSFxTmcwlconb4qNW3L6W5QQqcOmp1/lD/JtkQTISkXVYuZOEn6ie9O5R0e7u2xZe6D7y3K7uHds/H5RLVJikjBuG5iYO700OZ65Xx+0b3cMiTufDpKv6c5AhSzdF6ZX48tzDU01ZdZQqn6yJlttwNltVL3Q6jXIZhWFk9h9Pt/P1bCNDeRWGYGnZEb4nN3QhFiVa/UqpGMpVkOFFCCWWlCzMvAjC0XFrInDrtdO4jogj28rcyFoBZdkAJ1ql7dyG3lKXZs4q9Ww72UqXUD4crcjqjAXaIeelXZXm6ZSmmegHHx+UFBMWI6XsBV4l0xypHKkOOyl6Kx2lppU35q2ckkRqZqbenwszJd3NRxNNGRIA/qRIKC1kiwWCmcZUYQYGEtjXQGor6/MlDXS43Gdmx7MpbSJnsbg76yh+ooNyNSNQG1MPWjXyTXIKUmrBW2s/WGmVaqub1UopotTDKLRqTiWshi4tK2i3tb3y3J72Tz/x9Bef/+zLA52ut/3Pg4RkSZpca92YH0vpVrxg6eCRbIw1TT3sJtGA7aRtW0yjgY67F++8Rf9znCTDBH5+hNzWD7/M9vsJz1ihIUB8T0qDFhESeyJ4SSRLEmv4UXPMeYotsS3ZxbTR34qXC8cmTo5uTgQKt2TBqpxrjjeP+Dk/z7GnR6RX73ZZyVssg5OoM+fwC7KRlcjju2P3qYFMMNtBRnjHPZj0amvwY7aWraCppf6Kd7rVjE60GrWVpU5Lt6vNUpXgUBZARFAD7OvwMmKuVpZdlr21W663TVl7DqXfNQPJy9nApgh8E1cFqPk7PNtGOx/euWCQ1lcqj0dl/rgIiKzeBBAyvt3UUAkMej9NJsfGJo6OfenQqK7hPNYxjGDOps3+AZd2rG/ZVYhjHz63BJIkRLsb+ktd94W+7r+8tOve7sAgwKju6p7uqsDJej3VTh0bf3h6laLFC+6mdy622+fOLpyIzvqbrEa2yKbe0JbV9dG18QaaqYzT/iOsgG8tJM20aQOdTqgYF4tkETK+Salfbd35wLkHXdTiS1ZLrekN3ZH9JjaMAZVtxiUL8iwsN3mkO8Botmx4d3T5LE9VMmE6HC1pMDpYyg6xD/wH0u05U7eL5qFsKpPJTUyaxdSR2dHwqyLJzF4VxuIm4kVfrWcjFcw6yNs1ZyOqOOcXTlLw+riZbie9ND2EyBWFzNHh5LxpKWYBRiYF/sOgRWcqSlcPnzl6ivBcGSUbFk1lcnmSKyeFxXtlXA8mDO0+sa2/MPuDPd33/QiC+gfb/z44ht+XG9V0nLHz9pSRMKbwDDZ0PI5I2jf6I3VNa4tl0fEXHPSeC+nOG72dXfa7SY5Zsu+gbLjMoas2yF/u9XY4yT12SAjmk6fpGfw42bCfZd13SWdrl2E2PcIC9kiYI895qM1bQAdo4A4HdFRAKzB8jhMEQLZAcZ1+0zU900WjpP8QVfE4OERn4YfXPt+Ny3T8/varg7KKCBaWajP+pCj6hR79mMwIDke3OMPOAfewsReZR1L7pofzSVWZn5+a2jc8eqdSyZy0a9pp40l6jJ52zjvH4RREm3d6jTAeuHHIT75Oe6uwwtX9RIgSUX/eMAx1XksQk+hEsWXV2QCGh6DtWKp2FRm13s9u9/a7h4LR1rCrAOYBlnamXXMpWdVOWagFkr0BYBo5AqxMpyS3uC53opLrBYHjbB2795nK3Yh73GccwHaLb/B18hCWRtejnn2X+kjhDJBWQDnCnlWFtC/PLWpyM5fGMIzN7Pbzib72X+0CB/TUIMZmShvPXq9PYQOkSBEX9bH0NXbCni9m5P40uS6NMLYz1iQuyF2gKH97P6VGzWhkztqs8LjVURfMjl2d/y5wvafWZflbqxRrKLXanwWvkVLSRWwBqgMccMst8jlP5a/FmRWOgvPnpDwMqs2sfQ2y0wgmQF0Dk3MjPOrm3ZxTgIHNIT/RHPVNsA4mHEMVuGk0jSUwlXKxVZbEWgt+BXmlynEMMpnIfcFB4yW+4D24/HL0sLvMTH9VlP01bxF5i05bvkWrWHJflMwoV2dZOg+KXQE0737m3Kvd//nM3hc+++LAI9uz278aBDrJgaFTvJxrcSLyPO3dBiP/JTTg8q+zuAmiv0NgHKXw1I/Iba62ZqvZW2+75tBsPKv62mlzwVplHDFuBnI3A+FyJ4NsLDWiWZxWVMMy5w4cuXp+pKghA4wLFoavL1pLuIorvT4YiW0eXsGr2v/mD2qvIBAMNQojPfaIyYrCwOmiahRNgi2TT7gFPx1cKa5EbArcSZHNelfKZTN3HzxWvYRsbOCy9cuqTnpAirYLJxMVlrUWa/Nm2G61mk6weAYctNdrFDIcHTm6pwlL2L334cV8ybozf6K21Ar9wJMedH3D9REXS5u9tQ+QPH7QOe23opXAF6C64dy5z+WS6j04wGX8V6RsrVmnrQ5wmV3Nrxqe6UxHYMsGXAAfuS3YJrm83LndfrEzyC8A7X08ajmBX3G8zrHHfyXnzFOC/OrepfFjQ63p1tEojuRWgBJ2QXSAXHACp9cgyIXnhNLLYBf7BMwvTLpeLnRy7dmtsTOp5bGH43dih4P9aW16pbBx9rnN+9DKnbJSyioYtLHNbAHEW5p2M2paNVSgdWv2YHIS6UpmOj+P4gfTm/2z90ZzM/dPP1joyJ3n86uGAVOIAUOJbuumogHJ6gig3XL0lRscqzbRGq7Ey0m/4CnSEnuKp6DS/JHr+pNHEyNmMR/PJwpxJRkf9RLMOhGXZBGBOUO7n91+zwu7tq/b/vagRXr7HljeNCF4wOkWaNFQ912fnI6PaQWtoBYhbS17+CuyuPmp7oDmYX7oIa1s+kbZ8ottw1NdpDlZs1+1ValLdCsvCqJw/BofNO9LOxd0DoXZ2lwIgolRDGdvEZVo1jDJmvvNO6gb3Mi0QPOpT0/IvWhChLSD6Kb7fcD2OlkSbdGhPKxtPFSrrp1ZvXPzTGe1ueSV/XXEI8qMitbURdpCux8/8cPtN8+ffr6v+w/bL4FqMuG6cjSFDxqXKl/SprAOtiKjzRZydv1oaY6ROkV1Grgt3oY467AmK4tlZ811yDF3y33Ec8EwYDufR+nUl69Opw8duu5q2Z+cS2tqLjc1nE/Hx5OjxanCOLPbsygqPOVvsFPslDjBjrGKOGY/a1TpZlASQcBDHmnHTOBs8IFfYh/kX6WHrUPWftmD6zzwl+0F16vWo/Lyxr3nHnoYnX+52S7VvdCVreyyO1B4vqjZEXGwJ4WA5RsAxqyntHjGBa7nY0GB2WwfxAbavfOWD53f/tb5PYuvXvriwKsL278YZLP94HUT+LPkBpoVU+4QiI1b6SE6Rw7RNCtyHSyI0ECOjJFbrDK5HQ28CnpzDqvagaCwVFgsPFhZAwF7rywzMMkfQJjccZDvw2evk4ZsDNPhcREEgQaKQnX2M0Aukun9FQGF5i8aeHp2/QJal9unuCC/lE6M3kcflYtJ5+kilkrmx/xxxM9UcX8bdwc8JpvvZfmBipAtsw4RtqOFNruejlMAdYJkjwychzfXW7edZXOQ7RrRLZTWcFH2Z22/kNjTfdtzt/80+fyA272/u3sQxI5vhcWOp6rtYsdcURYBa23f8nsl9MAK9FrhOOT1wCOUZ1ckrI9+V/7FA8u3AeA9q1jRSnpJ4oXtmj4qVo1Ir6l13ppnBh1XZNeVLtfT01vXRKoDiChMRJsj5GKKGxOyGtQ8KruDq6NUkjezyjNgLohQHa066uSlqi3Hwb8Z5TlmAHoxqzpNLUTqI5ScuIrKWiYYbUdz88xgZk0JAIgYqfqAT0KeFCClQGGAG7mt3o5nuNku+M4wfj9MA0sfpxfvftf7X7n0O9tPnt/TnX3pU68MrD+3/R+DKWnHMUQ6kTuKwfnppk4Vd95N+Na9uEUiUCdIbtb2ARAXyCJFZwjX+nle7PwWvYp9wIzTd9Kb6V5iIKxkaL9KCzBBs/b1JM50WrRBlQ9MvbbCYVNLsVJWGk7M4GAIXmvVk3c4YRtFpkNatNwr1YJ5dvjd/D66QCsEcN4OmVzHBniVy+Yur7OS062AhRxYd+4yu3P4B+Q4DvTAdrB4TddavV7rafpnQHdZgWaceXOCod1T7b/7yD93P//iwB3dge3fGWRh85hcj/QqftWvBTXuIadUzfQHWiUHDk8L9Nc6XLkNst9cnK1lfUDYIBvokQ0GKBQVdyVyHKsOTOxCggizrNb1sunuvf/L30mDMUZidhmunbGLIFhFzpoxXKOQzSbU5OSX4jdirKqycQnsnKnqFAIG1CVk8UAHpkTuUikyWs80UxzXvEAc25SbTEW1TgXa/eRXXrny2T0Dl25ftjlokxF8QO5neS8eNnYucD7NQRCN29MUe1qUC/Ej5Pu4+y7uCgbJtEnRwwwsjtyt5sjfQZZ5rgeSp6K1+/WGLQzRazDXQbdPdP/m6T2dH179VPf6nw083f3Y9jsGAVQLFlb0sfFiLjmdT2cPFKeUeX6EqqwopYsz7RZg+v5TGcidtsUgVU+G5r2zDfKtmsuWapEfBaFXKUO8+rl+RxO6fKVjukYjsZwr8xJ3vbBVWgA68xU/27DKCPKwYdfMTVYPFktb3n29BU6HuLiBxQzoKIuaNrIwxv+/lwYeeDjCwOw2+EYOB1dlhZIjImbCIpN/tcMkSCdZzaDoyY8Pctl1CHdPc81QhakFAIIjWRC5OjFwzs7RLKKF4qSSTE9+8pOHv21E9gJdoVV/02+GnaXTrY7rnVgUFAXUTbjAR3++/dHEnruev/qpgc43AIZtEw42Bcg6jxV7ThTthHToBp0hc+SreM4esQ5af2jPG3eIRC0faY5e8yHt5BY4GETwNzBTvd0Jbm8jw5JawlV7i1ZF2z3VrlZgKNfuka363BOuX8XUbTrgxkTV6ajnlVM4KLYBtIwgW5N5aPrWa32FYBTjIgU0OakbJiambWJUNDNFEI+6yWr9YJsWWEOcw93XWaGsGKYpSlMTGyrqXr5TGizr0YTY715tTs8fVXOGWdBH0/Ps0ApKVWjQT12n6TSj+yzRPlNZabSWy8tll5V1tPuL23/wVF/369sjg5akCsCgw1OF/MzUxL78mK2ZmtxRVpjAgB7qkDWL9L3Rre1Rv7A67fa6B6Tk7GhVvGWeFQ1PyL+NQFGJPFmXILHY6yWXa0H1gFWVjlGyHVNojkn2KWhKv12bNm/XEm3jpLHlfiuqAyX5svfVr7rl5Yfvf6RDkUdBJsMbooJf9IuBKmVzvVdZ8inwslxpCpFbAy6Wm+blh4vCgloygEJ0z3Dzr3UTATEj3dvPCwbaPbf5zJ7uPecPPwom8qe/ftMglc2/RDdyO33mR0iKZCRez4aYqc5hMmvOWzpPwRTYcpOjTafSujk+O7kvf8hIGwVrCvzTiMg7iepkpKGNqZOFc7RNH3AduSuNuKzCloIIZCsFB+faJ5nPIdIC4bfZKluk/0Jq9lb4PDvD7hRn2D3sHtHhJyUjdfrlQmqBFbjuwPxahsWphq7aeWwwMsOEGxcZNmdfJ4N2jsxLrNIKRn/OyFqH9DnLIDPsdpb2zVPWhr9ZPwXif70cVkvLUcdBi84K9yEjUsce6qLv3PLkntVvA5i8rnvboOyo4biqPsbPOneKDbZaAugAO9xbpV9YDsqlplthi+KMujy1mqsebWedtDsdxA1kkWkT4oBNKwVjtjA0bIKfBP1qZTO56eJk+hbtK8FRxDWuSgcYzZey1cRKcj1/MvMP7t0t0C+9T4gC7qLe3+dhLmehUdGrtlBZBmJs1pw2rjJzIisUL1v7f4S9Z5Rd13UmKC66pLPGFuxGqXqmZ7pJtdwaW3K7bUvuWSPJpqhAkxRFiaKYwASCABErp5ffu/nek26+L6fKhUIhEAAJkAIYQIqkJMqSSDFJVLAcJGs5Ta9pv+Iqz5rZ+xbl/jn1FkGQVa/eveees/f37fBtUq5Tz647kRNzsA3eKZkAk3GtmJPBJwfXjVTtXgH7zESZlZhCHVPXVcYP0Sm2/RtFOLSytVpvk/5qE07AZmvBXdDIrvpW8uZVg19/4+qBsfUXI9gSB4iVlW3FnCqram7MMrR5DNgBncbi6gk2Sfh0gQ3lWYnOWQXHdowK1v7LChbkgJ3w7KHYWLCwPqSeljcKAF/ykGzI/fIg7IoxMRE+xI4QPueP13UwAbwvF11Jg3rc0t6mifG4NbjaWSYsromhb/sej2MShawzxHo2AHQLeMMXbZJNqyM2hAiWwhVGq81GO3ZP0iXm8q7eMgP40Uj3WMhIjbphgu0ziRe7YK9tIKA7xT+2b/uZpfu7+yNCb/XNa3c9t629svvr7kuvDb7w9AM/HP7FYG3r4yNZu2KVdeAkDh6CqRlKpzPlmcqoYwCWB8RiTtI5Yh9wx+KpoFAf941q/uyREAWV0EDQJpDyxOyxZUke807WgWJGYMjL2uembxk9Oj93rDTJ9/G7O+PAQTOLVpVYNaCmsGPiCAtxGf4OR1EcLDDUbRWluWSZyIxfaeSS8onJht5Vzmfx8McAxVb1Fj/ptmGtsfocbvMajy8AOKv66x28Z0BnbrXW6kT1Rr//hKwL3626CQk63gmv49bY15zH6Angtk1vlV2wIsfPY3HT8D/pwmKwin0ZoqAU+ChEHlU9NIOZhiM0oaGGAfYZgLFRwn1y2iRXPjeS0Jrt09iuq9gTBt+1YVeXaYVp4GbBJgA2VAk1AKrN84Oiqs+oY4Y+lqnoNis4R82sl+vM95Xj/Azhb5288mK76zO+YJFdf7D148zuxR9e/+LgY98bPnN+6+2Riulk5I3iEK8giGT4SVln+8P29UAqnAf4lDfjZgRtKjXNpYHAuqBQtjx/GVG9103Okfql+mZvI2k20VC0vKHIDG2hRLdZHxJ3kofex0qu09fbYMPhuPIAGyQxdxCLhJ8D8tDlSwAC3fPmE+qG0WNUq8PW8hyAyOXEBIw642KVyiiYUWLac6ZlwUECkwq2NoMiQo6NF01T2QveY6tgfOi3rSfsK4T1jWAIxQbKnOhALbBqentm6z++cNVzr1/9D1vFkQo9UtINh5qWTYs6K1XngoqLml20FWGKz8OCm8gLnMhLgMrVDHCevA6uhkosmKeBX/UiCrCawHEA/1RMfD4VK57G5xxybPuzI3rFuJ/dyb4K+2SvzEjVK0UzkbkA2wB78zzPx0oFQAgxYFarOmTFAIb69KRxOjjjLdGLZhX7NTBwAYZLWq4tCpxk37vrD7a/+MLW6cH7dw/2vXLzz774/O2v3vLifd8EcxxvnRjJW/PFFLaloiTWLLXU0fYjm7DYXlo5jwEaAoa5B5y04TG5TIZfEg3YrC3HtXwAV05Y9HSH3PT/7AW+5buBu1JP8IgIz/cBcP60WWt1kUHWawjekjpqJlwBX53g08VC4aDO+25HVnlLxmT4WenZAisKWY3XWJ/H4hRvsQZgoFCmvcsAun0y/DyvOTZKM/EAg/cyxAYC3qTwy18Ck73BIi6AGUjL5zwDfOT5ece0gRvMyXmsI3YPpu3nwN/SRlFk1I8IIGnPwqH5HP0Ke5gKOwvXyRwbCyKprVmqWbYMQ4c7MtOYiWs9NFemZipHR5jNYZtxgPyAPE2Rc3M1wCpAIgxZ8SivmCUjlWApYR8giQzPTrPlaZPHYgFN5HIlrUz3sYjhggXETrQ9cS2XLY4yHkb/9YdfGL5+8J7BjSMe7wEtbWqnj7Uyy2NP3rV5NNYiFdmVmzbnYV6TcKfJkB8u+L+qOHJ5WEtLUzCEGDLf8YjjUkw/yom1+y5pcaVhhsfOzi2XUZnBx97v6S5FOYlc5Aeev7HUb3bq0q2FoXei1652a5HXbgS+SOyImNXyggNstSwwl2uD9zKtz9+HbS73Hc2XNKOiGgYpV0Q85K76f8vPsCtc4uNhCO5CS+bArmHPruKYwCbh6pnOzNIn+Yf0P6CTzpedKWA6dFKYbJLOCjswQr1G26IrIh42pCsv8A3SDr8lrtm1fWLr/83sXn7lxte+8Pqwf2Vre8R2qGHlzDl4ROP8sL7976x91l521BsFWCOLYp4rgIS4InJS9ffz6dohjOxjbW29EFmBvUxDN0ICFhBRhf1XZYkdm2JHwMCpWeedNqznP2JW9xmgy+ck0FbZ4V35rKfKF5HVP+Mp/CJv4dV6fVMRXR7C+sPtT/mltNSPAWHeNfg3J175/BuDv3oNaOofbu0ZOaDPTWeOEC2vsSHAxtzSiaWxvUPsS86Cfi9V6e38GB/jdnK/sATuYpQ3MsHSi44gy+AQw6YbpsUzw31wAINPsoglInTrMpEJLnr9ArDfbhAnVRInoQk4Is7Kgptz/4w/wO+QuUgDNuz0USsTkbUXNUVAkueXv71yptnbPFUL61HbD+FkRhPene5X/TXtD5xJ/UtsgrBZzupFEuo9MdSDKwngC3bZYvQTnvMuBa+LDXvVWWKn9RZzsS+D8DC7qcVGmK0ZAEVHecW5r7zv6ME7TQ3OlGQddV1vE7NpebDvk8m2IknZZeDcyK5POatXLbw5+L0Xrx58buv6EQreHoibzQBR5bRcrlDQdMPkGMN1sRMbbLtD5iwR8o+z7TsAQxVcMHhxLipEZpWvorJD3UXRNGzYQNvkV63XjT5z2QJbYpdEVFuL+364uNhshkHVJ1WwyC6N7N6D4XgwW7tLlsMH+aeMQ3bWU2tWQFulUBAs3tnBA9KLql5HAkHjr9jLDMW3Eta2Ttl1VNU8iUWB+acwVOZ4zDO6pYVyHcCVj8QCfKkkZnDYMwBUD27Y+v0RystUo3lLMebmVW1+6t1GQ0stVSb0yeJ9sN/3EIA7tleKj3VHm/AbUAC1U3rM2Ag67ka9HvnYvwUgkq/1k6RabXbDxAsbbS/t7cIWAq8aLidnrCvqKrBxmsoKGpg9k2VcE29mGTZdoAaaX0iO+XM2MZlq2Zz8xUdHJK9PuVg0XpFqcEw5oOaLk3NT47mxvG5nYN/q2DqrLdK+tx5/s33x5OlaPfCAjjt1XHeJ1tm1EzBERGANJaxfo4iubaUJF7xL2/q113YvvP6F14BbTWx9GZ67xUyhiEOpRiDqAJVtnxctIE4Amim1DVUhlZJWRltOTXAFGrxjls1xoP+eLuZpESh/nhUIL9IDdAwzCzfT7WutR+xxtwCM16QelrvDPcu0uoRHvNrjTcI74LVC8HuDj2NBVh/sbMyrhHebxtAi8NAl67j+qHys2gt01o5jLwoaAAY1o9b1Ai9Ky6CiZeDMJ/mmdtapU8upm4uFTaVtxeMbmEQ3XcsjxWrBPxqRrCe4TUl4/UifNoxurl6RdpyNCp7iFrr/tXTfbeVZK8MngynfkrMNUgl110YDQ18fYuf5ORYSVg/joaTeSZbCflgTa2B3Fgbf/+7Vgw8M3hlx+MGHjYpRKWSMItELQwCdDpkAgu1RUeZgE9NCZ1NYfs6bqxV2onlgqXu5utbQenpi942zbAmoeSwj2fZ6YFWsh+m0f5Sgh0VQJudcLHvXpO4VqkfibFiINF+vZzfzTZ/U3MSN4npTBk5sth2rHJcS09ENIwB73xj9Fn2r8XPi9gFWREEsQrtK/eBU8qyMZU0Esl49I07yPhezkmTAr6PDZsyKrIi6lagS2X45LAeuLHsqbKMKJzbcEipEjFlYjW2mUaSZsmE7zDLTfjMTfN/gvZMjNTsxsROzpYLTpqsaNhSX99AcM5xi+UaqWkamTKbyBWPCvs8cbeXX509VX+ic7JxePXVqqdfoeV2D7CpjwvQTW58YOaAdK+VLiErfVbEF649NlrpeOGbO2wX47V8l/Dq3FtzpHvFMb9zNS2wesjB5scRhiaIQwJHdJTRky2yZvmot879CmoB6jtiGWOsttY6Hq+E39RNlUjd9p6q1S00nAQwdYLMmkB0RuV3OSu2Z1cnoWI0UgntqKM5yl4MF+jd2X7vq+EtXD/5k686ROUdzxor3TN1/T+MzfknQeqmdo/4itiGxjnzKq7vn+6SX1FzU6Ii/wlT72Ggmm4Wzbk3AEeNci8s1tQG+k4dazEK758gZJwtrrSmWwQwPyEK1UC+2stRaKZOeyuFAJbwGR6zuHgcL24mafqcd+EkShl+72Hwi+zpYSobQ0XWqyJQpeBAryXYUvxBKd1xgiK9kE8U2aEYlU6UJOlSkpVTHSCR+4vpRNYo63eOdTQUbSKrATYSIW8RPdpIvTkB9O2aoRw3HyhR515MoOvYng5+/fvPru4eVwe9s/fUIh0eGpgRNjaXaBaBZZUByZWPUmnPy9iQweDx495oWtZmmU/gXYMIKoEEaWbEJxEMsiNg3ZwE40gIYnjydYRVnzL8nGgtnZKE5157x7X5pPXfWPlsjEXhyYCv0OKxEFe5B9EQb7sgz4YQXJCkJTRsqlcZ0zM7aUo+ml9TT/FXewYJjEYXfdbFTWLgev8LJN98b8jjCHhyOum4c6IXHAdIYUvMOuIc4OchlNISiPsKVYbjprdf/UljHAkWqGJikukKv3TUav3bV4PnXrx5c2fqDkZKOnYrU5I6nVafhhM+IsqiA2bb5p8ESM1qmJWLuUwpHsvOVg8Y4PyYo1xIVDpbdd7r0ZTT4wRnZA4AVnw66Yc+yvLYH4GAqyYdwStMqI4whYPsMsa3iYUzyw5m1HZ3mbFOv8IP2vPaAf3vzvtaeEzNPa2TdWvIX/EejJzq1KsJfFEBqtWvNRqd63D8tsY/RIzJkP6GbdM1uVlYAT9ctkfWoXVDJrge2/jRz1eB9//3qn2z9xgh3TSw48eHE+jzQZIEVmeUYGpIAOeftr05HR0g45heCsWC8c0f1UJCL825R6p1sYkV2LQ1t9QApkMDvrqEia225efziXwt5anBV47HGOTfwayJCNc6xTprow+ozzi3bwi/dgbUtH648krm1cD+GSVGlg9iaOq1mSPaQ1R5STprNzA+1R0sXzJYT0QizZDrANrKrtfXBzO7ei1/+3hdeu/Kz//79m14dZoPB1n0jhmEfDsCqCYs9RIbb7DbbY3ezg7SgT5TuA9yUVRTB1LbetGvGqrEGcPcE4QlwqZD7BhZRhraryHlPtcsZS7d0Dk535harQsyyXkHxBGudNXlMW7RKhtdplW3SdedF+yxgmOGXkILAq2l485wM1/OY6C7Bj1kq//QQ34NVB3BNAM5KXBWzye2hgWgAHYhreEZzql9elcflyqO1ZTi1Xogq0PE46gcIpLFObwKL16q6xzEow+yEtq5t805tKAmiNPHn+UHQ7y8+HS6HS/XLHAgtY1E4+ACLaN83nEXaNRtaYAIESytrODalBqqhaWTXS1tXb2lYI25T29IVi6oYP7dgW+qKoc2N77sbQ+2f+c7EOik1XLOcKDHDAnxBWQm+0pYfEzip7oFfR+/JAiMw2tnv3Jjqw9q+SWLV0IdS5QowLscO2SZ1dFXTMvPH9hZLul6cs1QtJ83j86RfjN3jZ9r9k+eqjaT+zJWkhYIfrvQ9zn3LdXzbpaSlXtjbnXLtC9d5qZgDhgYSjjHsehWF0P0AjIMb1epqQl2tZtQnL02dHt2o1CoJkFcv03QQNNpfe4l0FrtLWEK0fprVWM0Ki4DO0gZnfxr5/67K9nXfkC9tfThz1cvfGNz+jasHz25/ZMTnJzco8HzX94Jqs7nJw1QmzJeh20R1NX/N2yTBZXpZv2yv0p55HLmpbMtFLnUst0xVlrE0hugV3boWbCCm9FWW5aN8LzzcCjUoZpIsNacUy7n5TKZAZnMHS2XXlGpsx1bNXmA9+qi44p0VdfE8sG/flGVOsHTCNA1TSOugeZBZ9DZ2kBfgSdlCg4c02jrQyJCo7NGumliP6kmEmUhfNOAot6JHu49urJwkYcKODaHxBrrxVeXA3IQNmwG9+kxZty240ilxWFTc+ZDMJdlwvpEFRomxOdNBCRtNBbSn+jp2XMYFiUQbltruFFbKj5UeL7n8FF/msWi4CUCcNA+fNlDyRoK1HIfr377t8p5vDfJPPvD87d9EvzQ3ODVCdZVew3g+j+5iatTBHnJwtmT0yJBg9+xBjZBjY2B9eW6M2Y4qiugwPPBHNq9rISWJU8UKBXEmwL3S8/GcYuMfGf5gzTvOGrLrfk34jmReWhMAP05XrKqIg8iHi6sT9KdmAM5Gh32vAGQ0XApvVhyZxU7V4Q+C2RAGrPL91BTEfu+wDwTcrPAyzzsVRhSaJEPNhqk1281WFDWbUXTpeeCHYTgURusbYSjlxglkAc02FiU0WmkdILxc32JpotTEahds9EewGsO2GSaYiW1s/7HNrx3+Nco+C1bcZvvActl0VlIHfwABIGc7IbA0NqhaMcrGDRs8d5z23Y77LOuJmkCBwIA/IxNGwOFi6cyv3gQHuVhI26j+z9/+8Q2vDDpvDfj3d58d3DmcvTh4Y8TmYCSAYBgloXAVsJwmSpIumB3Lo5FsuB4NKsRXncIQ1ayirRhZU5neq2SpbT5Cy8m9AeAGkdbd93NNjYR2qxj+qgJ++GJgduwe6zJPVH0gsBKJSHZHny7ikQfeJWKx0SNGpxIMVYKKKAP4tBg2el5EsV8zrXbWw0zH6jUXsXILf3frJJzOoL7uJkQGbgRr7InAX/K69qredSInNaXYg15stCK3TgCyYS5KsvN2i0Y0wCegtWhYOVeg2kVid/x4yI/DsFsL/arsyJ6sub7v+f4Cb/HIiHVXdcddgxE4FnaFK3xGLSlAZ1PhpPmMbRhlo8TpztMCJ3gNf1f0Rlii7O91lfZoWI6KruGXqwVZRqlkRSemZTgONuyUdJv//3S5bf/O9nt+tPXfXt/912/f9bc3vz380++/89tAilJVZJNhUiATZ+t6bMJOlz03MWv6UkHbVzhGzMrsI6aulKwCn+JHvEo3Xy8LjsSTIZVgcNZswC0Akio0L0vBDCojmCmjsj21Ng1O0de8nDsjS+b9Zl6fM9SKXbENXvRKWLcLq6CMsTKhM231SbrOTLsbhDJxA9kJFns8AUcHh6DacK9B7QDp1RbjS/Q8WzPPWhE2G2BUGJ9WbCd6x1iXsQjqQUPWpe9X/QgHUgRERnFPw/IebEAH92G4GvgSHUhexVMwjjsfVmKsGwjq1U4ATDYVxUSTNPwSHMW1eCVa8tacdbpktMuotBRh9M9x8QZNdzIkRc/imsBco+oQHb4FEHnX4EOD6uDzV21tbl0/wqMJTzdN2/YtqwzuVOjCGJvMajMV1Zutl6KvPJqGZQxX92arGW+Kz8MWyBqKrdoUluTQnGlX9AP7uUNQERD+FzwSXsF6ikahXnJpwJvci6uBJ1uNZoP0+3FUC1Yaa25Xi+0zs4vFqoHQHPY+kIqavmH3KHnC+v6VxiJ2AGHjrJcuIywfStel4eUdRTOExqi1/MzKjz716vD1a+/8+siwIj7KDtNZhuyDOib/kKtJS+iswgqMAZN0sGmU0IbpXSO5Tz2KyTlTqLKipWNQUsBDFVqxp53t/0UexdKNW3mRPmx/WbBHjY7Deeyhxg3G0xW3gQMo3A3eYJtsgT3Pv8b/gp6yIysp1FS3AawPqz2AMTl/w87yqv+U/xx36bP0AqulnTAIcCO1YWBiSeUqy1FwU4YN5w+PnMpMXiS7XnzlrT0/GNzw1vXP3PP27sGeH97y6vAHlrc+MqJxf8wFkp5YHXbWScQFsPS/8YTke4b4HaKcALbbnZaG74gaUfQfNTAQQYB4MvSAggESSH0boDlMxAMHI8MfsGq0K88QuVljQyFr0gYlwx86bb8sOkHdC3wZCc9ZsjvcRcUmM2BMZ7P2Hn7YI3f7PmMx91iC44REj7eJ2CgtDBk1MwEIIYsc40SapZlwofMVSr1JNyeuxyXHvou74cl/US9RxTEtuA6H7hSVcmaiQ7l+MLedGfkSkL4HdVj5CStrFa15w2aWYhRdGWTBp9HAxtkmGNyuy42QPFU9G5wFs3x9X2AuZI2/TDdYn3UY8nE4ymBAxUnHt4B47pdkn9x+nyiAN/nJ1v5fpqXW/XfeGrFYwQKDyObMVD0fiKVBx2cNrZCp7Kdj8Iw0zEM40TFP9ctLk1VrQe3ZJ6K6V/MQPYB55oFYX/YlqYcnLmMRPHaIS9/t4PgYe4VGTjV7GhslS2EhJnBmeYmSpd8bCUtMUeaVed2YUEjeGNJjwBRLfMVv1RtxIkREMaOA4cIGHA1wzPCsyfbv/MuJkd57T/PYvyiXxUlvwSNnwyFpgt1TvMPhfbLi5vmXnSJVOPUVT/VsHwC4r0eM+LxBsQWkW8XaDr+BFdpsA3NK7IqzbryqPFv8HqlcmXlp4vFy/8hZ3FiA/r1KLRMWA8PF2SI5eBoVnWhmuYJn1gELXioXpvKH84dnbmMKRx0c21LnPuFkiD1rTdrz1qTQzFEnTzM8C1bc9g0X84qs7jyGo0AAv9axNtGNsHDEX/YWvcXgrLcErx6YgMG/HXRH2srCWPtIbSYZA19Btz9eLpiANqTf7FxpnmkuVNvtto+7HDaGTXYt53++9YFfXrX686sHf/nOz0YUx6F3P/jx6wzjwMOZeYBvCrxoKxcriSb4guPJekJCAFoo8rKxDn8JLj+BSaRqXIOvdgNcaztIRAdYtONlu/mWIwo2+c/bT47MOTnnNvUBoxXfM3+sDC5pjEy8j3+Z3uh8wtl+j7jJL7o6RjJsgx4Bi29EamTVjGfYsyHxRUe25FPBL9sXwE17IvbrUdxJVfUjWI4m0HifGN5X2ZhdoiitOencqk47BpsHwi4CgGBoXQA0E4GVR8JGBPUS4d/pyKF177xbZw1a873ES8LQi5Kl6dW8xKYfJhz/S9YRi4jLQ+IUa9FUIQTeCyYsEj9qNIPBe8STHBalFcGRZn3COtSzwnJHslv4IT6Ge3fXU3f/cuvZt68a/Po73xzRwKTqRS1HaZz11Vg5Pn5xr6TNSru0OZuq/qMIR2CdKybwGRGG2QJwsGD2wR00nUXwnejJBZp7ATRUZv39feR3dz1TDi1XCyysZXOxVcmQtiSqb3HFIT/ZXhtxKFL4O/NjB6fuMopaybEBORZs07GVPZhFQmBInKI96ozSOe8rfrZ+x8nbzk1HVpTK1KJGemA2ncgma5VL9uP+m/GFU6uvtZ9gK/7z/lP8KWvTOuvzwuXC0/Nr9y6RqXrZPeTqKGIkDf8hrlnkr7evGvHtiEasSwMjHm/c599owos7ZkYfF+W5nKbbLOcAAM/A4ciBH8qEo1XLVWvHzpS/G307/KbfXXxi9dmlpSWHNNg5cJRk10L2td2PvXrb4DcHf/gPw/7g6XfoyHSlVFAmrbJUo0wydaqykbQCi9fCWtjoujW/H9QqPaI3HPFIlRS8oe2Z7Mjwmcl5pcQLHJhIvbB6JOSPbjTrzRriGIlPPGZuqU1yC5aLU3QcmimSQWf7KyOpDaRlC6i4jvMMvIyX5RW2/R66/e/YATjfurlXOETa6ripZ6dmKgd4htuiHMzW5jfUs5Un7Sts8D8DPGKD32SrNKEAU2a8rItlhaatYaN2qksC1l9hKjGu028K/7N3R/Wz8PAdT3W1cDbOxGXP9FIctzYGDwhzQYHTUzR+2jitr4hTUSQTCYZWdKsBnJeN9XqX1FqOkSwlS8Gy/1hw2X1JDH6bX3C+60RGR2+YrgaU0HKIZcMRAjPxjQH97s0/2D24/a8+++bwBwfKljNCWUH5V6rilFDUSBEsMJqAtE+DswfgHhEvDEO8rgjLXFvcdRIuM3XscCgHOrj5gsWvHfz77U+PDF/P+a3sM/C6AYj1LM2h3OuwAi6PXUNT9Et0Q5SGxLivdmgLSGvfBU+27q6IX4jv8cGHgRl5PElFOtPmKoBG2E9FRUGSvLxLUkq2P7z9KTiBmoP1hmUU46lYjl/yFFGOHRRT3BFmYzsl7gHzHZw9V0uwoi/N/fQxVYIyzG4S86jSrywyrgVqoIocrNE26Q3e84W/2X+8883h3xp86Z3/bQTMTCnNsNvCcisyhn/0JO9YLB1u5U56RsMBk+SBn2kaDS9uYLFOWpjsA2mquT0nBry8wsCjsvIGTzvLcWBLfgXosi9CLUVwOPkgj7MIK6EjMO/ombpuGkzxK2jF8AmFmovlE0kFSPv2H66PDPuG7ZT4HK8IMI1k+DbfOXkUs7etWUCRZVdxARhK7OhTwUEXRd6brgLo+EMpGL2W2wl+l7bSIg/PAdA5fBsOKboGPFOQSrkK0RWAT8FU1xzXadAmgJoq880q0mOBWA9DQKgGChwOUJavttQ2xmTg/vBzAPYFVqTXy9V0Clw6VtERJXHUxbgFAPY/eeGnVw2e2foFtn45FvyjaDgZTjeQ8KUa7Q78l1lWx6aOjhL8Kz7Z+dzM3MEjhm6ULc3WALfr7b2R4to4241Ia2l2Mbc+uzqzduxbn1ufX6rCLbmppKdww2o9vgYMfSD9oEFDta7WbIk9j2agJ8fO3f7cobUjK0bAcBZPUm3UTqyd2dxYW1v+xjfQZ/hBELTazMv2sz0tLitkIP/LCDhgr1LP9kw/SwsscG+945bbm517HiqUyiqKb+azlg50jem8xEbNoDkZKL6GQcvNY57uq8uzG3M1rVOONbI+celgy+wYrVojirywDpjPBYzgRTW1/uDpclJoGAEpNP/4RfApwoy0mBRa3dbQ8mK9vrKw2BVev1WPl5fqoSclhlRCP21A3Vnkja2/HbEpSnfmMsxqFQLTN5HwfuPWtemNiTNHTkw2KomC+Nw2zCNThyZuv+PYfl01DKSqDlUrapkacAwsaYIh0arl0JWMOTU7vqbGl1v9Xhz3F5rttROrS+uLi52lRVSHdVPpufYFhsMK7diKjboRHTw5szCf9kbrgR4d3RhbKSd6oEWOS5x0khh8A4VcIyUGn+Gr1bJOtmfB6aT8j9aM5Zm61i8IezG7MteoLM+Sbr5QHNI0AyOs1tjk2PyBCVs/PPngIaUcVXBTUMc2gjKY1IbeqnTDVnDpzPpaHLfrtXhjYWXRT7xoM5UB8OOgSpqrpsWQ/IRAHqM8dkDyEqz+PY+38rc8f+uV0M4LoggDrM/OilbK1AYrpHmCG2TXxuC6f/rY3w0rW+9/Z2bk3Xogb64KSFVm3BIjZWafGKIdu5UaqbQ1DO/bCCx21J5xuKsXwQNZfJxgk+y74yctwtX5ytB4fjZXzBu6pjsolZM1dNs2FFObOySUpcJqLqRVlwQy9MOoVj97GlCWC38NSa0+NHy9HBsaVuR95v+u348aD27Om+CTxpRTZpNumdvtUsh6TsPpRASLVNB+AZMCtgoH56Tos2VWJ3ShtjjUXPNDpHiBu9poRE8/nYZhsQLW7T8l6sHz6hOjzxFgR3E6U5MmJie3f2qkXqnf40zZR6cPTioY03P44PNDHbcpI5185F+eAI5bdh4aRYVOdEWWZc8CuHdcC556OVJa2mIl4P06Wagn1bATNMTaDgVEuU4VZUuTYw0UyXp70Pr54Hf/9ke/+NiPP/23uxf+bvivBn//Tmdk3KRsj/yiLPAjNhn+fpHmqclNVDMFn6zYCo6shA81TfBUeV4Utq8RF6O7/zp54Em6gUooy16L/wNd5Uvghsnwy5FcCjGQ0Upgv0s3cP1qi/nZRa2qJ2nIQsAimEKzMza5uP152A8P0T10+381N/gtdoYdK02D0bDhk1HTGYi6JrfvFIzAu7Zvob/H7uUTsiArQkG4iHrpkeWxBf4Y/3nvkkdW5HdqxyXZlHVzCBwPjyMXp++Ihhe22Cp23thSiYwA5RvnAHoSd1LOXvMg+6qxfVVu1p5ydEZKVAzeNyS+KZ7hvOW02AZQ/hA+KjJqsoWzFjA0K4FTBqTa1yKrZYOVMAMjGJMPssNMYyZ4dJslQ8yna2zNfpsbvuh5g8+EPbEEziNwqnbVr/KYLyRYKy1Fk7fFSepjix+N0OH+c//vB0/9w9VbN7zz8xGbFcvFUrFUrqTiCQ7K8tqmTU372CPY7gT/wyKWSbH9ohIYC8Wq7rJQxDIJ6g0fvgRPeP9ENSCJv7KC/Qxu4AdJFVxZWyRMGuHcghKUTLAopRFNu+tO01QqhRlbNeZdvV/sFwLR6TSb3Gr0wrjZqddIvV5rAnRvypYV2P5Yn3KDqsjlv7+dA/BkwD6qYNRTs2wb6GeWK3rZKBn33VuaM1Qla5aJWTbKlMLHXG+MafvcaX6YT3oZPx/NBNnGxE7/MeEsUWrl5amV7IqKgplwV/abvO4FsPQuX/ZeXDu9QurJKazrkdjWGgR+PQg8v3n+3TSIB2bse84i0V80LlrLQJaq4JYX5y8Xe8ce27N4W30a1gag4IX/OBLZie3TxO7kgnL7QPuD/Cb+MC0XjpbGDT6XnZ6/N3PAInnq8LK/v1GsFzbNmtEGMNq2v42jfkQAQHq19b36cdK9eObyQg2H2kR2w3SCutHSA1FrBqGfdpAF8C5AVLs2n7/zG0d/9qXvsNeHP/jyO+A0MR8FnLkyjwdM19M/VYkBEWFp/NphBeOc1NJmMn92DgyJFHWv6QMGreKIrI6fuE2wbLg1g7Aqw2gpaYTw5t/1qg2MT0i584+4FtAgUsUqTZSF/yGpVKZ5U3O01IJgjQ8xLF3Dh+DoqDYw+K/b7x8ZBpcVRu+uNpB0m/uh6yeLvny3jjUVRSWB21jh2PzvppY6/YYJzqvcYELjJa6VNR3gt2MjotF1S7cM2M6Go+ZQUZRh+ZBZhgdTIZYqGezDAp03CyytTUVPKDRR5BTTqzhOlYApEtcI1BMHuPdbaC2rcFwTXIl0GhBYwyCdH+J5YPjhCSwQ3pdJsizSunnCg4Rxvyqu2TX4nvz2oP3D276/e+G14TODc1ufH/n8+s2H7703n9fU4uzc0fID9l46D8yvLDSpclvO9fb3Z0mzsJ5fNnDqkktD5yLruBfCK93+MuxHHE3tchaUSWN0beqs1nA2WOwuhIAQ4eOXq9hSsLmw1GpVa9WVNdLpoYbITnWYEK5XXYq73tPWirVKXbPuoGoADniYO6FW55dGO4djXU7wB+gY405eHy/tubH8ELMdMOGEWupDFHgZvyHIpmMacHo1QGucA1LWVH2iVLLJhHaXM1tT/fkFKwHztgwcvxtsxEu1zVrSXWx2PK+TkMW6L3FGR0CbRWBziRoZbhrEFVRase05iQrQJvDagaj09Mb8so1RZNM1PWIiF3LJYOYTIx6vqlh+hhHdgC80ESELHrFT1tq+5EhySN+bnSe2rZQ1ZWZibP5gMatThooYAPy9qU7lpdoLta+3NzdPkVYbdhk4Eex4Jbu2frP++iD71mfe3j14CwWKTm79zoiWZo4cPj5WKebmLCd7UJkvHrAyVAcjiV+hiIjsMoO1ecPxWY1FhZNmyMTUZpo+9Cy/XFODbESGz8wmOa8C/k9GedfeCZy480KhWTgXBUUz9Z06+NysklGypWPgQBmzAFxp5rQ9ZU+7D4dT0gqKQYXEWc+qKrVKe0eTFPX2nU0lciVQIpfWrCcbGMURqOu54D5/CtBYFOwkAdI+h/Zm3CVBleaH6KTIeMVw1is1ckiahBOUnhrFlgisd/bsE2zDI215KsENngoo8Ed7vdpSc32t2onq1U2/5/dYz+iTwqW9Tx5YGe/CQfSpr9f0iEytPqRMFMj2P35xhGvrYGewBQZ7kQOf4KyudIyNDU5P7c7HecAZDPWmpvX8kFG0rLm58fF8ZUzNmRYgtWO8XC0vl5fpin/Gf5Tz2irpXWx3V0IpEgNsy9Z7MiPD343smEWiKX3W0ntqQ61VYq1qBtrCqKdiqIQq1CDaRCF7aHYiN17Zy3Hkg+JPVysL9obTA57W95aDRvM4qS/Xeo1mtYaT6MkuVnvzxh9/4vL939764zduAIJ/01vD7x1sbf23EaA2FPySlbPnuYqTxhkZBpv3e+ZXOdnHdXOooIDVyssjdeMVTh7lMj/kHqAH9Y+Z1/Eb9OsZfHcaTM3uLNPFNDBErSywnVFxVGkY6QTzLMsJx7PgZwDHUkzhfBa5sAfvgls766AAYN/DGmccgwPfXRLL7jL8qt2ropZOzDgLHAr8nYWog3OscI3Bk5PhD6WmloEbqQvpBWzd3NFb963EEDowGMtWXDL8Z5osiEmu8HHHScMYsG2lqKWV6olYk8+xrPsNIl8Us+5T8kn3tLhM+KNVMXRCbLgnIjj3QAZdz8PBVTLs4UC5/Jqxo+aFwm9FOF9w9I6+8tbgI9/64qu3fm/w8ed3P//6Ox97c/jUX269PAIPX9EMyzasdCDHzjw7IK4GmHZYPj0dG18vGCKY93PyiMx4E/JmeUweEtu/5WeFVa2AwTLDkmeT0KzxJb/lPlZfCTcilW/6p/2T4Tl70YlF5AWoWO2QRUdy360Gbs173DsH1/6YrMsGYPVFxhAvoOQ0alxKX8b+ipd4ZLgbyZ+GZ8UK9s/AolRraTSjLFRRig/IgpsRv+uUiVMIx3E6EzoX36pR30uHsIlAtJsChzid4I8S8ZZ9Qe/tSPLyevFS6VTma4e/PnFcrY6tY/764ErJJYacjXQb85XIiwwday7KCv7XzFQln53IH83dT2yE3bBSyuG02FhxlOKd2h3GrdZD8F/S9PdGWUYm2H0mDvIy4ZWlXyigUDagP0pUm/lDcJGDEd4iS+/zMYYslrwnPZTl9Bw0DYs0isnwn4NBkci3g5ilU3WlG1b1hulPLRz1b65g/YfDiQG+0znHWk4XuxmUx+HnvG8td/2nG9/014yQ9oDLEilj7Dd0Y8we+D4mGYAZYP0R89i7bIQw38BpBWC087IovyQr7JC9RwFGiQ2bcAoeLjHMi42VgRhsvbRvpK6dOpqUk3ITLExciPOI9LN8hk/xHMNO7i5lCsVB76em2TyY9QLQlQKcrW7QGnJjGWJ1V3MD56+1TiXtsNbph36EgNsE6v+Dzhtbn/7+Vf3XB5+9PPibt67e2t5aGdkJjTFhgosyYKEr1ULLcuf9qeBArligFBuciMOnJ9SCAWBWze4MS3ccZQpFqZ2KXTHm7Qk7AzuGfQVushiNegWv0jriOaFlAQEwcAAncExuGvibLGo7mdIRfS8nR3g+GCoEYHHao8ddr3JCXac14DPPRierZ5LN1a/1+km1k4Q4Q3Mdo/d0ZQJXBDlYaHdjz6tWPSzLCEqYjnY8E8xGoV6p5oKin5VlarBJDUv80jACP3RULZCje2bvMY7aGStrjlKF3STzctYtejo4EwO2ntrbVyuQX+UUQz3WWoXjc7BBUhWj2PiWsSlb4nTkuSSdTSqafq8ax+nMkobAUdY7g0Hgj15BOkSwEwXs5mjbEa9yZtfheHbcWLTl+aVW3K2ef7S5QIBB+2JHMAhHd8FXGNZPuB1Z87hoiga95NSJ1aM1Zc1s6vW5DbUxeRyTBrk67JsP7xmplSI7ggPqph/s2i5iEOvdCJvj6j7YAowE4GxBV9BaoT0XlJPDftY7SIs4YR5rWlLsC0DbpGbp4JGD+2c/s2/PSuFn2mX3YvuKV/fqOD63dzqukyBeWE6lboD6wb56u//G4OMXnvvRYPTVqwcvbP0ZjvWOvThowTFqs4RhSgdeuC5KHf6MZ8HJET2alAWmwhMyLfxstNWzBSw1PnZELR26V5nN30HMrHmEF9M6EnAzYsqfTG47cef5qdAKEK84G5UQmwxCGrCqc1o0XR+smi+q4ngtCrFeDS7Z7fRxIIAX9YEk+GDIR3FAoGdUs229HrqpDEQERjSskiAS6aWyDmo68kVxXrwsL6MWfj9fNXuVb927MkvOH2rO1R7wSrKUVvDZvk0ivSGG1mF1wygIBGoXpiWwkpsnbFSA8zB6WjhHBXHc/ComrlC8x47ufQK32SNrWkSMYKgLW2wxXAXbvlBrRpvrqWYRfFWTxqmg5VUdRzaI27YYbbJEBdgNpKKFcQWriouHIRaHjy05ghhupoZTUfAuHG+sWk7FH0xhiGOUYfCYp4fapjllujg9k5/C+bdFB+AG9shr7lcBfehCESjn5m6/n8JHAh7NwWuC5Qkd1aIhC6s1UekHOLhhwKfDgysbKB9rAY0pmwadssgtlcPLmSeUFSdmm+xR72S01Hku6Z44s7Cy1OrinMhZniMcNdMB5NvcNRE0hLRh+ziW1nNxz7jAHT0yMP95pGPXrL6ykV+d9HJCt2YsXS/PzZd11cwYhxUbq3Y5yQOXnGEH4dIqCmGrQ2zNZ3bXadBNZKuo+N06sbS81qwCwuwCHX2nGb52zxuDm94Y/Nb8pdd3b+17Y3D6z295fXDd68NlBSzkj1L9Sga27oF7kaOZqq6U5uYetopWwdStjDmnzzvTWGF3WTudf+XeK7d2S96s0KgJG0hpqy0jwirNHNcYqdCsVqyYFth/WLmJCXwUE/vRomHzqGUa5Zl7CAozMdsuGTlrJv9p7+Mre2BZrLT8dBqBv+e4Dmw4VFyNrVUzcRr2xWAh6cXnWrX6zvy/gL/8UqtP/CCsBTG8cLo2TpKWOxOLAD5FMiR+gx8Z4ofd8WAOx1oKx8/2D9SLgelhVay9kqkbi+XH1C6AqqcUT0Q4C4gdj0LhiV7oA7TebLhA1prVHYEEcIkuFlz4xE+GfCCt3TLGp4I0IJEkAdA7xONujflmX4TiHBm+rIhFflYsEXGhQYdCNviwROwHsNR0Ss7d/G6+l5fBOM+Fc4EWl2qZRUoaLJQejnmAxxl7smr3mK9HqSik74R2TEPWIqxGawwL4L4Le+77/lrjH6On/ZedwAnM0PkVmIPTA1ucZMRQGSdAPeKMqZ+z9mFGDju+tz8Px56Ygj09xJ63XnACXIV/bYLF+SU+2F9wzQ61DBxeyg7iDdF7/Qn+IJ/CcDC+wzb4mK+6JrfYMZZhh9kMYQ9ZfMjk81mT51lBzRvTyoQ1znHwVMVXsEiike1Sqa2QyiZt8Mf5BSCmG52XL//keDuA1QnswErKOHnZl65JpB0avhXp0uxE7QiurstxWljVDh2stgvVdrFJSg1bVnwyF03QvEL+5d/80QincdGzPRtLr2HHuIHsRiFvGcvK6ng0KSxPkQpJHsjdmJml1NBNrZR5+OGZ/GyhYkzrZLio5C2LFcA2WwAdNK/QciKwaNjR0qI+69MT3sn4cVL9Wm1j9ULUqLb9IKmtreHqJYBqyCCzfWAEdhJ23IpgSOjwyAGjbN3dnj/z+g1vDO587eZv//OPP/vGLW/uvvTW4O23h48/s/XJyyNuaQjLCASN1Iao6pEJbpYv8LZ7Pl4JHvOX/MfjC+4TkqyJWm2o0eDC7Ntw60Zgu4fcDJtkGWfCuReY+z7zftOwxk1SAICTloSA35Z+9JS3mDwdv8wWUe8adilsbpeSXv4H1pPmcafFMBMZ1JAeSPmu/Ck4OxkxjzD4Y0fB2PZQD0FzK/49/r2A3YpckTmXc8Mioj/Eu3QJOzux3Hchqbonva50+Kp7yns5Ok0l36S+S0IsYdrp7HOxisfGts5mKkQTIXSGsw/OhM/CTvsj50/UrxQBulIb65RUBwDaqIkJZgAUcCgDPR1FbiaGu5NZBCr2DE+2ifMF7F5+5hjbTwv8CMs5U5pqaw5FKU6E1TabZtex3xZLxheJvd/WYAfnmGXutUdpTsxyDWfcViu+LlSphGqI9SfwfNkJ81T4eHU5PO6fcE/CWpyEs7jIGpycBOTWaJDtrw3+YuTp950HvneN5BiuJcPffKYmf+5fgjtuibZYlzG7YEesEWDeKIlTkZYKLxNewl7a4BHjj5x9dHx8+xa+xD0jMHAMOJZxuNu7seE972wPzSmIXHEKuEsjB5va3eWh8NnoRe9ZjmFxHDnF6gCd42d6QMMv8NM4d4xKhl0ODTwSoQfni6eIXuC8HLEG7gl7zEIqFURW3r0So+Z5VuZk9L16KpgMW/jBLfVbe9+8/We7B7t/9uW3BvPfnX5z+Hff+fo77wFyOEfn6B4zw/bCEboJLvOTOgcijhBMA2dgyWLwMfOjBTLsfK5SoA/RuwHBYmcKGKQ8GBse6h7qEbw7yYdwuoahYXqer7ikJoaYhXkMMvU+cbf9QXucDN9mPmJv/0/qI44iDGxduGDEfr/qPAkHZVW0UDrUzciLZPgL7rP+z9gLhF0e6oFNX3ZPu8vBk+6jLlB2QVam38sfNm/WPmsddB6xjjkF82anSIb/k1N27sJwFCakpREqmGbcNNMS/ODd0cZY3YSTeFkQNimSsTpqYVRfA8DlyqpMgjM8EABqVqOneZ2jpAMw/Y/6PfcJfpmvAwCD4/2TpOntqKsChAZq03TPyaZLqrLNU/WGtAE9iLzYTQUVjZZsz3JS4gEtYxnov9z52u6lH1//7UHtJ59+e9h/57qtV0ZsnouxfFZ3NXc+nA4q4iE5ITL0gEX5w5myqSi2SqiJnNXkCiAcG2dTF9yj3n4xiSoFM95X3Zws8u3rgFoGRXcebLvG9pbvLBw0snJeajV9g9hwgewF+n33//IxThyyHuuwCAdj96Wr/pC51NcDhFbIZzMAXkx41hyAGCvBL8PqV3Bqv8sq1n1s+8PeQZlL9kd5AAMY+LAXZyK7bgSO55DQOGUvu5cDRT6WnEvK8nKw7CZp7aMw5YzIBzOeSQK9VgkcpDE4ylGIejk0IlMi1lX9nbwWI77zIsUnhy1aLcBi7fhUpx6efLTTi6rrT/VOtS6xRUI3sU8dXCCqdLupEDr2QIOBKTbfda6SUHe+XgptqaSTf1SGMGRtvd4Mo7jhRV7kwzUAXhBLsiqqRsxj7qs9G0Fppg8MfPvXHxo5Y50vhhVfmzs0mz00diR7RJk3izpLmypRSjt4yHPS6cTS8bXIwTmFT/NlukQDs2+sq/28n/PzxqHyFJnaoxTHx/PgvEqWDfS5wrOY5fe0oNjDvHqlocWE/WKI/TU9Y1+yL7gt7aLVt9baOPkwlcNrhg0XnAw7BYhx64uPvzy447Wbruy++IPBD94clF699YfDbw/+8p1fG7nRmDb2qbPmI0rRKJoHJhXFsqhuTzODHgULewPdS48ROkbvs+eo6hw076TgC30DtcIAW2Zio2XWbClWcCBZRRyXJ+UJfzVY9TV7zV/1X/axTWGH4yHQI1Kiplfs4ohdItQhUQmVCA5YDc5JD34sCMKQ0eCK97i/4p5zT4CvOk5ES7jYRrWQwdnFv7jBtySNjcjoFdYnQrVaqB3gWYIFgoCVDJetA9ngHOdOpiMv0e+J2Nefs1FE3glopB3PHB/dyHbHF+86Syb6ER+q8Y2g63f9S314wBI7weNgsY9GC1EbGf5BHNdX4DIazhpabTu0Q637yBkV2QTw1rn6RG0yIFnvTjeNBaE4N1cAb88ZAc+qBS1TskzqoLMjWWpr4ASLZkYW/fH89oPmfmfemaRTLAvetmO1KT/KyVEwzvea+4y79c9rRU6M97p9uQwYT4I1Cbx+8IL7dbnupCOgqmxBrssVONXEt5aCOCLDl34lcuHHQOVSku1KnuIrLdXmwqn1RI0f8L4IkO/tEpxemobLgbq3rJdkQzZDJw56jcG/XX/aW0F8juVcwMzBpV+gODxJpIMFkhjPHq5wNVKa2OsdAscKqF+Ulks0fx8/5pDBDz88smqdyi/Nk+Fmq+TpKNgkeLGYyzE2pRws3OPcbldY3tSxPUHy84QvsT4Go3jEIkIbUTAExGpnKLsX+mu9k80nddjV/2Wr8+e7T7/1mR8P9rxSf3vAvgt7+v1bPx1BIROLV8Dxl7jGHbajepPKXDLHsW2tpMwTx5L7XAuO4jQ2Z8ovi4+K28WdKHAP76zAGtI5+bBX8QtxIXQie5WFXj0USVADdge0DpbNbtAF+hQ7zpfTNIUTW7HVV9v6ZvFrE+1KU12cDSskVKXuzsi8a8U6CcyWGIqB6wM3kRH6aWQ3WMq7lrY0pbNf61mAbwLpOANioPvhr2YkuV7g11CWr8kTCtaMsB3FkCXn0bRT4W+w7yGyAmAAzwBFE3RlXnLi/eB6+1pON/cjEwu1SG3PMa8xnxQl7By4BNmqLrbg8fvEbVCZW5o6mV2e3Bg7+eBFHfy2GmnwKtXA7gCu9CTx5LmGL1DHpx2sJCpbrK01T640FsNaXPe7XpOetuCYMSnDw5v6tQ4/2sHJKdhbbrj3R1MuwCGRZffSGWuyXNAtu1IklmmDaUGdCkMn4qtDYvs/sO08jVlQ2DCqem30pPOvwyn14N35uJKUkvuXxhq6V8aas2LY9oeWIosvx99ZuXxm9Yn6AjzvDXg0Hh5YLa3XMRo74SLX9Mu1QCskSvhgqyQrct4rCzIr7wrmLfKtm0bO2ptGV4/tyNlJoARWVReoDqpaRjaTy86WjpSJYpdMC8DYpYr5kFK2UGoDsa74uuzIGmDfGmtYy2bXSc67T1lkcGX7UyNMPB5dy+uoUUeb9HJao5ImOxeSltdwQ3GSfZ2u2OdzpGV44Ft5eXpiMp+rPJwvUYerjubMG/srGLYAyIzptP8wyLx90+u7F/5+4PxwsPnD4Ytb39j6y5G0jR6rnkyDqVQtGwbmbzE4aAEpKmesgjpHjKKVM8oUTRWyVwfbMsoPWlPa/WZG/QrR7rTcofnql+dM27Rvnh/VR/V5pkRqoLVpvfTTzuCPZN9dDTb4CuENv2ElZtWRGZdkXd0awkI4RuGxzquftQ5bX6b30bsY4i6WzvuZqe2r5ncCllSYVd2zAr1hRWar8jRd8Y8Hf95bq9eCx2qSEsmMQ9hXLjRPcYHktpUW4NgAYAIq+YRBa0UEBHCZl0adEpG4vehp2RMhDukDk3Fcwq4NAMeQJlsWF4ARZy8FbXmWk9PCrQwFh8PtT1o6QxFxM1BCHYklFv8BFmqhUArm0AhKEHNX/Dm7jCNbWZ37fFF/3F6x141Vc8U4rnWNDslfmLw4vYIdlen8oyUVqGt1MqjY5OTHR5YK5+4IU4bq6o0jnubmyDgdKgAC04EN3WdOAIAqM7xR2fS73e/4nf75zmkvCFyS+C5rqgAKX6ffm/7e7t5bN37nxrcH/reGl/+BjkjM29PIeobXAa/h4MmQr4TwFhlgSYNYjz1wXgdcebGB3SXVBtyTJ1ms1ksBa2irxbPm+WDV+05twydtuRi23Q0/iIwNu8O5Fmg+5wU2R8fsvD2qP4wF6FnnIK+E+cSoGSftHn/DO+8eF8/5ywCJfkw7tFtws4wUwI8AUzVhU4H9ZQa27jh5+2Gm0DIzjX3G9u/7txFuhdMYH4fziKPOhMWz7KBWMsjwck77fG6GwYWPUzPUzlmLzvNy3d3k/xw1yDCm6Gv8JD/L6saq8jiVR7QsKncqwGsqblYWmcbzRByi4xRw77K1h+1lf8oPiZIsSVVqqGsVo9YFYunmMdeQ1upEKurVwOLUXVsfWX5z8He/vKr35uAHrw1Kb129ZX59ZIdQua4Y/HvnMVY1B9dgS2moBZWVPbW51tTqg375/FfJ+dur5XYuAZuZCr+i/LAVq0CDU5IZ0jZKCcOTAWjiyRD1kzjOZfYifp5eppedV9im81MrjgeEiKZsAg6JUIMBfo+bj+YTwBqOSVXVwkn3iv0Isfbyj/gflQdReJKI0aFKY/5EuTW/es9PtJ7ZfOgNvVVeG30FIa+ynMrguY5L9NCUZaqykkGt8hSz+PYH+P/B8s467airxSU7FYQmXB45VUnm2/l6JSiFB5vpiAHsog5sL+3XTlu9BNhsobmmpbECHZvIHFbzpXFt1lZtFR6rlb+BK2RH6RO+FFpxsqwi9oOXddxi/EjzaC8T6gkABlIzHadtgdmkHb4Ia72ZVN2NZuCH4PAQvpw/szPS1/O8lZX+ZuuxsNtYB+OObZ3YobY9wm/jt2FGiGAxYppcTzNaVdgrPY4VtOkpFtwPUHJu+7mt/zQiwaj7wLQXglTegVfNthYa/czaZFQKjyQPaoY6TiqH5w9Ozz24v6LO6hXbZAqfBxieX6KuVbfrxFjkTw3xE6KbRik94dXfdBvdc9WlIAmrpMGG2mBc3DKc318Mpt8YfPHruwdbPxio37j1e8O/GHxqbAQV24DR0AueDxT+2eWlTrsG20UXTs1esqq0mkQ9Uj8RbsrjvB5f4k3C6pve0MvBsliiNaBnVb7EHS98MDjgPyTyooRVxxjmAqKB4QXMkoRFF1DePwX6E1hPO/wL7qYCfanJjGL6tvYYDeF3RbStPGGsFl5UasWniN2oLJuRVjNaakNpHtvEqpS5TopugTqX/fuAjRAMy6f5TNOyC5XMMXW2dEzbrx81M/SICXzBOkynCCvSivUwLYAxwMJ2TJvYjBnCgLOvqZaJ5R8YF6oUtZwyps7ZRUp5xZ0JZ5bK6/t+eXzwkbOvrz935vGTTdIKE94w20BBTx+uVVzRqlYjP7AalfVyr1S1PNNPedxYy9opXZSWd4TnrTlTivlKSdf1bK5cLuYtk4w+WJ7M7S8eLXyFHrXv4H/mqZjg59TNJAdxlAX2TBMgOuWgUpvpT+GosB2FnwsTvWu2Hhn8eEQVQ7PubTxDs3RaFNP6cCT1yeVwo/lC9zTOhPKcmkI6hbhUn07mO/sAk+q1cR+R6+87bw32vTb40+/sfvKNG98cvPry8P89+M3HRlbex654g/dj2D8Ae/G48oN4s9UKm/FSK/JPHH9XRzAgfhAkXkiC2lBwNJ7rZbu5mC1bNdj3kZvOUgF7hvsRjse1Pj9Rb8XN6Hgc0yo9OZ8o9VLjy84cVdQx8//r6UpjJLuq8wymzMV2nNEUBZGSzDhgBEH5QaKQSCiASbAAE2RsJ4DHnmFszz69TndXV3Wtb7/Le+++/dXW3dV79/TsNhgGW4yxAeOxwhYb25iE5UdQBEpYomqrkZJzXtuZ92O6W931qt6995zvu/c736k3p6rNgyUyAbm1JE6LclRaqfcaC9iTxXRgoaBPAqK5fZlcBQsWRR2IP6CdhqlC+i4SeyqdyKWTjjVbXhm7Mva0nLeZmzo99/HZxbbnYqevwD27kSnuZeRF6VK04c47HX6OJcaK1WPYZyBbmdUN0yO1TiOdTivReCuLWIDMVW9I6BZjZmYQO1bLFEtNq25MqzNotpF5f1oul7RrLbuGswSJrNtqkzTdmO3Keb/nL8tl6YhNfcEMRavjQVgB8hKyGJ143Gqqy0o05I/zEX64PkMb7GRluo6CN4Rzp8ayeVDNjrUzsS2F4AsXs3CnzkzUlh6fvsAyFZU0ZCVVA4zrimz4U8lIXHYfCu7TT9Vr5vCMrpPhMWqZ02ZZWLLk1j2zRUlMc/lf2kdz9iE2ZBnUpGO4xy1G6FGS/x3ggkPiEcL/PocFVdIk8zduQhhMIjK4aata6JlrjbbaUTeHgkaAXSsqaI+CALk0oSil8snyGYNge/LT9gh6pQIY+GXT5T/Pia/yL8On53Eic/3oaXsJD0WvbX3yJf2FvYP3vTyofiU/Nhjdeq4wat3fKBkG0xgFajSuNTTNGJ7iCtcc2p5Ja6EZY+5EEii9yPfs1IkhuWGnkABGG5ZSwz4ptt/Phgg7bG6/mQ3zqm06lt8I6Fk2C5QE5jOsFO/fvZ+Lc/ZgD3nBeVbsE8JDomv3nK5z0Xs5QAkFRAp96Pj4PbVPMMC13CTGiPXXciy+c+7Ql466dL2Omp1N5gHjXff6ft+biy+vkNBbmI+T2bnzT0Z9SKi+g2XeV2QfwCJ2oP+Ksjn6JWIGZogFc8cu4djVIzynrPt1gIuXRltFb5ST8o2WhOwnGzD9G4I4nZzT5jYWlI/pqeVOOeRe+fHmQY0Mqtt/WgAMyF1NwlOKLB9IRAp0KXDRiuCS69INLOFc0iLzcnHlVOcLySk61jxVPzr18CT8OzJW1EnJKPGKV/UAMM7pKfOMteZT4nLyPf+yLZKz0drcRYjorpVSH7cL/3Dr8R/sXvqPGwbrr+0BjjE2bhqVM3Je+4B10DyiH9AfpHcbI2ax+WHa4Lr+ADMIsGDP6DTWZK25ZiUwCz3cG0NDh/HlYrsaa1ZplGhNrvmK1LFVT2AsfSos9T/Xrazfj11sHBaoC1YQEOwsiCXKUSijsOevzQ5ydjT3axHbaXARaOJm/JK3Srw1+0vuFeJswmRfMvr8onvJPc/aWYFI4KaeJdIgCYJY68A78YVLfD2x9uHKNoE9m/Y9/K/4tHusTW3TYja59Zef/9FHXv3g724fkK27BoUzcu+Afv+3L+XftfU33yhYotlAQwfOjwmS/4eimOAGwBszmIEkKCr0C7zMVW7u9AgTeia5wv3A9gJuVQWRH5PeqqXPry+ck/7SStqKMk1Re7bT9X2JDwkumxOgz7hljAeU6IQU2pGcZ6ne0+ZmLqB7EXw0gCwOPDq4mh0tBqQTodBx+JLSqfWFHbHnmiL6hkM27Ui0aIjkQpC5G1ndrkK+wYIdeI9rNBUtEfiAY1qu5aVEJtZSLv8WPETEUm/qZQUYEpBd/mbDF0CuT3LDPO40YMEjFfkY04E4HgDWy5z7HCDnFMUBkIuOZ/IJml0mgAaSt2im86XCs7B0k2p2za5KJW66NGz6SmtK8qRIgnpaXRtu1ZJS2gi0hSPAU61jD2On2NPHUeLOLMqIZhRHG9OVsdOHZoqTo8UjTh3AmY4bdy6Wc5mBEUMwUyi/YHVYYO9YSMw5MGAd59ui7SZOwoCriKuoUc6/y7G/bqLxSh6bGONBbmB7QJVsGneitjPPFgnv1NNcrWWLaQ5gopJ1PBq8a/ujg3e+NvzK7sHln93w1PYfFQRdnvRQ/AWYOjRsvgBok4tOCLNXAp+U/cVOn8AcyDxmlp7AspBkzQm8+WhVrsvV2V/JWScQ865PAFG20DnLXXBb6bd4J7qK36OlLGZd4I2pu0qcrrduzznr4ZfDRSLbuUQkOMaRkkOrv3DGpoEemr1mxFO4KfxRaKO4A811WiIkwsMqO+rqkRVp7fFz1s42iKuFDXfIrooqYBwYTgMwlUIn65pWq5UP0hEAWg2qwHWENc0z1lFzlNAKrdrZKTVeQMMUerJ+r35CP175oHnCGrNq1jjRHxi57/hR0qg30pwR1NtqoiZ6nNUxwISpuadHhckV1I/YdHY8c5ZolSA93joY3rrt1fL03le/l+8P/nbrZOGUNqNNlk1LN0yqGpNjOC3QDqg8blWXi61myCIPmG232+rOLc52NuOWTFxXdOwr2qI6r33txMJ0t9bRFylJYRbgKOAWcsgfheSdWQ+5Hfhxp9VtrZ/3E8BBItV9eF8SLbUOa2ExMbLq2MnxkdMz1RljWhP2yMLhzQdXx0IgfDBI2PpGHg6nBBkSbT6ik5XtDxUeMaaUyYlajVn6iD4i+KIW0QQWWCLaHRl1LjzBHpsmsdkzYmtF9Whaj5uxkRiQdbSYtdicSCC/hDa2YhCrMWRDGUIunAs2VhY351dtl8U8MLxiuxGaroG22pZVmqgUK7W6XlYsOmGQklnycxUPSFVU7FPnRGskGW6fCNH3pAEP+reDQ6+++ALKp396PX9p8NmtTxXy371T3E2L1gw1FDGOPVfHQ/Npa5717AX7vPO8jcDFVIym0VSnzQZcCnbUANw6QT+tH1QyYR9aFJsAX4G+S8VnO+QJ0P2SJfG5OxE8gmsB7nIe/wAscJ1iT9CmyTyFuKakgOPqsR13guSxn809Trxkzs5dl7H9MrvKW0DaHDdKHae/ULwyzA/w7XdkXTjDXjxHehfWRe77bNO+4Pt2EmQborFIieirUU5JLGeUzfCPZEIzL/HTeN713K6b1pcUoQtHKm84V5qOgsVsrDZZHyMTD+QUd0wcgAiw+OKPf/Di7sHzW18u0Mlxul9AAsTyzOJ0uXz8hKoPjxSLBpsuKcqn78vKGbBdj6Y4M2FzdiJgT7hz9iwqSJ1vS99J5YBEfdbiEnk8bjplmkkHu9JGZ0UsQghvEF2KmbXYw/YEJQov8Rof40eMCVbljJ1bf/Ti4G2DvViWMb+QNczDAOdJF605fO7OdMpdyHmUiaFRAJU//v0fF3SqiRP2n8kPs/u0CVrdsbHiO0feAPdMTp06cacd07da6iq/6l/1r9vPW9+xVuXcbICj1oKwA7mDKKlYmFDJrV/8rx9d/rfB1end/7n1UqGBRmyqMBzdNT318uHAcrhnudbsmUF++23YEdNiJU4+Y72v+plk3MNNCAXuaZXMKWFKVeqB1bWwrTDkREl/wZfca37fQd6Q2omz6G7I1F5znuyHqRfyFcMnpi9CVHqhozLwbQ8Pxk6vTM810mYWbPRQjUmprwSV+Vrv7m9V0qme4aqZ9LtRI8/+/p0FwSuizI/xh3SY1QbTYdZOopV4aCyKy37PHey1NxhZZ4+zi2INNUCy5XkoOe43XatjdRzxcfuUfdxWbFJ2tknWyPHnW1eu7+3/5I4f5ZuDoa2NQiq6pSfv8rV2JWmsjHZHz46QUNeNXFO7525dsUxNNbSJ4WZl/JHqZHXCNHQl87NruOZcnXSbQKgB88Wt/ubZq6uX55ZmF77/r6i6bc+i50MQ2QkBALm4k+S5o6VabDrArLOSZOog9RhfxzJvZ3K1NF/pHnoGyeWDT1oAVlAfSQGFWXbTPWmbjDRgPFiRlQQHZIZVxFmRtSoF2f7oc4V8H+ZJzT4m/tL6ENvOY/+SD7E7uc7qQONNPNGxGTARHsI6Tt00SWL5TTG4EX3Anw8HVqZSADZqbKJWhHBMcDDm+4FUACsjt/5m689e+cKP87sGV157a6Guq6pSmTo+NXro0Ojo4Qe1BpqNWGajVj1TH68OMT1pEGm5mThs7cxs9fHjL2/ftHDYbwYNLFKcR02GH2dVWrYXJ95+kZUEBm2zX4cIb/pGUl23rclzMyvNztAXd9pdwVOq9ZSk2h1d2imekWHU27xy7sLyqvTW1paWl9baC2T1MQ/L8TvMnQpJKeBCM8ngH61CkTY1XsxOtBnJ3wFwcIYX+TH9Ln6ajVCVH2MPiGV2gE/DWraYQf+ZHSH5plDUv3AVt7pgzFk9a7YDryztTBLrzNvL9rJzyVkg0eAW54lgsAte1rkcfo0/JSLaZbGxRp1hdK6umV996OuDi+21c6d71cXqpvaVwR3f3fub5fmedmViM7mgr17d1M6VHxtZeuVrB79+bL6znD/8zJ4XBy8XnHJODvkH5El30j0iK46B+/2iKS2nLieiyUjBFpMYw80I1eQ8tHFXGBgrDc1E9MJOENoQ8Iw1EfkkkC4sSRjwa3t8ExXhoVjAgz034Fi21cdTNxmKwITEJFKHBHaQKYk87lOSf+jantiyOWQJd5ZGgM1mQ5QAiRZuF8inZBd/hTqBjUqvxG+7aXRp9pvuZRuLIgSeZ71hI03wpHg/qjA8J/aS8P/Px2x7Ad0cxQp1EbZnwNqI1PD4BcUbFRUBwFQy/6imZpjXXbBT2rPwfCxrhuZYoR7urCpcVwJQ10hSRcdaNKoSbpgCtMzOp+Fm+1HODPcKFmdjbzl16YIfOn0l6+nixRn2t13i+KGwIoYjHtshX379TBUw+EPP62qkMlUzTIOha1dR1bK+NpmDFUexsMXqBilr09Vm3TKtbHNULWMtu1bLhJWUUUOVRpWROm6b0hodm4J0l3X1gtugR3LDpHbJnrGdGUpg8Weu4Bxb3mAhN0xkbKimGgDhIQ4D1nDIdHTSKFewbTtlOgDGJm1QE63BsZsvRA9tHIKg0nSGUwD72cwxN4xo33f+p0AhWO/Lv/O7u4DnYS+/zJiI97ODX2yHSPJ//ux7gWegRlNuZFK/nh1I9FL3aWjFIpEt6VmZ/MWF+d+yAAWjuzXv6y1Lii6slcRYYgswhJ0qadcFM2tUtXjFxNNaygyjZIq2kGWum6YFwB7NL5DwNFrVRg0yYENHbY7uYz2ABh8+SCSdTokuAdSoei3gQDUUK6chqbFfb1OL/2fCD+ZUO48cqXQzax6R+SPu53IastyO0xVucGKwKusiysrohAZ/rZqkaXBhhPg+dsw6GGQgBdvZofIGchqEco/oc9zG0ZhBa3WHSy8i+CjRwRirrvGhvdFWxPUAZiRx1ELDebghSbb/qWDX/M86Vafs10WFNNL79X35236xC4cMoIwt9wvJIhYYK6JjnIcAnWrP0CV9mc3zCEipi2pyByYr6iDQHfrB4F4yuC6BBTENrUJpg6m0ahRFXTS0+3F7Xgh056GQWLCpAHxTNzkskHCW03RwO8nfdu0TzoZ3VpwXmzbAsEATwEt7wnQTiUZQjg6pCQIP8U3BWAN//zOsamHHYsVQhQo/eG7X9pkHCtvv1t9iCnwLVc3lvM8XAGX0YWZ1WWJssg5bhsvnfSIChhpFn52Hb11s0+tiZZAbedmJuzXrBfL1UjdYwnf93f5fDPYXnDe6g2KtrNXiiZtg/QXMebPIq6wELzeFPm51rgP1+aR9CkjD03fYZ3SR0yZUuj/ff/oOrP2xsh4mcsZR0Stlng/ewV8Vj6HXtG37NDU6QeT6bi/xDTL41McLQtdVrrIq/GVVPSWcxkF8AISpTBEWfrkHnsIoEJMGd5qw2nhOrsrLThg8mn4r+0gbtuf16GorJKHnqzlpuha6VlaAYsO0eWrX9qHB7QUzrMt9+duf2uV1Erkff+w223SfWVfN/Q/YBXjMQprSxFMjEoQ5dOrD2VVNdmalBUnvPbxgqo6VGCQyc2EYhdWoGVBsqpG//Zld25+nBciINGiS/Puf2RU0JW+FPrwO7iZU+1nPeeBy8Iluv/amwfferkNUszVHcVhot7FjdEhgAO0aJb+/s1HIv/faLksBEkFjyMwyIjLUZU7xKKcaefLt+dt+sgtjI3oZwIiiIFVmhpm2xsjgV6xgAfn1fCmV0NLxGb7ZKhdMzaaJTgLL93MBZBXNI1WY8PD+b93mW5cGo7uv//cNg92vmYBHlOrUwdF7q8d4VahO03m9FtbV0W27m20/kQBb73Sd1EvixfZGstldCBM35a2sLMo2/aG5TOUFUJvCDewtfSB3v/IvN1x+rVFAozujaJbhkyHyyupXdvp6Oq939swUB44VKZ1K+3POAWeUs5YSGLboQ0zDcrZWAndfInbbuqiv0pSmwuVx/SKKFMyIRmavEY0H4wE+c3Lr1nvetvXZwvSjW7e98tJjN27rT75l30273/2/t7y1d8tNr950PXa81i23/PDmH0p5yx/8ya7353fdsHv3no/dX2dakT3MG+72BwCl3wwh8EH7Hnf7TXbRP+6WHUPqUc1lHbEOXM/ruhGfR/lpbPxKvCB+ai3xX5ObxbPsHID81HKAMytCYTAPbv4/3shwe3icY2BkYGDgAWIxIGZiYATCLiBmAfMYAAmMALl4nGNgYGBkAIKrWsf8QfSWSV8YYDQARc4GigAAeJwtks8rRFEUgM+5bwjbezOykLKQifwFUhZSSqwsWFsoJXYWysJONiRFWUiK0cyG8iM1JYkp5VczLDCThcKKlGJ8776Z+vrOuee9c++58zQposLvQKxWijMWn+NW/CNWFnEjxFkz4vRbnORxAafwArUi8RJxlvgRZ8SamnK+jzfwEc/s0O+JfJ5ecW+rSeI64hNIkd/AJ/E9vBMXIM17q/RsZu2WPMM7FfgUXuGCWhc+pn4NLxDWtnhuDN/hatZ+oduf2ekwbELJn8/pOMz48/j99DKaX0fYu+jt9JAZttmrk3iCtbBPOF+OeBdPwyTxOoT3dlXuvwdr0BDNoe306Pd3ZvWPuJbaA3yR5zirEPfhUWqgz9H/YtpY78ElsUFHdM/BMlQB9x07w7MwJy5I4ClgzqAXx/AgZq9giH4f9KGHacIDeAUn6JlnvzfyemgB5pUsZ+Wb+Acw2Fhw) format('woff');\n    }");}function N(t){t.append("filter").attr("id","xkcdify").attr("filterUnits","userSpaceOnUse").attr("x",-5).attr("y",-5).attr("width","100%").attr("height","100%").call(t=>t.append("feTurbulence").attr("type","fractalNoise").attr("baseFrequency","0.05").attr("result","noise")).call(t=>t.append("feDisplacementMap").attr("scale","5").attr("xChannelSelector","R").attr("yChannelSelector","G").attr("in","SourceGraphic").attr("in2","noise")),t.append("filter").attr("id","xkcdify-pie").call(t=>t.append("feTurbulence").attr("type","fractalNoise").attr("baseFrequency","0.05").attr("result","noise")).call(t=>t.append("feDisplacementMap").attr("scale","5").attr("xChannelSelector","R").attr("yChannelSelector","G").attr("in","SourceGraphic").attr("in2","noise"));}var O=["#dd4528","#28a3dd","#f3db52","#ed84b5","#4ab74e","#9179c0","#8e6d5a","#f19839","#949494"];const l={top:50,right:30,bottom:50,left:50};class ag{constructor(t,{title:e,xLabel:i,yLabel:o,data:{labels:r,datasets:s},options:a}){this.options=od({unxkcdify:!1,yTickCount:3,dataColors:O,fontFamily:"xkcd",strokeColor:"black",backgroundColor:"white"},a),e&&(this.title=e,l.top=60),i&&(this.xLabel=i,l.bottom=50),o&&(this.yLabel=o,l.left=70),this.data={labels:r,datasets:s},this.filter="url(#xkcdify)",this.fontFamily=this.options.fontFamily||"xkcd",this.options.unxkcdify&&(this.filter=null,this.fontFamily="-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"),this.svgEl=f(t).style("stroke-width","3").style("font-family",this.fontFamily).style("background",this.options.backgroundColor).attr("width",t.parentElement.clientWidth).attr("height",Math.min(2*t.parentElement.clientWidth/3,window.innerHeight)),this.svgEl.selectAll("*").remove(),this.chart=this.svgEl.append("g").attr("transform",`translate(${l.left},${l.top})`),this.width=this.svgEl.attr("width")-l.left-l.right,this.height=this.svgEl.attr("height")-l.top-l.bottom,M(this.svgEl),N(this.svgEl),this.render();}render(){this.title&&k.title(this.svgEl,this.title,this.options.strokeColor),this.xLabel&&k.xLabel(this.svgEl,this.xLabel,this.options.strokeColor),this.yLabel&&k.yLabel(this.svgEl,this.yLabel,this.options.strokeColor);const t=new L({parent:this.svgEl,title:"tooltip",items:[{color:"red",text:"weweyang: 12"},{color:"blue",text:"timqian: 13"}],position:{x:30,y:30,type:b.positionType.upRight},unxkcdify:this.options.unxkcdify,backgroundColor:this.options.backgroundColor,strokeColor:this.options.strokeColor}),e=ja().range([0,this.width]).domain(this.data.labels).padding(.4),i=this.data.datasets.reduce((t,e)=>t.concat(e.data),[]),o=A().domain([0,Math.max(...i)]).range([this.height,0]),r=this.chart.append("g");y.xAxis(r,{xScale:e,tickCount:3,moveDown:this.height,fontFamily:this.fontFamily,unxkcdify:this.options.unxkcdify,stroke:this.options.strokeColor}),y.yAxis(r,{yScale:o,tickCount:this.options.yTickCount||3,fontFamily:this.fontFamily,unxkcdify:this.options.unxkcdify,stroke:this.options.strokeColor}),r.selectAll(".xkcd-chart-bar").data(this.data.datasets[0].data).enter().append("rect").attr("class","xkcd-chart-bar").attr("x",(t,i)=>e(this.data.labels[i])).attr("width",e.bandwidth()).attr("y",t=>o(t)).attr("height",t=>this.height-o(t)).attr("fill","none").attr("pointer-events","all").attr("stroke",this.options.strokeColor).attr("stroke-width",3).attr("rx",2).attr("filter",this.filter).on("mouseover",(e,i,o)=>{f(o[i]).attr("fill",this.options.dataColors[i]),t.show();}).on("mouseout",(e,i,o)=>{f(o[i]).attr("fill","none"),t.hide();}).on("mousemove",(e,i,o)=>{const r=w(o[i])[0]+l.left+10,s=w(o[i])[1]+l.top+10;let a=b.positionType.downRight;r>this.width/2&&s<this.height/2?a=b.positionType.downLeft:r>this.width/2&&s>this.height/2?a=b.positionType.upLeft:r<this.width/2&&s>this.height/2&&(a=b.positionType.upRight),t.update({title:this.data.labels[i],items:[{color:this.options.dataColors[i],text:`${this.data.datasets[0].label||""}: ${e}`}],position:{x:r,y:s,type:a}});});}update(){}}function Ic(t,o){var e=Object.keys(t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(t);o&&(i=i.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),e.push.apply(e,i);}return e}function bg(t){for(var o=1;o<arguments.length;o++){var e=null!=arguments[o]?arguments[o]:{};o%2?Ic(e,!0).forEach(function(o){cg(t,o,e[o]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(e)):Ic(e).forEach(function(o){Object.defineProperty(t,o,Object.getOwnPropertyDescriptor(e,o));});}return t}function cg(t,o,e){return o in t?Object.defineProperty(t,o,{value:e,enumerable:!0,configurable:!0,writable:!0}):t[o]=e,t}function Z(t,{items:r,position:e,unxkcdify:i,parentWidth:o,parentHeight:a,strokeColor:p,backgroundColor:n}){const l=i?null:"url(#xkcdify)",$=t.append("svg"),d=$.append("svg"),s=$.append("svg");r.forEach((t,r)=>{s.append("rect").style("fill",t.color).attr("width",8).attr("height",8).attr("rx",2).attr("ry",2).attr("filter",l).attr("x",15).attr("y",17+20*r),s.append("text").style("font-size","15").style("fill",p).attr("x",27).attr("y",17+20*r+8).text(t.text);});const f=s.node().getBBox(),c=f.width+15,g=f.height+10;let y=0,h=0;e!==b.positionType.downLeft&&e!==b.positionType.downRight||(h=a-g-13),e!==b.positionType.upRight&&e!==b.positionType.downRight||(y=o-c-13),d.append("rect").style("fill",n).attr("fill-opacity",.85).attr("stroke",p).attr("stroke-width",2).attr("rx",5).attr("ry",5).attr("filter",l).attr("width",c).attr("height",g).attr("x",8).attr("y",5),$.attr("x",y).attr("y",h);}const p={top:50,right:30,bottom:50,left:50};class dg{constructor(t,{title:o,xLabel:e,yLabel:i,data:{labels:r,datasets:s},options:a}){this.options=bg({unxkcdify:!1,yTickCount:3,dataColors:O,fontFamily:"xkcd",strokeColor:"black",backgroundColor:"white",legendPosition:b.positionType.upLeft,showLegend:!0},a),o&&(this.title=o,p.top=60),e&&(this.xLabel=e,p.bottom=50),i&&(this.yLabel=i,p.left=70),this.data={labels:r,datasets:s},this.filter="url(#xkcdify)",this.fontFamily=this.options.fontFamily||"xkcd",this.options.unxkcdify&&(this.filter=null,this.fontFamily="-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"),this.svgEl=f(t).style("stroke-width","3").style("font-family",this.fontFamily).style("background",this.options.backgroundColor).attr("width",t.parentElement.clientWidth).attr("height",Math.min(2*t.parentElement.clientWidth/3,window.innerHeight)),this.svgEl.selectAll("*").remove(),this.chart=this.svgEl.append("g").attr("transform",`translate(${p.left},${p.top})`),this.width=this.svgEl.attr("width")-p.left-p.right,this.height=this.svgEl.attr("height")-p.top-p.bottom,M(this.svgEl),N(this.svgEl),this.render();}render(){this.title&&k.title(this.svgEl,this.title,this.options.strokeColor),this.xLabel&&k.xLabel(this.svgEl,this.xLabel,this.options.strokeColor),this.yLabel&&k.yLabel(this.svgEl,this.yLabel,this.options.strokeColor);const t=new L({parent:this.svgEl,title:"tooltip",items:[{color:"red",text:"weweyang: 12"},{color:"blue",text:"timqian: 13"}],position:{x:30,y:30,type:b.positionType.upRight},unxkcdify:this.options.unxkcdify,backgroundColor:this.options.backgroundColor,strokeColor:this.options.strokeColor}),o=ja().range([0,this.width]).domain(this.data.labels).padding(.4),e=this.data.datasets.reduce((t,o)=>o.data.map((o,e)=>(t[e]||0)+o),[]),i=A().domain([0,Math.max(...e)]).range([this.height,0]),r=this.chart.append("g");y.xAxis(r,{xScale:o,tickCount:3,moveDown:this.height,fontFamily:this.fontFamily,unxkcdify:this.options.unxkcdify,stroke:this.options.strokeColor}),y.yAxis(r,{yScale:i,tickCount:this.options.yTickCount||3,fontFamily:this.fontFamily,unxkcdify:this.options.unxkcdify,stroke:this.options.strokeColor});const s=this.data.datasets.reduce((t,o)=>t.concat(o.data),[]),a=this.data.datasets[0].data.length,n=this.data.datasets.reduce((t,o,e)=>(e>0?t.push(o.data.map((o,i)=>this.data.datasets[e-1].data[i]+t[e-1][i])):t.push(new Array(o.data.length).fill(0)),t),[]).flat();if(r.selectAll(".xkcd-chart-stacked-bar").data(s).enter().append("rect").attr("class","xkcd-chart-stacked-bar").attr("x",(t,e)=>o(this.data.labels[e%a])).attr("width",o.bandwidth()).attr("y",(t,o)=>i(t+n[o])).attr("height",t=>this.height-i(t)).attr("fill",(t,o)=>this.options.dataColors[Math.floor(o/a)]).attr("pointer-events","all").attr("stroke",this.options.strokeColor).attr("stroke-width",3).attr("rx",2).attr("filter",this.filter).on("mouseover",()=>t.show()).on("mouseout",()=>t.hide()).on("mousemove",(o,e,i)=>{const r=w(i[e])[0]+p.left+10,s=w(i[e])[1]+p.top+10,n=this.data.datasets.map((t,o)=>({color:this.options.dataColors[o],text:`${this.data.datasets[o].label||""}: ${this.data.datasets[o].data[e%a]}`})).reverse();let l=b.positionType.downRight;r>this.width/2&&s<this.height/2?l=b.positionType.downLeft:r>this.width/2&&s>this.height/2?l=b.positionType.upLeft:r<this.width/2&&s>this.height/2&&(l=b.positionType.upRight),t.update({title:this.data.labels[e],items:n,position:{x:r,y:s,type:l}});}),this.options.showLegend){const t=this.data.datasets.map((t,o)=>({color:this.options.dataColors[o],text:`${this.data.datasets[o].label||""}`})).reverse();Z(r,{items:t,position:this.options.legendPosition,unxkcdify:this.options.unxkcdify,parentWidth:this.width,parentHeight:this.height,strokeColor:this.options.strokeColor,backgroundColor:this.options.backgroundColor});}}update(){}}function Jc(t,e){var i=Object.keys(t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);e&&(o=o.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})),i.push.apply(i,o);}return i}function eg(t){for(var e=1;e<arguments.length;e++){var i=null!=arguments[e]?arguments[e]:{};e%2?Jc(i,!0).forEach(function(e){fg(t,e,i[e]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(i)):Jc(i).forEach(function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(i,e));});}return t}function fg(t,e,i){return e in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}var c=function(e){return function(){return e}};var gg=function($,t){return t<$?-1:t>$?1:t>=$?0:NaN};var hg=function($){return $};var Kc=Math.abs;var Q=Math.atan2;var W=Math.cos;var ig=Math.max;var kb=Math.min;var V=Math.sin;var X=Math.sqrt;var U=1e-12;var _=Math.PI;var ta=_/2;var ua=2*_;function jg($){return $>1?0:$<-1?_:Math.acos($)}function Lc($){return $>=1?ta:$<=-1?-ta:Math.asin($)}var kg=function(){var t=hg,n=gg,r=null,e=c(0),$=c(ua),o=c(0);function a(a){var i,u,l,p,c,A=a.length,f=0,s=new Array(A),b=new Array(A),U=+e.apply(this,arguments),Z=Math.min(ua,Math.max(-ua,$.apply(this,arguments)-U)),m=Math.min(Math.abs(Z)/A,o.apply(this,arguments)),d=m*(Z<0?-1:1);for(i=0;i<A;++i)(c=b[s[i]=i]=+t(a[i],i,a))>0&&(f+=c);for(null!=n?s.sort(function(t,r){return n(b[t],b[r])}):null!=r&&s.sort(function(t,n){return r(a[t],a[n])}),i=0,l=f?(Z-A*d)/f:0;i<A;++i,U=p)u=s[i],p=U+((c=b[u])>0?c*l:0)+d,b[u]={data:a[u],index:i,value:c,startAngle:U,endAngle:p,padAngle:m};return b}return a.value=function(n){return arguments.length?(t="function"==typeof n?n:c(+n),a):t},a.sortValues=function(t){return arguments.length?(n=t,r=null,a):n},a.sort=function(t){return arguments.length?(r=t,n=null,a):r},a.startAngle=function(t){return arguments.length?(e="function"==typeof t?t:c(+t),a):e},a.endAngle=function(t){return arguments.length?($="function"==typeof t?t:c(+t),a):$},a.padAngle=function(t){return arguments.length?(o="function"==typeof t?t:c(+t),a):o},a};function lg($){return $.innerRadius}function mg($){return $.outerRadius}function ng($){return $.startAngle}function og($){return $.endAngle}function pg($){return $&&$.padAngle}function qg($,t,r,n,i,o,a,p){var e=r-$,c=n-t,I=a-i,B=p-o,L=B*e-I*c;if(!(L*L<U))return [$+(L=(I*(t-o)-B*($-i))/L)*e,t+L*c]}function va($,t,r,n,i,o,a){var p=$-r,e=t-n,c=(a?o:-o)/X(p*p+e*e),I=c*e,B=-c*p,L=$+I,m=t+B,s=r+I,l=n+B,u=(L+s)/2,y=(m+l)/2,f=s-L,x=l-m,v=f*f+x*x,g=i-o,h=L*l-s*m,d=(x<0?-1:1)*X(ig(0,g*g*v-h*h)),T=(h*x-f*d)/v,A=(-h*f-x*d)/v,R=(h*x+f*d)/v,q=(-h*f+x*d)/v,P=T-u,b=A-y,E=R-u,O=q-y;return P*P+b*b>E*E+O*O&&(T=R,A=q),{cx:T,cy:A,x01:-I,y01:-B,x11:T*(i/g-1),y11:A*(i/g-1)}}var lb=Math.PI,mb=2*lb,C=1e-6,rg=mb-C;function nb(){this._x0=this._y0=this._x1=this._y1=null,this._="";}function ob(){return new nb}nb.prototype=ob.prototype={constructor:nb,moveTo:function(t,h){this._+="M"+(this._x0=this._x1=+t)+","+(this._y0=this._y1=+h);},closePath:function(){null!==this._x1&&(this._x1=this._x0,this._y1=this._y0,this._+="Z");},lineTo:function(t,h){this._+="L"+(this._x1=+t)+","+(this._y1=+h);},quadraticCurveTo:function(t,h,i,s){this._+="Q"+ +t+","+ +h+","+(this._x1=+i)+","+(this._y1=+s);},bezierCurveTo:function(t,h,i,s,$,o){this._+="C"+ +t+","+ +h+","+ +i+","+ +s+","+(this._x1=+$)+","+(this._y1=+o);},arcTo:function(t,h,i,s,$){t=+t,h=+h,i=+i,s=+s,$=+$;var o=this._x1,a=this._y1,r=i-t,_=s-h,n=o-t,M=a-h,e=n*n+M*M;if($<0)throw new Error("negative radius: "+$);if(null===this._x1)this._+="M"+(this._x1=t)+","+(this._y1=h);else if(e>C){if(Math.abs(M*r-_*n)>C&&$){var u=i-o,b=s-a,v=r*r+_*_,l=u*u+b*b,x=Math.sqrt(v),p=Math.sqrt(e),c=$*Math.tan((lb-Math.acos((v+e-l)/(2*x*p)))/2),f=c/p,y=c/x;Math.abs(f-1)>C&&(this._+="L"+(t+f*n)+","+(h+f*M)),this._+="A"+$+","+$+",0,0,"+ +(M*u>n*b)+","+(this._x1=t+y*r)+","+(this._y1=h+y*_);}else this._+="L"+(this._x1=t)+","+(this._y1=h);}},arc:function(t,h,i,s,$,o){t=+t,h=+h,o=!!o;var a=(i=+i)*Math.cos(s),r=i*Math.sin(s),_=t+a,n=h+r,M=1^o,e=o?s-$:$-s;if(i<0)throw new Error("negative radius: "+i);null===this._x1?this._+="M"+_+","+n:(Math.abs(this._x1-_)>C||Math.abs(this._y1-n)>C)&&(this._+="L"+_+","+n),i&&(e<0&&(e=e%mb+mb),e>rg?this._+="A"+i+","+i+",0,1,"+M+","+(t-a)+","+(h-r)+"A"+i+","+i+",0,1,"+M+","+(this._x1=_)+","+(this._y1=n):e>C&&(this._+="A"+i+","+i+",0,"+ +(e>=lb)+","+M+","+(this._x1=t+i*Math.cos($))+","+(this._y1=h+i*Math.sin($))));},rect:function(t,h,i,s){this._+="M"+(this._x0=this._x1=+t)+","+(this._y0=this._y1=+h)+"h"+ +i+"v"+ +s+"h"+-i+"Z";},toString:function(){return this._}};var sg=function(){var $=lg,t=mg,r=c(0),n=null,i=ng,o=og,a=pg,p=null;function e(){var e,c,I=+$.apply(this,arguments),B=+t.apply(this,arguments),L=i.apply(this,arguments)-ta,m=o.apply(this,arguments)-ta,s=Kc(m-L),l=m>L;if(p||(p=e=ob()),B<I&&(c=B,B=I,I=c),B>U){if(s>ua-U)p.moveTo(B*W(L),B*V(L)),p.arc(0,0,B,L,m,!l),I>U&&(p.moveTo(I*W(m),I*V(m)),p.arc(0,0,I,m,L,l));else {var u,y,f=L,x=m,v=L,g=m,h=s,d=s,T=a.apply(this,arguments)/2,A=T>U&&(n?+n.apply(this,arguments):X(I*I+B*B)),R=kb(Kc(B-I)/2,+r.apply(this,arguments)),q=R,P=R;if(A>U){var b=Lc(A/I*V(T)),E=Lc(A/B*V(T));(h-=2*b)>U?(v+=b*=l?1:-1,g-=b):(h=0,v=g=(L+m)/2),(d-=2*E)>U?(f+=E*=l?1:-1,x-=E):(d=0,f=x=(L+m)/2);}var O=B*W(f),S=B*V(f),j=I*W(g),k=I*V(g);if(R>U){var w,z=B*W(x),C=B*V(x),D=I*W(v),F=I*V(v);if(s<_&&(w=qg(O,S,D,F,z,C,j,k))){var G=O-w[0],H=S-w[1],J=z-w[0],K=C-w[1],M=1/V(jg((G*J+H*K)/(X(G*G+H*H)*X(J*J+K*K)))/2),N=X(w[0]*w[0]+w[1]*w[1]);q=kb(R,(I-N)/(M-1)),P=kb(R,(B-N)/(M+1));}}d>U?P>U?(u=va(D,F,O,S,B,P,l),y=va(z,C,j,k,B,P,l),p.moveTo(u.cx+u.x01,u.cy+u.y01),P<R?p.arc(u.cx,u.cy,P,Q(u.y01,u.x01),Q(y.y01,y.x01),!l):(p.arc(u.cx,u.cy,P,Q(u.y01,u.x01),Q(u.y11,u.x11),!l),p.arc(0,0,B,Q(u.cy+u.y11,u.cx+u.x11),Q(y.cy+y.y11,y.cx+y.x11),!l),p.arc(y.cx,y.cy,P,Q(y.y11,y.x11),Q(y.y01,y.x01),!l))):(p.moveTo(O,S),p.arc(0,0,B,f,x,!l)):p.moveTo(O,S),I>U&&h>U?q>U?(u=va(j,k,z,C,I,-q,l),y=va(O,S,D,F,I,-q,l),p.lineTo(u.cx+u.x01,u.cy+u.y01),q<R?p.arc(u.cx,u.cy,q,Q(u.y01,u.x01),Q(y.y01,y.x01),!l):(p.arc(u.cx,u.cy,q,Q(u.y01,u.x01),Q(u.y11,u.x11),!l),p.arc(0,0,I,Q(u.cy+u.y11,u.cx+u.x11),Q(y.cy+y.y11,y.cx+y.x11),l),p.arc(y.cx,y.cy,q,Q(y.y11,y.x11),Q(y.y01,y.x01),!l))):p.arc(0,0,I,g,v,l):p.lineTo(j,k);}}else p.moveTo(0,0);if(p.closePath(),e)return p=null,e+""||null}return e.centroid=function(){var r=(+$.apply(this,arguments)+ +t.apply(this,arguments))/2,n=(+i.apply(this,arguments)+ +o.apply(this,arguments))/2-_/2;return [W(n)*r,V(n)*r]},e.innerRadius=function(t){return arguments.length?($="function"==typeof t?t:c(+t),e):$},e.outerRadius=function($){return arguments.length?(t="function"==typeof $?$:c(+$),e):t},e.cornerRadius=function($){return arguments.length?(r="function"==typeof $?$:c(+$),e):r},e.padRadius=function($){return arguments.length?(n=null==$?null:"function"==typeof $?$:c(+$),e):n},e.startAngle=function($){return arguments.length?(i="function"==typeof $?$:c(+$),e):i},e.endAngle=function($){return arguments.length?(o="function"==typeof $?$:c(+$),e):o},e.padAngle=function($){return arguments.length?(a="function"==typeof $?$:c(+$),e):a},e.context=function($){return arguments.length?(p=null==$?null:$,e):p},e};const tg=50;class ug{constructor(t,{title:e,data:{labels:i,datasets:o},options:r}){this.options=eg({unxkcdify:!1,innerRadius:.5,legendPosition:b.positionType.upLeft,dataColors:O,fontFamily:"xkcd",strokeColor:"black",backgroundColor:"white",showLegend:!0},r),this.title=e,this.data={labels:i,datasets:o},this.filter="url(#xkcdify-pie)",this.fontFamily=this.options.fontFamily||"xkcd",this.options.unxkcdify&&(this.filter=null,this.fontFamily="-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"),this.svgEl=f(t).style("stroke-width","3").style("font-family",this.fontFamily).style("background",this.options.backgroundColor).attr("width",t.parentElement.clientWidth).attr("height",Math.min(2*t.parentElement.clientWidth/3,window.innerHeight)),this.svgEl.selectAll("*").remove(),this.width=this.svgEl.attr("width"),this.height=this.svgEl.attr("height"),this.chart=this.svgEl.append("g").attr("transform",`translate(${this.width/2},${this.height/2})`),M(this.svgEl),N(this.svgEl),this.render();}render(){this.title&&k.title(this.svgEl,this.title,this.options.strokeColor);const t=new L({parent:this.svgEl,title:"tooltip",items:[{color:"red",text:"weweyang: 12"},{color:"blue",text:"timqian: 13"}],position:{x:30,y:30,type:b.positionType.upRight},unxkcdify:this.options.unxkcdify,strokeColor:this.options.strokeColor,backgroundColor:this.options.backgroundColor}),e=Math.min(this.width,this.height)/2-tg,i=kg()(this.data.datasets[0].data),o=sg().innerRadius(e*(void 0===this.options.innerRadius?.5:this.options.innerRadius)).outerRadius(e);this.chart.selectAll(".xkcd-chart-arc").data(i).enter().append("path").attr("class",".xkcd-chart-arc").attr("d",o).attr("fill","none").attr("stroke",this.options.strokeColor).attr("stroke-width",2).attr("fill",(t,e)=>this.options.dataColors[e]).attr("filter",this.filter).on("mouseover",(e,i,o)=>{f(o[i]).attr("fill-opacity",.6),t.show();}).on("mouseout",(e,i,o)=>{f(o[i]).attr("fill-opacity",1),t.hide();}).on("mousemove",(e,i,o)=>{const r=w(o[i])[0]+this.width/2+10,s=w(o[i])[1]+this.height/2+10;t.update({title:this.data.labels[i],items:[{color:this.options.dataColors[i],text:`${this.data.datasets[0].label||""}: ${e.data}`}],position:{x:r,y:s,type:b.positionType.downRight}});});const r=this.data.datasets[0].data.map((t,e)=>({color:this.options.dataColors[e],text:this.data.labels[e]})),s=this.svgEl.append("g").attr("transform","translate(0, 30)");this.options.showLegend&&Z(s,{items:r,position:this.options.legendPosition,unxkcdify:this.options.unxkcdify,parentWidth:this.width,parentHeight:this.height,strokeColor:this.options.strokeColor,backgroundColor:this.options.backgroundColor});}update(){}}function Mc(t,i){var o=Object.keys(t);if(Object.getOwnPropertySymbols){var e=Object.getOwnPropertySymbols(t);i&&(e=e.filter(function(i){return Object.getOwnPropertyDescriptor(t,i).enumerable})),o.push.apply(o,e);}return o}function vg(t){for(var i=1;i<arguments.length;i++){var o=null!=arguments[i]?arguments[i]:{};i%2?Mc(o,!0).forEach(function(i){wg(t,i,o[i]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(o)):Mc(o).forEach(function(i){Object.defineProperty(t,i,Object.getOwnPropertyDescriptor(o,i));});}return t}function wg(t,i,o){return i in t?Object.defineProperty(t,i,{value:o,enumerable:!0,configurable:!0,writable:!0}):t[i]=o,t}function Nc(t){this._context=t;}Nc.prototype={areaStart:function(){this._line=0;},areaEnd:function(){this._line=NaN;},lineStart:function(){this._point=0;},lineEnd:function(){(this._line||0!==this._line&&1===this._point)&&this._context.closePath(),this._line=1-this._line;},point:function(t,i){switch(t=+t,i=+i,this._point){case 0:this._point=1,this._line?this._context.lineTo(t,i):this._context.moveTo(t,i);break;case 1:this._point=2;default:this._context.lineTo(t,i);}}};var xg=function(t){return new Nc(t)};function yg($){return $[0]}function zg($){return $[1]}var pb=function(){var n=yg,t=zg,r=c(!0),e=null,$=xg,o=null;function u(u){var i,l,p,h=u.length,c=!1;for(null==e&&(o=$(p=ob())),i=0;i<=h;++i)!(i<h&&r(l=u[i],i,u))===c&&((c=!c)?o.lineStart():o.lineEnd()),c&&o.point(+n(l,i,u),+t(l,i,u));if(p)return o=null,p+""||null}return u.x=function(t){return arguments.length?(n="function"==typeof t?t:c(+t),u):n},u.y=function(n){return arguments.length?(t="function"==typeof n?n:c(+n),u):t},u.defined=function(n){return arguments.length?(r="function"==typeof n?n:c(!!n),u):r},u.curve=function(n){return arguments.length?($=n,null!=e&&(o=$(e)),u):$},u.context=function(n){return arguments.length?(null==n?e=o=null:o=$(e=n),u):e},u};function Oc(t){return t<0?-1:1}function Pc(t,o,n){var i=t._x1-t._x0,e=o-t._x1,$=(t._y1-t._y0)/(i||e<0&&-0),s=(n-t._y1)/(e||i<0&&-0),x=($*e+s*i)/(i+e);return (Oc($)+Oc(s))*Math.min(Math.abs($),Math.abs(s),.5*Math.abs(x))||0}function Qc(t,o){var n=t._x1-t._x0;return n?(3*(t._y1-t._y0)/n-o)/2:o}function qb(t,o,n){var i=t._x0,e=t._y0,$=t._x1,s=t._y1,x=($-i)/3;t._context.bezierCurveTo(i+x,e+x*o,$-x,s-x*n,$,s);}function $(t){this._context=t;}function Rc(t){return new $(t)}$.prototype={areaStart:function(){this._line=0;},areaEnd:function(){this._line=NaN;},lineStart:function(){this._x0=this._x1=this._y0=this._y1=this._t0=NaN,this._point=0;},lineEnd:function(){switch(this._point){case 2:this._context.lineTo(this._x1,this._y1);break;case 3:qb(this,this._t0,Qc(this,this._t0));}(this._line||0!==this._line&&1===this._point)&&this._context.closePath(),this._line=1-this._line;},point:function(t,o){var n=NaN;if(o=+o,(t=+t)!==this._x1||o!==this._y1){switch(this._point){case 0:this._point=1,this._line?this._context.lineTo(t,o):this._context.moveTo(t,o);break;case 1:this._point=2;break;case 2:this._point=3,qb(this,Qc(this,n=Pc(this,t,o)),n);break;default:qb(this,this._t0,n=Pc(this,t,o));}this._x0=this._x1,this._x1=t,this._y0=this._y1,this._y1=o,this._t0=n;}}},Object.create($.prototype).point=function(t,o){$.prototype.point.call(this,o,t);};const q={top:50,right:30,bottom:50,left:50};class Ag{constructor(t,{title:i,xLabel:o,yLabel:e,data:{labels:s,datasets:r},options:a}){this.options=vg({unxkcdify:!1,yTickCount:3,legendPosition:b.positionType.upLeft,dataColors:O,fontFamily:"xkcd",strokeColor:"black",backgroundColor:"white",showLegend:!0},a),i&&(this.title=i,q.top=60),o&&(this.xLabel=o,q.bottom=50),e&&(this.yLabel=e,q.left=70),this.data={labels:s,datasets:r},this.filter="url(#xkcdify)",this.fontFamily=this.options.fontFamily||"xkcd",this.options.unxkcdify&&(this.filter=null,this.fontFamily="-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"),this.svgEl=f(t).style("stroke-width","3").style("font-family",this.fontFamily).style("background",this.options.backgroundColor).attr("width",t.parentElement.clientWidth).attr("height",Math.min(2*t.parentElement.clientWidth/3,window.innerHeight)),this.svgEl.selectAll("*").remove(),this.chart=this.svgEl.append("g").attr("transform",`translate(${q.left},${q.top})`),this.width=this.svgEl.attr("width")-q.left-q.right,this.height=this.svgEl.attr("height")-q.top-q.bottom,M(this.svgEl),N(this.svgEl),this.render();}render(){this.title&&k.title(this.svgEl,this.title,this.options.strokeColor),this.xLabel&&k.xLabel(this.svgEl,this.xLabel,this.options.strokeColor),this.yLabel&&k.yLabel(this.svgEl,this.yLabel,this.options.strokeColor);const t=new L({parent:this.svgEl,title:"",items:[{color:"red",text:"weweyang"},{color:"blue",text:"timqian"}],position:{x:60,y:60,type:b.positionType.downRight},unxkcdify:this.options.unxkcdify,backgroundColor:this.options.backgroundColor,strokeColor:this.options.strokeColor}),i=Qe().domain(this.data.labels).range([0,this.width]),o=this.data.datasets.reduce((t,i)=>t.concat(i.data),[]),e=A().domain([Math.min(...o),Math.max(...o)]).range([this.height,0]),s=this.chart.append("g").attr("pointer-events","all");y.xAxis(s,{xScale:i,tickCount:3,moveDown:this.height,fontFamily:this.fontFamily,unxkcdify:this.options.unxkcdify,stroke:this.options.strokeColor}),y.yAxis(s,{yScale:e,tickCount:this.options.yTickCount||3,fontFamily:this.fontFamily,unxkcdify:this.options.unxkcdify,stroke:this.options.strokeColor}),this.svgEl.selectAll(".domain").attr("filter",this.filter);const r=pb().x((t,o)=>i(this.data.labels[o])).y(t=>e(t)).curve(Rc);s.selectAll(".xkcd-chart-line").data(this.data.datasets).enter().append("path").attr("class","xkcd-chart-line").attr("d",t=>r(t.data)).attr("fill","none").attr("stroke",(t,i)=>this.options.dataColors[i]).attr("filter",this.filter);const a=s.append("line").attr("x1",30).attr("y1",0).attr("x2",30).attr("y2",this.height).attr("stroke","#aaa").attr("stroke-width",1.5).attr("stroke-dasharray","7,7").style("visibility","hidden"),l=this.data.datasets.map((t,i)=>s.append("circle").style("stroke",this.options.dataColors[i]).style("fill",this.options.dataColors[i]).attr("r",3.5).style("visibility","hidden"));if(s.append("rect").attr("width",this.width).attr("height",this.height).attr("fill","none").on("mouseover",()=>{l.forEach(t=>t.style("visibility","visible")),a.style("visibility","visible"),t.show();}).on("mouseout",()=>{l.forEach(t=>t.style("visibility","hidden")),a.style("visibility","hidden"),t.hide();}).on("mousemove",(o,s,r)=>{const n=w(r[s])[0]+q.left+10,$=w(r[s])[1]+q.top+10,h=this.data.labels.map(t=>i(t)+q.left).map(t=>Math.abs(t-w(r[s])[0]-q.left)),d=h.indexOf(Math.min(...h));a.attr("x1",i(this.data.labels[d])).attr("x2",i(this.data.labels[d])),this.data.datasets.forEach((t,o)=>{l[o].style("visibility","visible").attr("cx",i(this.data.labels[d])).attr("cy",e(t.data[d]));});const m=this.data.datasets.map((t,i)=>({color:this.options.dataColors[i],text:`${this.data.datasets[i].label||""}: ${this.data.datasets[i].data[d]}`}));let p=b.positionType.downRight;n>this.width/2&&$<this.height/2?p=b.positionType.downLeft:n>this.width/2&&$>this.height/2?p=b.positionType.upLeft:n<this.width/2&&$>this.height/2&&(p=b.positionType.upRight),t.update({title:this.data.labels[d],items:m,position:{x:n,y:$,type:p}});}),this.options.showLegend){const t=this.data.datasets.map((t,i)=>({color:this.options.dataColors[i],text:t.label}));Z(s,{items:t,position:this.options.legendPosition,unxkcdify:this.options.unxkcdify,parentWidth:this.width,parentHeight:this.height,backgroundColor:this.options.backgroundColor,strokeColor:this.options.strokeColor});}}update(){}}function Sc(t,o){var i=Object.keys(t);if(Object.getOwnPropertySymbols){var e=Object.getOwnPropertySymbols(t);o&&(e=e.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),i.push.apply(i,e);}return i}function Bg(t){for(var o=1;o<arguments.length;o++){var i=null!=arguments[o]?arguments[o]:{};o%2?Sc(i,!0).forEach(function(o){Cg(t,o,i[o]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(i)):Sc(i).forEach(function(o){Object.defineProperty(t,o,Object.getOwnPropertyDescriptor(i,o));});}return t}function Cg(t,o,i){return o in t?Object.defineProperty(t,o,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[o]=i,t}var rb=new Date,sb=new Date;function d(t,r,e,n){function o(r){return t(r=new Date(+r)),r}return o.floor=o,o.ceil=function(e){return t(e=new Date(e-1)),r(e,1),t(e),e},o.round=function(t){var r=o(t),e=o.ceil(t);return t-r<e-t?r:e},o.offset=function(t,e){return r(t=new Date(+t),null==e?1:Math.floor(e)),t},o.range=function(e,n,$){var u,f=[];if(e=o.ceil(e),$=null==$?1:Math.floor($),!(e<n&&$>0))return f;do{f.push(u=new Date(+e)),r(e,$),t(e);}while(u<e&&e<n);return f},o.filter=function(e){return d(function(r){if(r>=r)for(;t(r),!e(r);)r.setTime(r-1);},function(t,n){if(t>=t)if(n<0)for(;++n<=0;)for(;r(t,-1),!e(t););else for(;--n>=0;)for(;r(t,1),!e(t););})},e&&(o.count=function(r,n){return rb.setTime(+r),sb.setTime(+n),t(rb),t(sb),Math.floor(e(rb,sb))},o.every=function(t){return t=Math.floor(t),isFinite(t)&&t>0?t>1?o.filter(n?function(r){return n(r)%t==0}:function(r){return o.count(0,r)%t==0}):o:null}),o}var wa=d(function(){},function(e,t){e.setTime(+e+t);},function(e,t){return t-e});wa.every=function(e){return e=Math.floor(e),isFinite(e)&&e>0?e>1?d(function(t){t.setTime(Math.floor(t/e)*e);},function(t,$){t.setTime(+t+$*e);},function(t,$){return ($-t)/e}):wa:null};var xa=1e3;var D=6e4;var ya=36e5;var Tc=864e5;var Uc=6048e5;var Vc=d(function(e){e.setTime(e-e.getMilliseconds());},function(e,$){e.setTime(+e+$*xa);},function(e,$){return ($-e)/xa},function(e){return e.getUTCSeconds()});var Wc=d(function(e){e.setTime(e-e.getMilliseconds()-e.getSeconds()*xa);},function(e,t){e.setTime(+e+t*D);},function(e,t){return (t-e)/D},function(e){return e.getMinutes()});var Xc=d(function(r){r.setTime(r-r.getMilliseconds()-r.getSeconds()*xa-r.getMinutes()*D);},function(r,$){r.setTime(+r+$*ya);},function(r,$){return ($-r)/ya},function(r){return r.getHours()});var za=d(function(r){r.setHours(0,0,0,0);},function(r,e){r.setDate(r.getDate()+e);},function(r,e){return (e-r-(e.getTimezoneOffset()-r.getTimezoneOffset())*D)/Tc},function(r){return r.getDate()-1});function r(e){return d(function($){$.setDate($.getDate()-($.getDay()+7-e)%7),$.setHours(0,0,0,0);},function(e,$){e.setDate(e.getDate()+7*$);},function(e,$){return ($-e-($.getTimezoneOffset()-e.getTimezoneOffset())*D)/Uc})}var tb=r(0);var Aa=r(1);var Dg=r(2);var Eg=r(3);var Ba=r(4);var Fg=r(5);var Gg=r(6);var Yc=d(function(t){t.setDate(1),t.setHours(0,0,0,0);},function(t,e){t.setMonth(t.getMonth()+e);},function(t,e){return e.getMonth()-t.getMonth()+12*(e.getFullYear()-t.getFullYear())},function(t){return t.getMonth()});var o=d(function(e){e.setMonth(0,1),e.setHours(0,0,0,0);},function(e,t){e.setFullYear(e.getFullYear()+t);},function(e,t){return t.getFullYear()-e.getFullYear()},function(e){return e.getFullYear()});o.every=function(e){return isFinite(e=Math.floor(e))&&e>0?d(function(t){t.setFullYear(Math.floor(t.getFullYear()/e)*e),t.setMonth(0,1),t.setHours(0,0,0,0);},function(t,r){t.setFullYear(t.getFullYear()+r*e);}):null};var Hg=d(function(t){t.setUTCSeconds(0,0);},function(t,e){t.setTime(+t+e*D);},function(t,e){return (e-t)/D},function(t){return t.getUTCMinutes()});var Ig=d(function(r){r.setUTCMinutes(0,0,0);},function(r,$){r.setTime(+r+$*ya);},function(r,$){return ($-r)/ya},function(r){return r.getUTCHours()});var ub=d(function(t){t.setUTCHours(0,0,0,0);},function(t,$){t.setUTCDate(t.getUTCDate()+$);},function(t,$){return ($-t)/Tc},function(t){return t.getUTCDate()-1});function E($){return d(function(t){t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+7-$)%7),t.setUTCHours(0,0,0,0);},function($,t){$.setUTCDate($.getUTCDate()+7*t);},function($,t){return (t-$)/Uc})}var Zc=E(0);var Ca=E(1);var Jg=E(2);var Kg=E(3);var Da=E(4);var Lg=E(5);var Mg=E(6);var Ng=d(function(t){t.setUTCDate(1),t.setUTCHours(0,0,0,0);},function(t,e){t.setUTCMonth(t.getUTCMonth()+e);},function(t,e){return e.getUTCMonth()-t.getUTCMonth()+12*(e.getUTCFullYear()-t.getUTCFullYear())},function(t){return t.getUTCMonth()});var F=d(function(e){e.setUTCMonth(0,1),e.setUTCHours(0,0,0,0);},function(e,t){e.setUTCFullYear(e.getUTCFullYear()+t);},function(e,t){return t.getUTCFullYear()-e.getUTCFullYear()},function(e){return e.getUTCFullYear()});F.every=function(e){return isFinite(e=Math.floor(e))&&e>0?d(function(t){t.setUTCFullYear(Math.floor(t.getUTCFullYear()/e)*e),t.setUTCMonth(0,1),t.setUTCHours(0,0,0,0);},function(t,r){t.setUTCFullYear(t.getUTCFullYear()+r*e);}):null};var aa,Og,Oi,Pg,Qg;function Rg($){return aa=Tg($),Og=aa.format,Oi=aa.parse,Pg=aa.utcFormat,Qg=aa.utcParse,aa}function Sg(r){if(0<=r.y&&r.y<100){var $=new Date(-1,r.m,r.d,r.H,r.M,r.S,r.L);return $.setFullYear(r.y),$}return new Date(r.y,r.m,r.d,r.H,r.M,r.S,r.L)}function Ea(r){if(0<=r.y&&r.y<100){var $=new Date(Date.UTC(-1,r.m,r.d,r.H,r.M,r.S,r.L));return $.setUTCFullYear(r.y),$}return new Date(Date.UTC(r.y,r.m,r.d,r.H,r.M,r.S,r.L))}function ba(r){return {y:r,m:0,d:1,H:0,M:0,S:0,L:0}}function Tg(r){var $=r.dateTime,e=r.date,a=r.time,t=r.periods,U=r.days,n=r.shortDays,o=r.months,u=r.shortMonths,b=ca(t),i=da(t),H=ca(U),v=da(U),c=ca(n),f=da(n),m=ca(o),s=da(o),l=ca(u),d=da(u),p={a:function(r){return n[r.getDay()]},A:function(r){return U[r.getDay()]},b:function(r){return u[r.getMonth()]},B:function(r){return o[r.getMonth()]},c:null,d:bd,e:bd,f:ph,H:mh,I:nh,j:oh,L:cd,m:qh,M:rh,p:function(r){return t[+(r.getHours()>=12)]},Q:gd,s:hd,S:sh,u:th,U:uh,V:vh,w:wh,W:xh,x:null,X:null,y:yh,Y:zh,Z:Ah,"%":fd},y={a:function(r){return n[r.getUTCDay()]},A:function(r){return U[r.getUTCDay()]},b:function(r){return u[r.getUTCMonth()]},B:function(r){return o[r.getUTCMonth()]},c:null,d:dd,e:dd,f:Eh,H:Bh,I:Ch,j:Dh,L:ed,m:Fh,M:Gh,p:function(r){return t[+(r.getUTCHours()>=12)]},Q:gd,s:hd,S:Hh,u:Ih,U:Jh,V:Kh,w:Lh,W:Mh,x:null,X:null,y:Nh,Y:Oh,Z:Ph,"%":fd},g={a:function(r,$,e){var a=c.exec($.slice(e));return a?(r.w=f[a[0].toLowerCase()],e+a[0].length):-1},A:function(r,$,e){var a=H.exec($.slice(e));return a?(r.w=v[a[0].toLowerCase()],e+a[0].length):-1},b:function(r,$,e){var a=l.exec($.slice(e));return a?(r.m=d[a[0].toLowerCase()],e+a[0].length):-1},B:function(r,$,e){var a=m.exec($.slice(e));return a?(r.m=s[a[0].toLowerCase()],e+a[0].length):-1},c:function(r,e,a){return h(r,$,e,a)},d:_c,e:_c,f:ih,H:ad,I:ad,j:eh,L:hh,m:dh,M:fh,p:function(r,$,e){var a=b.exec($.slice(e));return a?(r.p=i[a[0].toLowerCase()],e+a[0].length):-1},Q:kh,s:lh,S:gh,u:Yg,U:Zg,V:$g,w:Xg,W:_g,x:function(r,$,a){return h(r,e,$,a)},X:function(r,$,e){return h(r,a,$,e)},y:bh,Y:ah,Z:ch,"%":jh};function T(r,$){return function(e){var a,t,U,n=[],o=-1,u=0,b=r.length;for(e instanceof Date||(e=new Date(+e));++o<b;)37===r.charCodeAt(o)&&(n.push(r.slice(u,o)),null!=(t=$c[a=r.charAt(++o)])?a=r.charAt(++o):t="e"===a?" ":"0",(U=$[a])&&(a=U(e,t)),n.push(a),u=o+1);return n.push(r.slice(u,o)),n.join("")}}function M(r,$){return function(e){var a,t,U=ba(1900);if(h(U,r,e+="",0)!=e.length)return null;if("Q"in U)return new Date(U.Q);if("p"in U&&(U.H=U.H%12+12*U.p),"V"in U){if(U.V<1||U.V>53)return null;"w"in U||(U.w=1),"Z"in U?(t=(a=Ea(ba(U.y))).getUTCDay(),a=t>4||0===t?Ca.ceil(a):Ca(a),a=ub.offset(a,7*(U.V-1)),U.y=a.getUTCFullYear(),U.m=a.getUTCMonth(),U.d=a.getUTCDate()+(U.w+6)%7):(t=(a=$(ba(U.y))).getDay(),a=t>4||0===t?Aa.ceil(a):Aa(a),a=za.offset(a,7*(U.V-1)),U.y=a.getFullYear(),U.m=a.getMonth(),U.d=a.getDate()+(U.w+6)%7);}else ("W"in U||"U"in U)&&("w"in U||(U.w="u"in U?U.u%7:"W"in U?1:0),t="Z"in U?Ea(ba(U.y)).getUTCDay():$(ba(U.y)).getDay(),U.m=0,U.d="W"in U?(U.w+6)%7+7*U.W-(t+5)%7:U.w+7*U.U-(t+6)%7);return "Z"in U?(U.H+=U.Z/100|0,U.M+=U.Z%100,Ea(U)):$(U)}}function h(r,$,e,a){for(var t,U,n=0,o=$.length,u=e.length;n<o;){if(a>=u)return -1;if(37===(t=$.charCodeAt(n++))){if(t=$.charAt(n++),!(U=g[t in $c?$.charAt(n++):t])||(a=U(r,e,a))<0)return -1}else if(t!=e.charCodeAt(a++))return -1}return a}return p.x=T(e,p),p.X=T(a,p),p.c=T($,p),y.x=T(e,y),y.X=T(a,y),y.c=T($,y),{format:function(r){var $=T(r+="",p);return $.toString=function(){return r},$},parse:function(r){var $=M(r+="",Sg);return $.toString=function(){return r},$},utcFormat:function(r){var $=T(r+="",y);return $.toString=function(){return r},$},utcParse:function(r){var $=M(r,Ea);return $.toString=function(){return r},$}}}var $c={"-":"",_:" ",0:"0"},h=/^\s*\d+/,Ug=/^%/,Vg=/[\\^$*+?|[\]().{}]/g;function a(r,$,e){var a=r<0?"-":"",t=(a?-r:r)+"",U=t.length;return a+(U<e?new Array(e-U+1).join($)+t:t)}function Wg(r){return r.replace(Vg,"\\$&")}function ca(r){return new RegExp("^(?:"+r.map(Wg).join("|")+")","i")}function da(r){for(var $={},e=-1,a=r.length;++e<a;)$[r[e].toLowerCase()]=e;return $}function Xg(r,$,e){var a=h.exec($.slice(e,e+1));return a?(r.w=+a[0],e+a[0].length):-1}function Yg(r,$,e){var a=h.exec($.slice(e,e+1));return a?(r.u=+a[0],e+a[0].length):-1}function Zg(r,$,e){var a=h.exec($.slice(e,e+2));return a?(r.U=+a[0],e+a[0].length):-1}function $g(r,$,e){var a=h.exec($.slice(e,e+2));return a?(r.V=+a[0],e+a[0].length):-1}function _g(r,$,e){var a=h.exec($.slice(e,e+2));return a?(r.W=+a[0],e+a[0].length):-1}function ah(r,$,e){var a=h.exec($.slice(e,e+4));return a?(r.y=+a[0],e+a[0].length):-1}function bh(r,$,e){var a=h.exec($.slice(e,e+2));return a?(r.y=+a[0]+(+a[0]>68?1900:2e3),e+a[0].length):-1}function ch(r,$,e){var a=/^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec($.slice(e,e+6));return a?(r.Z=a[1]?0:-(a[2]+(a[3]||"00")),e+a[0].length):-1}function dh(r,$,e){var a=h.exec($.slice(e,e+2));return a?(r.m=a[0]-1,e+a[0].length):-1}function _c(r,$,e){var a=h.exec($.slice(e,e+2));return a?(r.d=+a[0],e+a[0].length):-1}function eh(r,$,e){var a=h.exec($.slice(e,e+3));return a?(r.m=0,r.d=+a[0],e+a[0].length):-1}function ad(r,$,e){var a=h.exec($.slice(e,e+2));return a?(r.H=+a[0],e+a[0].length):-1}function fh(r,$,e){var a=h.exec($.slice(e,e+2));return a?(r.M=+a[0],e+a[0].length):-1}function gh(r,$,e){var a=h.exec($.slice(e,e+2));return a?(r.S=+a[0],e+a[0].length):-1}function hh(r,$,e){var a=h.exec($.slice(e,e+3));return a?(r.L=+a[0],e+a[0].length):-1}function ih(r,$,e){var a=h.exec($.slice(e,e+6));return a?(r.L=Math.floor(a[0]/1e3),e+a[0].length):-1}function jh(r,$,e){var a=Ug.exec($.slice(e,e+1));return a?e+a[0].length:-1}function kh(r,$,e){var a=h.exec($.slice(e));return a?(r.Q=+a[0],e+a[0].length):-1}function lh(r,$,e){var a=h.exec($.slice(e));return a?(r.Q=1e3*+a[0],e+a[0].length):-1}function bd(r,$){return a(r.getDate(),$,2)}function mh(r,$){return a(r.getHours(),$,2)}function nh(r,$){return a(r.getHours()%12||12,$,2)}function oh(r,$){return a(1+za.count(o(r),r),$,3)}function cd(r,$){return a(r.getMilliseconds(),$,3)}function ph(r,$){return cd(r,$)+"000"}function qh(r,$){return a(r.getMonth()+1,$,2)}function rh(r,$){return a(r.getMinutes(),$,2)}function sh(r,$){return a(r.getSeconds(),$,2)}function th(r){var $=r.getDay();return 0===$?7:$}function uh(r,$){return a(tb.count(o(r),r),$,2)}function vh(r,$){var e=r.getDay();return r=e>=4||0===e?Ba(r):Ba.ceil(r),a(Ba.count(o(r),r)+(4===o(r).getDay()),$,2)}function wh(r){return r.getDay()}function xh(r,$){return a(Aa.count(o(r),r),$,2)}function yh(r,$){return a(r.getFullYear()%100,$,2)}function zh(r,$){return a(r.getFullYear()%1e4,$,4)}function Ah(r){var $=r.getTimezoneOffset();return ($>0?"-":($*=-1,"+"))+a($/60|0,"0",2)+a($%60,"0",2)}function dd(r,$){return a(r.getUTCDate(),$,2)}function Bh(r,$){return a(r.getUTCHours(),$,2)}function Ch(r,$){return a(r.getUTCHours()%12||12,$,2)}function Dh(r,$){return a(1+ub.count(F(r),r),$,3)}function ed(r,$){return a(r.getUTCMilliseconds(),$,3)}function Eh(r,$){return ed(r,$)+"000"}function Fh(r,$){return a(r.getUTCMonth()+1,$,2)}function Gh(r,$){return a(r.getUTCMinutes(),$,2)}function Hh(r,$){return a(r.getUTCSeconds(),$,2)}function Ih(r){var $=r.getUTCDay();return 0===$?7:$}function Jh(r,$){return a(Zc.count(F(r),r),$,2)}function Kh(r,$){var e=r.getUTCDay();return r=e>=4||0===e?Da(r):Da.ceil(r),a(Da.count(F(r),r)+(4===F(r).getUTCDay()),$,2)}function Lh(r){return r.getUTCDay()}function Mh(r,$){return a(Ca.count(F(r),r),$,2)}function Nh(r,$){return a(r.getUTCFullYear()%100,$,2)}function Oh(r,$){return a(r.getUTCFullYear()%1e4,$,4)}function Ph(){return "+0000"}function fd(){return "%"}function gd(r){return +r}function hd(r){return Math.floor(+r/1e3)}Rg({dateTime:"%x, %X",date:"%-m/%-d/%Y",time:"%-I:%M:%S %p",periods:["AM","PM"],days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],shortDays:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],months:["January","February","March","April","May","June","July","August","September","October","November","December"],shortMonths:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]});var id="%Y-%m-%dT%H:%M:%S.%LZ";function Qh($){return $.toISOString()}var Pi=Date.prototype.toISOString?Qh:Pg(id);function Rh(e){var $=new Date(e);return isNaN($)?null:$}var Qi=+new Date("2000-01-01T00:00:00.000Z")?Rh:Qg(id);var Sh=function(e,t){var $,r=0,M=(e=e.slice()).length-1,l=e[r],o=e[M];return o<l&&($=r,r=M,M=$,$=l,l=o,o=$),e[r]=t.floor(l),e[M]=t.ceil(o),e};var ea=1e3,fa=60*ea,ga=60*fa,ha=24*ga,Th=7*ha,jd=30*ha,vb=365*ha;function Uh(t){return new Date(t)}function Vh(t){return t instanceof Date?+t:+new Date(+t)}function kd(t,$,r,a,n,e,i,o,u){var k=Bc(z,z),V=k.invert,X=k.domain,d=u(".%L"),v=u(":%S"),c=u("%I:%M"),p=u("%I %p"),m=u("%a %d"),l=u("%b %d"),f=u("%B"),y=u("%Y"),M=[[i,1,ea],[i,5,5*ea],[i,15,15*ea],[i,30,30*ea],[e,1,fa],[e,5,5*fa],[e,15,15*fa],[e,30,30*fa],[n,1,ga],[n,3,3*ga],[n,6,6*ga],[n,12,12*ga],[a,1,ha],[a,2,2*ha],[r,1,Th],[$,1,jd],[$,3,3*jd],[t,1,vb]];function D(o){return (i(o)<o?d:e(o)<o?v:n(o)<o?c:a(o)<o?p:$(o)<o?r(o)<o?m:l:t(o)<o?f:y)(o)}function h($,r,a){if(null==$&&($=10),"number"==typeof $){var n,e=Math.abs(a-r)/$,i=Pb(function(t){return t[2]}).right(M,e);return i===M.length?(n=Ma(r/vb,a/vb,$),$=t):i?(n=(i=M[e/M[i-1][2]<M[i][2]/e?i-1:i])[1],$=i[0]):(n=Math.max(Ma(r,a,$),1),$=o),$.every(n)}return $}return k.invert=function(t){return new Date(V(t))},k.domain=function(t){return arguments.length?X(Array.from(t,Vh)):X().map(Uh)},k.ticks=function(t){var $,r=X(),a=r[0],n=r[r.length-1],e=n<a;return e&&($=a,a=n,n=$),$=($=h(t,a,n))?$.range(a,n+1):[],e?$.reverse():$},k.tickFormat=function(t,$){return null==$?D:u($)},k.nice=function(t){var $=X();return (t=h(t,$[0],$[$.length-1]))?X(Sh($,t)):k},k.copy=function(){return Ac(k,kd(t,$,r,a,n,e,i,o,u))},k}var Wh=function(){return la.apply(kd(o,Yc,tb,za,Xc,Wc,Vc,wa,Og).domain([new Date(2e3,0,1),new Date(2e3,0,2)]),arguments)};var Fa={};!function(t,n){"object"==typeof Fa?Fa=n():t.dayjs=n();}(Fa,function(){var t="millisecond",n="second",e="minute",r="hour",i="day",s="week",u="month",a="quarter",o="year",h=/^(\d{4})-?(\d{1,2})-?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?.?(\d{1,3})?$/,f=/\[([^\]]+)]|Y{2,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,c=function(t,n,e){var r=String(t);return !r||r.length>=n?t:""+Array(n+1-r.length).join(e)+t},d={s:c,z:function(t){var n=-t.utcOffset(),e=Math.abs(n),r=Math.floor(e/60),i=e%60;return (n<=0?"+":"-")+c(r,2,"0")+":"+c(i,2,"0")},m:function(t,n){var e=12*(n.year()-t.year())+(n.month()-t.month()),r=t.clone().add(e,u),i=n-r<0,s=t.clone().add(e+(i?-1:1),u);return Number(-(e+(n-r)/(i?r-s:s-r))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(h){return {M:u,y:o,w:s,d:i,h:r,m:e,s:n,ms:t,Q:a}[h]||String(h||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},$={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},l="en",m={};m[l]=$;var y=function(t){return t instanceof v},M=function(t,n,e){var r;if(!t)return l;if("string"==typeof t)m[t]&&(r=t),n&&(m[t]=n,r=t);else {var i=t.name;m[i]=t,r=i;}return e||(l=r),r},g=function(t,n,e){if(y(t))return t.clone();var r=n?"string"==typeof n?{format:n,pl:e}:n:{};return r.date=t,new v(r)},D=d;D.l=M,D.i=y,D.w=function(t,n){return g(t,{locale:n.$L,utc:n.$u})};var v=function(){function c(t){this.$L=this.$L||M(t.locale,null,!0),this.parse(t);}var d=c.prototype;return d.parse=function(t){this.$d=function(t){var n=t.date,e=t.utc;if(null===n)return new Date(NaN);if(D.u(n))return new Date;if(n instanceof Date)return new Date(n);if("string"==typeof n&&!/Z$/i.test(n)){var r=n.match(h);if(r)return e?new Date(Date.UTC(r[1],r[2]-1,r[3]||1,r[4]||0,r[5]||0,r[6]||0,r[7]||0)):new Date(r[1],r[2]-1,r[3]||1,r[4]||0,r[5]||0,r[6]||0,r[7]||0)}return new Date(n)}(t),this.init();},d.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds();},d.$utils=function(){return D},d.isValid=function(){return !("Invalid Date"===this.$d.toString())},d.isSame=function(t,n){var e=g(t);return this.startOf(n)<=e&&e<=this.endOf(n)},d.isAfter=function(t,n){return g(t)<this.startOf(n)},d.isBefore=function(t,n){return this.endOf(n)<g(t)},d.$g=function(t,n,e){return D.u(t)?this[n]:this.set(e,t)},d.year=function(t){return this.$g(t,"$y",o)},d.month=function(t){return this.$g(t,"$M",u)},d.day=function(t){return this.$g(t,"$W",i)},d.date=function(t){return this.$g(t,"$D","date")},d.hour=function(t){return this.$g(t,"$H",r)},d.minute=function(t){return this.$g(t,"$m",e)},d.second=function(t){return this.$g(t,"$s",n)},d.millisecond=function(n){return this.$g(n,"$ms",t)},d.unix=function(){return Math.floor(this.valueOf()/1e3)},d.valueOf=function(){return this.$d.getTime()},d.startOf=function(t,a){var h=this,f=!!D.u(a)||a,c=D.p(t),d=function(t,n){var e=D.w(h.$u?Date.UTC(h.$y,n,t):new Date(h.$y,n,t),h);return f?e:e.endOf(i)},$=function(t,n){return D.w(h.toDate()[t].apply(h.toDate(),(f?[0,0,0,0]:[23,59,59,999]).slice(n)),h)},l=this.$W,m=this.$M,y=this.$D,M="set"+(this.$u?"UTC":"");switch(c){case o:return f?d(1,0):d(31,11);case u:return f?d(1,m):d(0,m+1);case s:var g=this.$locale().weekStart||0,v=(l<g?l+7:l)-g;return d(f?y-v:y+(6-v),m);case i:case"date":return $(M+"Hours",0);case r:return $(M+"Minutes",1);case e:return $(M+"Seconds",2);case n:return $(M+"Milliseconds",3);default:return this.clone();}},d.endOf=function(t){return this.startOf(t,!1)},d.$set=function(s,a){var h,f=D.p(s),c="set"+(this.$u?"UTC":""),d=(h={},h[i]=c+"Date",h.date=c+"Date",h[u]=c+"Month",h[o]=c+"FullYear",h[r]=c+"Hours",h[e]=c+"Minutes",h[n]=c+"Seconds",h[t]=c+"Milliseconds",h)[f],$=f===i?this.$D+(a-this.$W):a;if(f===u||f===o){var l=this.clone().set("date",1);l.$d[d]($),l.init(),this.$d=l.set("date",Math.min(this.$D,l.daysInMonth())).toDate();}else d&&this.$d[d]($);return this.init(),this},d.set=function(t,n){return this.clone().$set(t,n)},d.get=function(t){return this[D.p(t)]()},d.add=function(t,a){var h,f=this;t=Number(t);var c=D.p(a),d=function(n){var e=g(f);return D.w(e.date(e.date()+Math.round(n*t)),f)};if(c===u)return this.set(u,this.$M+t);if(c===o)return this.set(o,this.$y+t);if(c===i)return d(1);if(c===s)return d(7);var $=(h={},h[e]=6e4,h[r]=36e5,h[n]=1e3,h)[c]||1,l=this.valueOf()+t*$;return D.w(l,this)},d.subtract=function(t,n){return this.add(-1*t,n)},d.format=function(t){var n=this;if(!this.isValid())return "Invalid Date";var e=t||"YYYY-MM-DDTHH:mm:ssZ",r=D.z(this),i=this.$locale(),s=this.$H,u=this.$m,a=this.$M,o=i.weekdays,h=i.months,c=function(t,r,i,s){return t&&(t[r]||t(n,e))||i[r].substr(0,s)},d=function(t){return D.s(s%12||12,t,"0")},$=i.meridiem||function(t,n,e){var r=t<12?"AM":"PM";return e?r.toLowerCase():r},l={YY:String(this.$y).slice(-2),YYYY:this.$y,M:a+1,MM:D.s(a+1,2,"0"),MMM:c(i.monthsShort,a,h,3),MMMM:h[a]||h(this,e),D:this.$D,DD:D.s(this.$D,2,"0"),d:String(this.$W),dd:c(i.weekdaysMin,this.$W,o,2),ddd:c(i.weekdaysShort,this.$W,o,3),dddd:o[this.$W],H:String(s),HH:D.s(s,2,"0"),h:d(1),hh:d(2),a:$(s,u,!0),A:$(s,u,!1),m:String(u),mm:D.s(u,2,"0"),s:String(this.$s),ss:D.s(this.$s,2,"0"),SSS:D.s(this.$ms,3,"0"),Z:r};return e.replace(f,function(t,n){return n||l[t]||r.replace(":","")})},d.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},d.diff=function(t,h,f){var c,d=D.p(h),$=g(t),l=6e4*($.utcOffset()-this.utcOffset()),m=this-$,y=D.m(this,$);return y=(c={},c[o]=y/12,c[u]=y,c[a]=y/3,c[s]=(m-l)/6048e5,c[i]=(m-l)/864e5,c[r]=m/36e5,c[e]=m/6e4,c[n]=m/1e3,c)[d]||m,f?y:D.a(y)},d.daysInMonth=function(){return this.endOf(u).$D},d.$locale=function(){return m[this.$L]},d.locale=function(t,n){if(!t)return this.$L;var e=this.clone();return e.$L=M(t,n,!0),e},d.clone=function(){return D.w(this.toDate(),this)},d.toDate=function(){return new Date(this.$d)},d.toJSON=function(){return this.toISOString()},d.toISOString=function(){return this.$d.toISOString()},d.toString=function(){return this.$d.toUTCString()},c}();return g.prototype=v.prototype,g.extend=function(t,n){return t(n,v,g),g},g.locale=M,g.isDayjs=y,g.unix=function(t){return g(1e3*t)},g.en=m[l],g.Ls=m,g});const u={top:50,right:30,bottom:50,left:50};class Xh{constructor(t,{title:o,xLabel:i,yLabel:e,data:{datasets:r},options:s}){this.options=Bg({unxkcdify:!1,dotSize:1,showLine:!1,timeFormat:"",xTickCount:3,yTickCount:3,legendPosition:b.positionType.upLeft,dataColors:O,fontFamily:"xkcd",strokeColor:"black",backgroundColor:"white",showLegend:!0},s),o&&(this.title=o,u.top=60),i&&(this.xLabel=i,u.bottom=50),e&&(this.yLabel=e,u.left=70),this.data={datasets:r},this.filter="url(#xkcdify)",this.fontFamily=this.options.fontFamily||"xkcd",this.options.unxkcdify&&(this.filter=null,this.fontFamily="-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"),this.svgEl=f(t).style("stroke-width",3).style("font-family",this.fontFamily).style("background",this.options.backgroundColor).attr("width",t.parentElement.clientWidth).attr("height",Math.min(2*t.parentElement.clientWidth/3,window.innerHeight)),this.svgEl.selectAll("*").remove(),this.chart=this.svgEl.append("g").attr("transform",`translate(${u.left},${u.top})`),this.width=this.svgEl.attr("width")-u.left-u.right,this.height=this.svgEl.attr("height")-u.top-u.bottom,M(this.svgEl),N(this.svgEl),this.render();}render(){this.title&&k.title(this.svgEl,this.title,this.options.strokeColor),this.xLabel&&k.xLabel(this.svgEl,this.xLabel,this.options.strokeColor),this.yLabel&&k.yLabel(this.svgEl,this.yLabel,this.options.strokeColor);const t=new L({parent:this.svgEl,title:"",items:[{color:"red",text:"weweyang"},{color:"blue",text:"timqian"}],position:{x:60,y:60,type:b.positionType.dowfnRight},unxkcdify:this.options.unxkcdify,strokeColor:this.options.strokeColor,backgroundColor:this.options.backgroundColor});this.options.timeFormat&&this.data.datasets.forEach(t=>{t.data.forEach(t=>{var $dZYI$$interop$default=wb(Fa);t.x=$dZYI$$interop$default.d(t.x);});});const o=this.data.datasets.reduce((t,o)=>t.concat(o.data),[]),i=o.map(t=>t.x),e=o.map(t=>t.y);let r=A().domain([Math.min(...i),Math.max(...i)]).range([0,this.width]);this.options.timeFormat&&(r=Wh().domain([Math.min(...i),Math.max(...i)]).range([0,this.width]));const s=A().domain([Math.min(...e),Math.max(...e)]).range([this.height,0]),a=this.chart.append("g").attr("pointer-events","all");if(y.xAxis(a,{xScale:r,tickCount:void 0===this.options.xTickCount?3:this.options.xTickCount,moveDown:this.height,fontFamily:this.fontFamily,unxkcdify:this.options.unxkcdify,stroke:this.options.strokeColor}),y.yAxis(a,{yScale:s,tickCount:void 0===this.options.yTickCount?3:this.options.yTickCount,fontFamily:this.fontFamily,unxkcdify:this.options.unxkcdify,stroke:this.options.strokeColor}),this.options.showLine){const t=pb().x(t=>r(t.x)).y(t=>s(t.y)).curve(Rc);a.selectAll(".xkcd-chart-xyline").data(this.data.datasets).enter().append("path").attr("class","xkcd-chart-xyline").attr("d",o=>t(o.data)).attr("fill","none").attr("stroke",(t,o)=>this.options.dataColors[o]).attr("filter",this.filter);}const n=3.5*(void 0===this.options.dotSize?1:this.options.dotSize),l=6*(void 0===this.options.dotSize?1:this.options.dotSize);if(a.selectAll(".xkcd-chart-xycircle-group").data(this.data.datasets).enter().append("g").attr("class",".xkcd-chart-xycircle-group").attr("filter",this.filter).attr("xy-group-index",(t,o)=>o).selectAll(".xkcd-chart-xycircle-circle").data(t=>t.data).enter().append("circle").style("stroke",(t,o,i)=>{const e=Number(f(i[o].parentElement).attr("xy-group-index"));return this.options.dataColors[e]}).style("fill",(t,o,i)=>{const e=Number(f(i[o].parentElement).attr("xy-group-index"));return this.options.dataColors[e]}).attr("r",n).attr("cx",t=>r(t.x)).attr("cy",t=>s(t.y)).attr("pointer-events","all").on("mouseover",(o,i,e)=>{const a=Number(f(e[i].parentElement).attr("xy-group-index"));f(e[i]).attr("r",l);const n=r(o.x)+u.left+5,$=s(o.y)+u.top+5;let p=b.positionType.downRight;var $dZYI$$interop$default=wb(Fa);n>this.width/2&&$<this.height/2?p=b.positionType.downLeft:n>this.width/2&&$>this.height/2?p=b.positionType.upLeft:n<this.width/2&&$>this.height/2&&(p=b.positionType.upRight),t.update({title:this.options.timeFormat?$dZYI$$interop$default.d(this.data.datasets[a].data[i].x).format(this.options.timeFormat):`${this.data.datasets[a].data[i].x}`,items:[{color:this.options.dataColors[a],text:`${this.data.datasets[a].label||""}: ${o.y}`}],position:{x:n,y:$,type:p}}),t.show();}).on("mouseout",(o,i,e)=>{f(e[i]).attr("r",n),t.hide();}),this.options.showLegend){const t=this.data.datasets.map((t,o)=>({color:this.options.dataColors[o],text:t.label}));Z(a,{items:t,position:this.options.legendPosition,unxkcdify:this.options.unxkcdify,parentWidth:this.width,parentHeight:this.height,strokeColor:this.options.strokeColor,backgroundColor:this.options.backgroundColor});}}update(){}}function ld(t,e){var a=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})),a.push.apply(a,r);}return a}function Yh(t){for(var e=1;e<arguments.length;e++){var a=null!=arguments[e]?arguments[e]:{};e%2?ld(a,!0).forEach(function(e){Zh(t,e,a[e]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(a)):ld(a).forEach(function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(a,e));});}return t}function Zh(t,e,a){return e in t?Object.defineProperty(t,e,{value:a,enumerable:!0,configurable:!0,writable:!0}):t[e]=a,t}function md(t){this._context=t;}var nd=function(){};md.prototype={areaStart:nd,areaEnd:nd,lineStart:function(){this._point=0;},lineEnd:function(){this._point&&this._context.closePath();},point:function(t,o){t=+t,o=+o,this._point?this._context.lineTo(t,o):(this._point=1,this._context.moveTo(t,o));}};var $h=function(t){return new md(t)};const _h=50,Ga=-Math.PI/2,ai=.2;class bi{constructor(t,{title:e,data:{labels:a,datasets:r},options:i}){this.options=Yh({showLabels:!1,ticksCount:3,showLegend:!1,legendPosition:b.positionType.upLeft,dataColors:O,fontFamily:"xkcd",dotSize:1,strokeColor:"black",backgroundColor:"white"},i),this.title=e,this.data={labels:a,datasets:r},this.directionsCount=r[0].data.length,this.filter="url(#xkcdify-pie)",this.fontFamily=this.options.fontFamily||"xkcd",this.options.unxkcdify&&(this.filter=null,this.fontFamily="-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"),this.svgEl=f(t).style("stroke-width","3").style("font-family",this.fontFamily).style("background",this.options.backgroundColor).attr("width",t.parentElement.clientWidth).attr("height",Math.min(2*t.parentElement.clientWidth/3,window.innerHeight)),this.svgEl.selectAll("*").remove(),this.width=this.svgEl.attr("width"),this.height=this.svgEl.attr("height"),this.chart=this.svgEl.append("g").attr("transform",`translate(${this.width/2},${this.height/2})`),M(this.svgEl),N(this.svgEl),this.render();}render(){this.title&&k.title(this.svgEl,this.title,this.options.strokeColor);const t=new L({parent:this.svgEl,title:"",items:[],position:{x:0,y:0,type:b.positionType.downRight},unxkcdify:this.options.unxkcdify,strokeColor:this.options.strokeColor,backgroundColor:this.options.backgroundColor}),e=3.5*(this.options.dotSize||1),a=6*(this.options.dotSize||1),r=Math.min(this.width,this.height)/2-_h,i=2*Math.PI/this.directionsCount,o=this.data.datasets.reduce((t,e)=>t.concat(e.data),[]),s=Math.max(...o),n=Array(this.directionsCount).fill(s),l=A().domain([0,s]).range([0,r]),h=(t,e)=>l(t)*Math.cos(i*e+Ga),d=(t,e)=>l(t)*Math.sin(i*e+Ga),c=pb().x(h).y(d).curve($h),p=l.ticks(this.options.ticksCount||3),$=this.chart.append("g").attr("class","xkcd-chart-radar-grid").attr("stroke-width","1").attr("filter",this.filter);$.selectAll(".xkcd-chart-radar-level").data(p).enter().append("path").attr("class","xkcd-chart-radar-level").attr("d",t=>c(Array(this.directionsCount).fill(t))).style("fill","none").attr("stroke",this.options.strokeColor).attr("stroke-dasharray","7,7"),$.selectAll(".xkcd-chart-radar-line").data(n).enter().append("line").attr("class",".xkcd-chart-radar-line").attr("stroke",this.options.strokeColor).attr("x1",0).attr("y1",0).attr("x2",h).attr("y2",d),$.selectAll(".xkcd-chart-radar-tick").data(p).enter().append("text").attr("class","xkcd-chart-radar-tick").attr("x",t=>h(t,0)).attr("y",t=>d(t,0)).style("font-size","16").style("fill",this.options.strokeColor).attr("text-anchor","end").attr("dx","-.125em").attr("dy",".35em").text(t=>t),this.options.showLabels&&$.selectAll(".xkcd-chart-radar-label").data(n.map(t=>1.15*t)).enter().append("text").attr("class","xkcd-chart-radar-label").style("font-size","16").style("fill",this.options.strokeColor).attr("x",(t,e)=>(r+10)*Math.cos(i*e+Ga)).attr("y",(t,e)=>(r+10)*Math.sin(i*e+Ga)).attr("dy",".35em").attr("text-anchor",(t,e,a)=>{let r="start";return f(a[e]).attr("x")<0&&(r="end"),r}).text((t,e)=>this.data.labels[e]);const g=this.chart.selectAll(".xkcd-chart-radar-group").data(this.data.datasets).enter().append("g").attr("class","xkcd-chart-radar-group").attr("filter",this.filter).attr("stroke",(t,e)=>this.options.dataColors[e]).attr("fill",(t,e)=>this.options.dataColors[e]);if(g.selectAll("circle").data(t=>t.data).enter().append("circle").attr("r",e).attr("cx",h).attr("cy",d).attr("pointer-events","all").on("mouseover",(e,r,i)=>{f(i[r]).attr("r",a);const o=h(e,r)+this.width/2,s=d(e,r)+this.height/2;let n=b.positionType.downRight;o>this.width/2&&s<this.height/2?n=b.positionType.downLeft:o>this.width/2&&s>this.height/2?n=b.positionType.upLeft:o<this.width/2&&s>this.height/2&&(n=b.positionType.upRight),t.update({title:this.data.labels[r],items:this.data.datasets.map((t,e)=>({color:this.options.dataColors[e],text:`${t.label||""}: ${t.data[r]}`})),position:{x:o,y:s,type:n}}),t.show();}).on("mouseout",(a,r,i)=>{f(i[r]).attr("r",e),t.hide();}),g.selectAll("path").data(t=>[t.data]).enter().append("path").attr("d",c).attr("pointer-events","none").style("fill-opacity",ai),this.options.showLegend){const t=this.data.datasets.map((t,e)=>({color:this.options.dataColors[e],text:t.label||""})),e=this.svgEl.append("g").attr("transform","translate(0, 30)");Z(e,{items:t,position:this.options.legendPosition,unxkcdify:this.options.unxkcdify,parentWidth:this.width,parentHeight:this.height,backgroundColor:this.options.backgroundColor,strokeColor:this.options.strokeColor});}}update(){}}xb={config:b,Bar:ag,StackedBar:dg,Pie:ug,Line:Ag,XY:Xh,Radar:bi};{module.exports=xb;}})();
    });

    var chartXkcd = unwrapExports(dist);

    function getEventsAction(component) {
        return node => {
          const events = Object.keys(component.$$.callbacks);
          const listeners = [];

          events.forEach(
              event => listeners.push(
                  listen(node, event, e =>  bubble(component, e))
                )
            );
      
          return {
            destroy: () => {
                listeners.forEach(
                    listener => listener()
                );
            }
          }
        };
    }

    /* node_modules\svelte-chota\cmp\Container.svelte generated by Svelte v3.24.0 */
    const file = "node_modules\\svelte-chota\\cmp\\Container.svelte";

    function create_fragment(ctx) {
    	let div;
    	let events_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);
    	let div_levels = [/*$$restProps*/ ctx[1]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "container", 1);
    			add_location(div, file, 7, 0, 167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(events_action = /*events*/ ctx[0].call(null, div));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1]]));
    			toggle_class(div, "container", 1);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const omit_props_names = [];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	const events = getEventsAction(current_component);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Container", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("$$scope" in $$new_props) $$invalidate(2, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getEventsAction,
    		current_component,
    		events
    	});

    	return [events, $$restProps, $$scope, $$slots];
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Container",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* node_modules\svelte-chota\cmp\Row.svelte generated by Svelte v3.24.0 */
    const file$1 = "node_modules\\svelte-chota\\cmp\\Row.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let events_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let div_levels = [/*$$restProps*/ ctx[2]];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "row", 1);
    			toggle_class(div, "reverse", /*reverse*/ ctx[0]);
    			add_location(div, file$1, 9, 0, 209);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(events_action = /*events*/ ctx[1].call(null, div));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2]]));
    			toggle_class(div, "row", 1);
    			toggle_class(div, "reverse", /*reverse*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const omit_props_names = ["reverse"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { reverse = false } = $$props;
    	const events = getEventsAction(current_component);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Row", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("reverse" in $$new_props) $$invalidate(0, reverse = $$new_props.reverse);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getEventsAction,
    		current_component,
    		reverse,
    		events
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("reverse" in $$props) $$invalidate(0, reverse = $$new_props.reverse);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [reverse, events, $$restProps, $$scope, $$slots];
    }

    class Row extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { reverse: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Row",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get reverse() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reverse(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-chota\cmp\Col.svelte generated by Svelte v3.24.0 */
    const file$2 = "node_modules\\svelte-chota\\cmp\\Col.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let events_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);
    	let div_levels = [/*$$restProps*/ ctx[2], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$2, 31, 0, 889);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(events_action = /*events*/ ctx[1].call(null, div));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const omit_props_names = ["size","sizeMD","sizeLG"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { size = false } = $$props;
    	let { sizeMD = false } = $$props;
    	let { sizeLG = false } = $$props;
    	const events = getEventsAction(current_component);

    	function get_col_classes(d, md, lg) {
    		let list = [];
    		if (!size || (size < 1 || size > 12)) list.push("col"); else if (size >= 1 && size <= 12) list.push(`col-${size}`);
    		if (sizeMD) if (sizeMD >= 1 && sizeMD <= 12) list.push(`col-${sizeMD}-md`);
    		if (sizeLG) if (sizeLG >= 1 && sizeLG <= 12) list.push(`col-${sizeLG}-lg`);
    		return list.join(" ");
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Col", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("size" in $$new_props) $$invalidate(3, size = $$new_props.size);
    		if ("sizeMD" in $$new_props) $$invalidate(4, sizeMD = $$new_props.sizeMD);
    		if ("sizeLG" in $$new_props) $$invalidate(5, sizeLG = $$new_props.sizeLG);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getEventsAction,
    		current_component,
    		size,
    		sizeMD,
    		sizeLG,
    		events,
    		get_col_classes,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("size" in $$props) $$invalidate(3, size = $$new_props.size);
    		if ("sizeMD" in $$props) $$invalidate(4, sizeMD = $$new_props.sizeMD);
    		if ("sizeLG" in $$props) $$invalidate(5, sizeLG = $$new_props.sizeLG);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	let classes;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(0, classes = $$restProps.hasOwnProperty("class")
    		? $$restProps["class"] + " " + get_col_classes()
    		: get_col_classes());
    	};

    	return [classes, events, $$restProps, size, sizeMD, sizeLG, $$scope, $$slots];
    }

    class Col extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { size: 3, sizeMD: 4, sizeLG: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Col",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get size() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sizeMD() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sizeMD(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sizeLG() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sizeLG(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function Bar(node,chart) {
        new chartXkcd.Bar(node, chart);

    }

    function StackedBar(node,chart) {
         new chartXkcd.StackedBar(node, chart);
      
      }

    function Pie(node,chart) {
        new chartXkcd.Pie(node, chart);
    }

    function Line(node,chart) {
        new chartXkcd.Line(node, chart);
    }

    function XY(node,chart) {
        new chartXkcd.XY(node, chart);
    }

    function Radar(node,chart) {
        new chartXkcd.Radar(node, chart);
    }

    /* src\App.svelte generated by Svelte v3.24.0 */
    const file$3 = "src\\App.svelte";

    // (174:3) <Col>
    function create_default_slot_10(ctx) {
    	let p;
    	let a0;
    	let t1;
    	let a1;
    	let t3;

    	const block = {
    		c: function create() {
    			p = element("p");
    			a0 = element("a");
    			a0.textContent = "Tim Qian XKCD charts";
    			t1 = text(" but with ");
    			a1 = element("a");
    			a1.textContent = "svelte";
    			t3 = text(". You can check out the article on dev.");
    			attr_dev(a0, "href", "https://timqian.com/chart.xkcd");
    			add_location(a0, file$3, 175, 5, 3377);
    			attr_dev(a1, "href", "https://svelte.dev");
    			attr_dev(a1, "class", "text-warning");
    			add_location(a1, file$3, 175, 80, 3452);
    			add_location(p, file$3, 174, 4, 3368);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, a0);
    			append_dev(p, t1);
    			append_dev(p, a1);
    			append_dev(p, t3);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(174:3) <Col>",
    		ctx
    	});

    	return block;
    }

    // (173:2) <Row>
    function create_default_slot_9(ctx) {
    	let col;
    	let current;

    	col = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(col.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				col_changes.$$scope = { dirty, ctx };
    			}

    			col.$set(col_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(173:2) <Row>",
    		ctx
    	});

    	return block;
    }

    // (182:3) <Col size="6">
    function create_default_slot_8(ctx) {
    	let svg;
    	let Bar_action;
    	let t0;
    	let hr;
    	let t1;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Bar Chart";
    			add_location(svg, file$3, 182, 3, 3616);
    			add_location(hr, file$3, 183, 3, 3651);
    			attr_dev(p, "class", "is-center");
    			add_location(p, file$3, 184, 3, 3659);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(Bar_action = Bar.call(null, svg, /*bar_chart*/ ctx[0]));
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(182:3) <Col size=\\\"6\\\">",
    		ctx
    	});

    	return block;
    }

    // (187:3) <Col size="6">
    function create_default_slot_7(ctx) {
    	let svg;
    	let XY_action;
    	let t0;
    	let hr;
    	let t1;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			p = element("p");
    			p.textContent = "XY Chart";
    			add_location(svg, file$3, 187, 3, 3725);
    			add_location(hr, file$3, 188, 3, 3758);
    			attr_dev(p, "class", "is-center");
    			add_location(p, file$3, 189, 3, 3766);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(XY_action = XY.call(null, svg, /*xy_chart*/ ctx[1]));
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(187:3) <Col size=\\\"6\\\">",
    		ctx
    	});

    	return block;
    }

    // (193:3) <Col size="6">
    function create_default_slot_6(ctx) {
    	let svg;
    	let Pie_action;
    	let t0;
    	let hr;
    	let t1;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Pie Chart";
    			add_location(svg, file$3, 193, 3, 3832);
    			add_location(hr, file$3, 194, 3, 3867);
    			attr_dev(p, "class", "is-center");
    			add_location(p, file$3, 195, 3, 3875);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(Pie_action = Pie.call(null, svg, /*pie_chart*/ ctx[2]));
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(193:3) <Col size=\\\"6\\\">",
    		ctx
    	});

    	return block;
    }

    // (198:3) <Col size="6">
    function create_default_slot_5(ctx) {
    	let svg;
    	let StackedBar_action;
    	let t0;
    	let hr;
    	let t1;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Stacked Bar Chart";
    			add_location(svg, file$3, 198, 3, 3941);
    			add_location(hr, file$3, 199, 3, 3981);
    			attr_dev(p, "class", "is-center");
    			add_location(p, file$3, 200, 3, 3989);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(StackedBar_action = StackedBar.call(null, svg, /*stacked*/ ctx[4]));
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(198:3) <Col size=\\\"6\\\">",
    		ctx
    	});

    	return block;
    }

    // (203:3) <Col size="6">
    function create_default_slot_4(ctx) {
    	let svg;
    	let Radar_action;
    	let t0;
    	let hr;
    	let t1;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Radar Chart";
    			add_location(svg, file$3, 203, 3, 4063);
    			add_location(hr, file$3, 204, 3, 4096);
    			attr_dev(p, "class", "is-center");
    			add_location(p, file$3, 205, 3, 4104);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(Radar_action = Radar.call(null, svg, /*radar*/ ctx[5]));
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(203:3) <Col size=\\\"6\\\">",
    		ctx
    	});

    	return block;
    }

    // (208:3) <Col size="6">
    function create_default_slot_3(ctx) {
    	let svg;
    	let Pie_action;
    	let t0;
    	let hr;
    	let t1;
    	let p;
    	let t2;
    	let code;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			p = element("p");
    			t2 = text("Doughnut Chart  ");
    			code = element("code");
    			code.textContent = "innerRadius is set to 0.5";
    			add_location(svg, file$3, 208, 4, 4173);
    			add_location(hr, file$3, 209, 4, 4208);
    			add_location(code, file$3, 210, 41, 4254);
    			attr_dev(p, "class", "is-center");
    			add_location(p, file$3, 210, 4, 4217);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    			append_dev(p, code);

    			if (!mounted) {
    				dispose = action_destroyer(Pie_action = Pie.call(null, svg, /*doughnut*/ ctx[3]));
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(208:3) <Col size=\\\"6\\\">",
    		ctx
    	});

    	return block;
    }

    // (213:3) <Col size="6">
    function create_default_slot_2(ctx) {
    	let svg;
    	let Line_action;
    	let t0;
    	let hr;
    	let t1;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Line Chart";
    			add_location(svg, file$3, 213, 4, 4330);
    			add_location(hr, file$3, 214, 4, 4362);
    			attr_dev(p, "class", "is-center");
    			add_location(p, file$3, 215, 4, 4371);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(Line_action = Line.call(null, svg, /*line*/ ctx[6]));
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(213:3) <Col size=\\\"6\\\">",
    		ctx
    	});

    	return block;
    }

    // (181:2) <Row>
    function create_default_slot_1(ctx) {
    	let col0;
    	let t0;
    	let col1;
    	let t1;
    	let col2;
    	let t2;
    	let col3;
    	let t3;
    	let col4;
    	let t4;
    	let col5;
    	let t5;
    	let col6;
    	let current;

    	col0 = new Col({
    			props: {
    				size: "6",
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	col1 = new Col({
    			props: {
    				size: "6",
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	col2 = new Col({
    			props: {
    				size: "6",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	col3 = new Col({
    			props: {
    				size: "6",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	col4 = new Col({
    			props: {
    				size: "6",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	col5 = new Col({
    			props: {
    				size: "6",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	col6 = new Col({
    			props: {
    				size: "6",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(col0.$$.fragment);
    			t0 = space();
    			create_component(col1.$$.fragment);
    			t1 = space();
    			create_component(col2.$$.fragment);
    			t2 = space();
    			create_component(col3.$$.fragment);
    			t3 = space();
    			create_component(col4.$$.fragment);
    			t4 = space();
    			create_component(col5.$$.fragment);
    			t5 = space();
    			create_component(col6.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(col0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(col1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(col2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(col3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(col4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(col5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(col6, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col0_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				col0_changes.$$scope = { dirty, ctx };
    			}

    			col0.$set(col0_changes);
    			const col1_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				col1_changes.$$scope = { dirty, ctx };
    			}

    			col1.$set(col1_changes);
    			const col2_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				col2_changes.$$scope = { dirty, ctx };
    			}

    			col2.$set(col2_changes);
    			const col3_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				col3_changes.$$scope = { dirty, ctx };
    			}

    			col3.$set(col3_changes);
    			const col4_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				col4_changes.$$scope = { dirty, ctx };
    			}

    			col4.$set(col4_changes);
    			const col5_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				col5_changes.$$scope = { dirty, ctx };
    			}

    			col5.$set(col5_changes);
    			const col6_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				col6_changes.$$scope = { dirty, ctx };
    			}

    			col6.$set(col6_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col0.$$.fragment, local);
    			transition_in(col1.$$.fragment, local);
    			transition_in(col2.$$.fragment, local);
    			transition_in(col3.$$.fragment, local);
    			transition_in(col4.$$.fragment, local);
    			transition_in(col5.$$.fragment, local);
    			transition_in(col6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col0.$$.fragment, local);
    			transition_out(col1.$$.fragment, local);
    			transition_out(col2.$$.fragment, local);
    			transition_out(col3.$$.fragment, local);
    			transition_out(col4.$$.fragment, local);
    			transition_out(col5.$$.fragment, local);
    			transition_out(col6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(col0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(col1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(col2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(col3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(col4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(col5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(col6, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(181:2) <Row>",
    		ctx
    	});

    	return block;
    }

    // (172:1) <Container>
    function create_default_slot(ctx) {
    	let row0;
    	let t0;
    	let hr;
    	let t1;
    	let row1;
    	let current;

    	row0 = new Row({
    			props: {
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	row1 = new Row({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row0.$$.fragment);
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			create_component(row1.$$.fragment);
    			add_location(hr, file$3, 179, 2, 3582);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row0, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(row1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row0_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				row0_changes.$$scope = { dirty, ctx };
    			}

    			row0.$set(row0_changes);
    			const row1_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				row1_changes.$$scope = { dirty, ctx };
    			}

    			row1.$set(row1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row0.$$.fragment, local);
    			transition_in(row1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row0.$$.fragment, local);
    			transition_out(row1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row0, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			destroy_component(row1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(172:1) <Container>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let container;
    	let current;

    	container = new Container({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(container.$$.fragment);
    			add_location(main, file$3, 170, 0, 3327);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(container, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const container_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				container_changes.$$scope = { dirty, ctx };
    			}

    			container.$set(container_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(container);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let bar_chart = {
    		title: "github stars VS patron number", // optional
    		data: {
    			labels: ["github stars", "patrons"],
    			datasets: [{ data: [10, 5] }]
    		},
    		options: {
    			// optional
    			yTickCount: 2
    		}
    	};

    	let xy_chart = {
    		title: "Pokemon farms", //optional
    		xLabel: "Coordinate", //optional
    		yLabel: "Count", //optional
    		data: {
    			datasets: [
    				{
    					label: "Pikachu",
    					data: [
    						{ x: 3, y: 10 },
    						{ x: 4, y: 122 },
    						{ x: 10, y: 100 },
    						{ x: 1, y: 2 },
    						{ x: 2, y: 4 }
    					]
    				},
    				{
    					label: "Squirtle",
    					data: [
    						{ x: 3, y: 122 },
    						{ x: 4, y: 212 },
    						{ x: -3, y: 100 },
    						{ x: 1, y: 1 },
    						{ x: 1.5, y: 12 }
    					]
    				}
    			]
    		},
    		options: {
    			//optional
    			xTickCount: 5,
    			yTickCount: 5,
    			legendPosition: chartXkcd.config.positionType.upRight
    		}
    	};

    	let pie_chart = {
    		title: "What people think", // optional
    		data: {
    			labels: ["work", "sleep", "social"],
    			datasets: [{ data: [30, 10, 60] }]
    		},
    		options: {
    			// optional
    			innerRadius: 0,
    			legendPosition: chartXkcd.config.positionType.upLeft
    		}
    	};

    	let doughnut = {
    		title: "The Reality", // optional
    		data: {
    			labels: [
    				"Lab",
    				"Reading",
    				"Writing",
    				"Analysis",
    				"That's Broken",
    				"Planning",
    				"Worrying",
    				"More reading",
    				"Shit that didn't work",
    				"Crying",
    				"Deciding to quit",
    				"Fear",
    				"I'll use Dr on my email"
    			],
    			datasets: [
    				{
    					data: [7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6, 7.6]
    				}
    			]
    		},
    		options: {
    			// optional
    			innerRadius: 0.5,
    			legendPosition: chartXkcd.config.positionType.upRight,
    			dataColors: [
    				"#f582ae",
    				"#001858",
    				"#8bd3dd",
    				"#ff8906",
    				"#7f5af0",
    				"#2cb67d",
    				"#010101",
    				"#94a1b2",
    				"#ade498",
    				"#fa1616",
    				"#e7dfd5",
    				"#ffd31d",
    				"#ccafaf"
    			]
    		}
    	};

    	let stacked = {
    		title: "Issues and PR Submissions",
    		xLabel: "Month",
    		yLabel: "Count",
    		data: {
    			labels: ["Jan", "Feb", "Mar", "April", "May"],
    			datasets: [
    				{
    					label: "Issues",
    					data: [12, 19, 11, 29, 17]
    				},
    				{ label: "PRs", data: [3, 5, 2, 4, 1] },
    				{ label: "Merges", data: [2, 3, 0, 1, 1] }
    			]
    		}
    	};

    	let radar = {
    		title: "Letters in random words", // optional
    		data: {
    			labels: ["c", "h", "a", "r", "t"],
    			datasets: [
    				{
    					label: "ccharrrt", // optional
    					data: [2, 1, 1, 3, 1]
    				},
    				{
    					label: "chhaart", // optional
    					data: [1, 2, 2, 1, 1]
    				}
    			]
    		},
    		options: {
    			// optional
    			showLegend: true,
    			dotSize: 0.8,
    			showLabels: true,
    			legendPosition: chartXkcd.config.positionType.upRight
    		}
    	};

    	let line = {
    		title: "Monthly income of an indie developer", // optional
    		xLabel: "Month", // optional
    		yLabel: "$ Dollars", // optional
    		data: {
    			labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    			datasets: [
    				{
    					label: "Plan",
    					data: [30, 70, 200, 300, 500, 800, 1500, 2900, 5000, 8000]
    				},
    				{
    					label: "Reality",
    					data: [0, 1, 30, 70, 80, 100, 50, 80, 40, 150]
    				}
    			]
    		},
    		options: {
    			// optional
    			yTickCount: 3,
    			legendPosition: chartXkcd.config.positionType.upLeft
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		chartXkcd,
    		Row,
    		Col,
    		Container,
    		Pie,
    		XY,
    		Bar,
    		Radar,
    		StackedBar,
    		Line,
    		bar_chart,
    		xy_chart,
    		pie_chart,
    		doughnut,
    		stacked,
    		radar,
    		line
    	});

    	$$self.$inject_state = $$props => {
    		if ("bar_chart" in $$props) $$invalidate(0, bar_chart = $$props.bar_chart);
    		if ("xy_chart" in $$props) $$invalidate(1, xy_chart = $$props.xy_chart);
    		if ("pie_chart" in $$props) $$invalidate(2, pie_chart = $$props.pie_chart);
    		if ("doughnut" in $$props) $$invalidate(3, doughnut = $$props.doughnut);
    		if ("stacked" in $$props) $$invalidate(4, stacked = $$props.stacked);
    		if ("radar" in $$props) $$invalidate(5, radar = $$props.radar);
    		if ("line" in $$props) $$invalidate(6, line = $$props.line);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bar_chart, xy_chart, pie_chart, doughnut, stacked, radar, line];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,

    });

    return app;

}());
