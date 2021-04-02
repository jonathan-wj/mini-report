import Vue from 'vue'
import axios from 'axios'
// export const install = function(Vue){
    let events = [
        'open', 'send',
        'loadstart', 'loadend', 'load',
        'abort'
    ];
    let oldXMLHttpRequest = window.XMLHttpRequest;
    reset()
    let options = {
        url: "http://localhost:3000/create",

    }

    
        const report = {
            send(err){
                // let url = "http://localhost:3000/create"
                axios.post(options.url, {detail: JSON.stringify(err)})
            }
        }
        const shared = {
            noop(){}
        }

        const captureHandler = {
            init,
            captureVueError,
            captureResourceError,
            capturePromiseError,
            captureAjaxError
        }

        function init(_options){
            Object.assign(options, _options)
            captureHandler.captureAjaxError()
        }
        /**vue js runtime error */
        function captureVueError(){
            let origal = Vue.config.errorHandler || shared.noop;
            return function(err,vm,info){
                report.send({
                    message: err.message,
                    stack: err.stack,
                    info,
                    errorType: 'referenceError',
                    type: err.srcElement.localName
                })
                origal.call(this,err, info, vm)
            }

        }
        
        Vue.config.errorHandler = captureVueError()
        

        /**vue resource load error */
        function matchResourceError(srcElement){
            let matchs = [HTMLImageElement, HTMLLinkElement, HTMLScriptElement]
            return matchs.filter(proto => srcElement instanceof proto).length
        }
        function captureResourceError(err){
            if(matchResourceError(err.srcElement)){
                report.send({
                    message: err.srcElement.currentSrc,
                    site: err.srcElement.baseURI,
                    errorType: 'resourceError',
                    type: err.srcElement.localName
                })
            }
        }
        window.addEventListener('error', captureResourceError, true)
        

        /**promise not catch error */
        function capturePromiseError(e) {
            console.error('PROMISE', e)
            console.error(`UNHANDLED PROMISE REJECTION: ${e.reason}`);
        }
        window.addEventListener('unhandledrejection', capturePromiseError, false)


        /**ajax interactive exception */
        function captureAjaxError(){
            function newXHR(){
                let realXHR = new oldXMLHttpRequest()
                    let eventName
                    events.forEach(event => {
                        realXHR.addEventListener(event, function(){
                            eventName = `ajax${event[0].toUpperCase() + event.slice(1)}`
                            createCustomEvent(eventName)
                        })
                    })
                
                return realXHR
            }
            events.forEach(event => {
                window.addEventListener(`ajax${event[0].toUpperCase() + event.slice(1)}`, e => {
                    ajaxHandlerCb(event, {_reportEvent: true, e})
                })
            })
            window.XMLHttpRequest = newXHR
             
            const ajaxReportHandler = {
                open(e){
                    // console.log('open', e)
                    // report.send(err)
                },
                send(e){
                    // console.log('send', e)
                },
                loadstart(e){
                    // console.log('loadstart', e)
                },
                loadend(e){
                    // console.log('loadend', e)
                },
                load(e){
                    // console.log('load', e)
                },
                abort(e){
                    // console.log('abort', e)
                },
            }
            function ajaxHandlerCb(eventName, e) {
                ajaxReportHandler[eventName](e)
            }
        }
        function createCustomEvent(eventName){
            let event = new CustomEvent(eventName, { detail: this })
            window.dispatchEvent(event)
        }
        
        
        


        /**项目重新刷新，是否又会重新引入一次？再次绑定再次初始化？ */
        function reset(){
            removeAjaxEvent()
            removeResourceEvent()
            removePromiseEvent()
        }
        function removeAjaxEvent() {
            let realXHR = new oldXMLHttpRequest()
            events.forEach(event => {
                realXHR.removeEventListener(event, () => shared.noop)
                window.removeEventListener( `ajax${event[0].toUpperCase() + event.slice(1)}`, () => shared.noop)
            })
        }
        function removeResourceEvent(){
            window.removeEventListener('error', () => shared.noop)
        }
        function removePromiseEvent(){
            window.removeEventListener('unhandledrejection', () => shared.noop)
        }

export const Report = captureHandler
    
// }