// ==UserScript==
// @name         Blind-Helper
// @namespace    https://lengyue.me
// @version      0.1
// @description  Help Blinds to pass Captcha
// @author       Lengyue
// @match        http://*/*
// @match        https://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //Swal是你的第一选择
    var swal_js= document.createElement("script");
    swal_js.type = "text/javascript";
    swal_js.src="https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/7.29.2/sweetalert2.min.js";
    document.head.appendChild(swal_js);
    var swal_css = document.createElement('link');
    swal_css.rel = 'stylesheet';
    swal_css.href = 'https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/7.29.2/sweetalert2.min.css';
    document.head.appendChild(swal_css);

    //Hook XMLHttpRequest
    XMLHttpRequest.prototype.rawopen = XMLHttpRequest.prototype.open;
    //Uri截胡
    function parseQueryString(url) {
        var obj = {};
        var keyvalue = [];
        var key = "",
        value = "";
        var paraString = url.substring(url.indexOf("?") + 1, url.length).split("&");
        for (var i in paraString) {
            keyvalue = paraString[i].split("=");
            key = keyvalue[0];
            value = keyvalue[1];
            obj[key] = value;
        }
        return obj;
    };
    //自定义Ajax
    function ajax(method, url, data, callback) {
        //1、创建请求对象
        var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
        //2、配置请求参数并发送请求
        method = method.toUpperCase();
        if (method === 'GET') {
            xhr.rawopen('GET', url, true);
            xhr.send(null);
        } else if (method === 'POST') {
            xhr.rawopen('POST', url, true);
            xhr.send(data);
        } else {
            console.error('请传入合法的请求方式');
        }
        //3、监听状态
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                //向外返回服务器的数据
                //根据responseXML属性是否为空
                if (!xhr.responseXML) {
                    callback(xhr.responseText);
                } else {
                    callback(xhr.responseXML);
                }
            }
        }

    }

    //注入initGeetest
    window.initGeetest = function(a, b) {
        console.info("Hooked Geetest Init Process");
        var geetest_challenge, geetest_validate, callback_func, rend_to;
        function yue_gt() {
            console.info("Geetest Activated");
            swal.queue([{
                title: '检测到极验',
                confirmButtonText: '破解',
                text: '请点击破解',
                showLoaderOnConfirm: true,
                preConfirm: function () {
                    return new Promise(function (resolve) {
                        ajax("GET", "https://api.yuekuai.tech/api/geetest3?token=DowoYWNKXK&gt=" + a["gt"] + "&challenge=" + a["challenge"], "",
                             function(data) {
                            data = JSON.parse(data);
                            if (data.code !== 0) {
                                swal.insertQueueStep({
                                    type: 'error',
                                    html: "极验验证失败 " + data.msg,
                                    timer: 5000
                                })
                                if (rend_to && rend_to.innerHTML){
                                    rend_to.innerHTML = '极验验证失败 ' + data.msg + '请刷新重试';
                                }
                                resolve();
                                return
                            }
                            geetest_challenge = data.data.challenge;
                            geetest_validate = data.data.validate;
                            swal.insertQueueStep({
                                type: 'success',
                                html: "极验已通过",
                                timer: 5000
                            })
                            if (rend_to && rend_to.innerHTML){
                                rend_to.innerHTML = '极验已通过' + '<input type="hidden" name="geetest_challenge" value="' + geetest_challenge + '">' + '<input type="hidden" name="geetest_validate" value="' + geetest_validate + '">' + '<input type="hidden" name="geetest_seccode" value="' + geetest_validate + '|jordan">';
                            }
                            callback_func && callback_func()
                            resolve();
                        })
                    })
                }
            }])


        }
        function GeetestCbk() {}
        GeetestCbk.appendTo = function(rend) {
            rend_to = document.getElementById(rend.slice(1));
            if (rend_to){
                rend_to.innerHTML = '破解中';
            }
            //启动
            yue_gt();
            return this
        };
        GeetestCbk.onReady = function(func) {
            func();
            return this
        };
        GeetestCbk.onSuccess = function(func) {
            callback_func = func;
            return this
        };
        GeetestCbk.getValidate = function() {
            return {
                "geetest_challenge": geetest_challenge,
                "geetest_validate": geetest_validate,
                "geetest_seccode": geetest_validate + "|jordan"
            }
        };
        GeetestCbk.verify = function(){
            //启动
            yue_gt();
        };
        b(GeetestCbk);
    }
    // 拦截XHR
    XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
        console.info(method, url);
        this.addEventListener("readystatechange",
        function() {
            //console.log(this.readyState);
            if (this.readyState == 4 && this.status == 200) {
            }
        },
        false);

        XMLHttpRequest.prototype.rawopen.call(this, method, url, async, user, pass);
    };
    document.head.hookChild = document.head.appendChild;
    // 拦截标签注入
    document.head.appendChild = function(a) {
        if (a.src) {
            var uri = parseQueryString(a.src);
        }
        //其余PASS
        return document.head.hookChild(a);
    }
})();