// 参考https://github.com/foio/mvvm-demo/blob/master/foio.js
const directives = {
    model: function link(binding) {
        const elem = binding.element;
        const $vmodel = binding.vmodels;
        elem.addEventListener('input', e => {
            const val = e.target.value;
            $vmodel[binding.expr] = val;
        },false);

        $vmodel.updateView = function(newVal) {
            elem.value = newVal;
        }
    }
};

const rmsAttr = /coco-(\w+)-?(.*)/;

//收集下所有vmodel
const vmodels = {};


function scanAttr(elem, vmodels) {
    var bindings = [];
    var match = false;
    var attributes = elem.getAttributes ? elem.getAttributes(elem) : elem.attributes;
    //遍历节点的属性
    for (var i = 0, attr; (attr = attributes[i++]);) {
        //如果已指定属性specified为true
        if (attr.specified) {
            //获取指令,其中
            if ((match = attr.name.match(rmsAttr))) {
                var type = match[1];
                var param = match[2] || "";
                var value = attr.value;
                var name = attr.name;
                //存在相关指令
                if (directives[type]) {
                    var binding = {
                        type: type,
                        param: param,
                        element: elem,
                        name: name,
                        expr: value,
                    };
                    bindings.push(binding);
                }
            }
        }
    }

    //处理绑定
    if (bindings.length) {
        executeBindings(bindings, vmodels);
    }
}

function executeBindings(bindings, vmodels) {
    for (var i = 0, binding; (binding = bindings[i++]);) {
        binding.vmodels = vmodels;
        directives[binding.type](binding);
    };
}

function scan(elem, vmodels) {
    scanAttr(elem, vmodels);
    const nodes = Array.prototype.slice.call(elem.childNodes);
    for (var i = 0, node; (node = nodes[i++]);) {
        if(node.nodeType === 1) {
            scan(node, vmodels);
        }
    }
}

// 单独搞一个函数，是因为需要闭包保存value值
function makeAccesser(name,value) {
    let oldValue = value;
    return {
        get: function(e,b) {
            return oldValue;
        },
        set: function(newVal) {
            oldValue = newVal;
            this.updateView(newVal);
        },
        enumerable: true,
        configurable: true
    }
}

function modelFactory(data) {
    var $vmodel = {};
    for (let name in data) {
        let value = data[name];
        $vmodel = Object.defineProperty($vmodel, name, makeAccesser(name, value))
    }

    return $vmodel;
}

function controller(options) {
    const $vmodel = vmodels[options.el] = modelFactory(options.data);
    scan(document.getElementById(options.el), $vmodel);
    return $vmodel;
}

window.cocoVue = controller;
