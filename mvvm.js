 function observe(data) {
        if(!data || typeof data !== 'object') return 
        for (let key in data) {
            let key_val = data[key]
            let subject = new Subject()
            Object.defineProperty(data,key,{
                configurable:true,
                enumerable: true,
                get:function() {
                    console.log(`get ${key} : ${key_val}`)
                    if(currentObserve) {
                        currentObserve.subscribeTo(subject)
                    }
                    return key_val
                },
                set: function(newVal) {
                    console.log(`set ${key} value is ${newVal}`)
                    key_val = newVal
                    subject.notify()
                }
            })
            if(typeof key_val === 'object') {
                observe(key_val)
            }
        }
    }
    let id = 0
    class Subject{
        constructor() {
            this.observes = []
            this.id = id++
        }
        addObserve(observe) {
            this.observes.push(observe)
        }
        removeObserve(observe) {
            let index = this.observes.indexOf(observe)
            if(index > -1) {
                this.observes.splice(index,1)
            }
        }
        notify() {
            this.observes.forEach(observe => {
                observe.update()
            })
        }

    }
    let currentObserve = null
    class Observe{
        constructor(objVm,key,callback) {
            this.objVm = objVm
            this.key = key
            this.callback = callback
            this.subjects = {}
            this.value = this.getValue()
        }
        update() {
            let oldValue = this.value
            let value = this.getValue()
            if(oldValue !== value) {
                this.value = value
                this.callback.bind(this.objVm)(oldValue,value)
            }
        }
        subscribeTo(subject) {
            if(!this.subjects[subject.id]) {
                subject.addObserve(this)
                this.subjects[subject.id] = subject
            }
        }
        getValue() {
            currentObserve = this
            let value = this.objVm.$data[this.key]
            currentObserve = null
            return value
        }
    }
    class mvvm{
        constructor(opts) {
            this.init(opts)
            observe(this.$data)
            this.compile(this.$node)
        }
        init(opts) {
            this.$node =document.querySelector(opts.el)
            this.$data = opts.data

        }
        compile(node) {
            if(node.nodeType == 1) {   //element node
                this.compileNode(node)
                node.childNodes.forEach(childNode => {
                    this.compile(childNode)
                })
            }else if(node.nodeType == 3) {
                let reg = /{{(.+?)}}/g
                let match
                while(match = reg.exec(node.nodeValue)) {
                    let bind_text = match[0]
                    let bind_key = match[1].trim()
                    node.nodeValue = node.nodeValue.replace(bind_text,this.$data[bind_key])
                    new Observe(this, bind_key,function(oldValue,value) {
                        if(oldValue.length != 0) {
                            node.nodeValue = node.nodeValue.replace(oldValue, value)
                        }else {
                            node.nodeValue = node.nodeValue+value
                        }
                        
                        console.log('node s value',node.nodeValue)
                    })
                }
            }

        }
        compileNode(node) {
            let attributes = [].slice.apply(node.attributes)
            console.log('attributes', attributes)
            attributes.forEach(attr => {
                if (isCommand(attr.name)) {
                    let key = attr.value
                    console.log('node.value:', node)
                    node.value = this.$data[key]       //输入框的值
                    new Observe(this, key, function (oldValue, value) {
                        node.value = value
                    })
                    node.oninput = (e) => {
                        this.$data[key] = e.target.value
                    }
                }

            })
        }
    }
    function isCommand(attrName) {
        return attrName === 'v-model'
    }
    let vm = new mvvm({
        el:'#app',
        data:{
            value: 'sty',
            age:22
        }
    })