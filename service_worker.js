try{   
    let app = {
        version: "3.0",
        saveItem: function(items){
            return chrome.storage.sync.set(items);
        },
        getItem: function(item){
            return chrome.storage.sync.get(item);
        },
        startUp: function(){
            app.getItem('tr_items').then(function(items){   
                if(Object.keys(items).length>0){
                    for(let i = 0; i < items.tr_items.length; i++){
                        let tr = items.tr_items[i];
                        let tm = tr.time;
                        let time = new Date().valueOf();                      
                        if(tm > time){
                            app.setAlarm(tr);
                        }else{
                            tr.cm = "Time Passed";
                            app.notify(tr).then(function(){
                                app.delItem(tr.id);                                
                            });   
                        }
                    }
                }    
            });
        },
        saveReminder: function(data){       
            return new Promise(function(res,rej){
                app.getItem('tr_items').then(function(items){
                    let item = Array();
                    if(Object.keys(items).length > 0){
                        item = items.tr_items;
                        item.push(data);
                    }else{
                        item.push(data);
                    }
                    app.saveItem({'tr_items': item}).then(function(){
                        app.setAlarm(data);
                        res();
                    });                       
                });  
            });    
        },
        notify: function(data){           

            return new Promise(function(res,rej){
                chrome.notifications.getPermissionLevel(function(pl){});
                let options={
                    "type":"basic",
                    "iconUrl":"icon.png",
                    "title":data.title,
                    "message":data.message,
                    "contextMessage":data.cm,
                    "requireInteraction":true
                };                  
                //appblink();  
                chrome.notifications.create(data.id,options,function(did){             
                    app.setSound();  
                    res(did)
                });
            });
        },
        setAlarm: function(data){
            data.minutes=Math.ceil(data.minutes);
            chrome.alarms.create(data.id, {when: data.time});// periodInMinutes:Number(data.minutes)           
        },
        findRem: function(id){
            return new Promise(function(res,rej){
                app.getItem("tr_items").then(function(items){
                    if(Object.keys(items).length > 0){
                        let tr = items.tr_items
                        let rem = tr.filter((item)=>{
                            if(item.id == id){
                                return true;
                            }
                        });
                        rem = rem[0] || {};
                        res(rem);
                    }                    
                });
            });
        },
        delItem: function(id){
            app.getItem("tr_items").then(function(items){
                if(Object.keys(items).length>0){
                    let tmp = [];
                    for(let i = 0; i < items.tr_items.length; i++){
                        let tr = items.tr_items[i];
                        if(tr.id.trim() != id.trim()){
                            tmp.push(tr);
                        }
                    }
                    app.saveItem({'tr_items': tmp});                   
                }
            });    
        },
        setSound: function(){
            chrome.windows.create(
                {
                    height:1,
                    width:1,
                    focused: false,
                    top: 1,
                    left: 1,           
                    url:"audio.html",
                    type:"popup"
                },
                function(){
        
                },
            )            
        },
        tmpNotify(msg = "Test"){
            let data = {
                "type":"basic",        
                "title":"Test",
                "message":msg,
                "contextMessage":"",
                "iconUrl":"icon.png"    
            }
            app.notify(data);
        }
    };

    chrome.runtime.onInstalled.addListener(() => {
        console.log("installed")
        app.tmpNotify("installed");
        //app.startUp();
        /*getStore('tr_items').then(function(items){   
            if(Object.keys(items).length>0){
                for(var i=0;i<items.tr_items.length;i++){
                    var tr=items.tr_items[i];
                    var tm=tr.time;
                    var min=((tm-new Date().valueOf())/1000)/60;
                    tr.cm="";
                    tr.minutes=min;
                    set_alarm(tr);
                }
            }    
        });
        clear_startup();*/
        chrome.notifications.onClicked.addListener(function(nid){
            chrome.notifications.clear(nid);
        });
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {     
            app.saveReminder(request).then(function(){
                sendResponse({msg:"ok"});
            });
        });
        chrome.alarms.onAlarm.addListener(function(alarm_data){
            console.log("yes",alarm_data)
            app.findRem(alarm_data.name.trim()).then(function(data){
                console.log("found",alarm_data)
                chrome.action.setIcon({path: 'icon_green.png'});
                app.notify(data).then(function(){
                    app.delItem(data.id);
                    chrome.action.setIcon({path: 'icon.png'});
                });                           
            });          
        });
    });    
    chrome.runtime.onStartup.addListener(() => {
        app.tmpNotify("startup");
    });
    chrome.runtime.onSuspend.addListener(() => {
        app.tmpNotify("susp");
    });
    

}catch(e){
    console.log("err",e)
}
function notify(data) {
    var fn=arguments.length>1?arguments[1]:"";
   // chrome.notifications.getPermissionLevel(function(pl){});
    var options={
        "type":"basic",
        "iconUrl":"icon.png",
        "title":data.title,
        "message":data.message,
        "contextMessage":data.cm,
        "requireInteraction":true
    };
   
   //d blink();  
    chrome.notifications.create(data.id,options,function(did){             
        console.log("done")
        if(fn!=""){
            fn();
            setSound();  
        }
    });
}
function clear_data(id){
    getStore('tr_items').then(function(items){
        if(Object.keys(items).length>0){
            var tmp=[];
             for(var i=0;i<items.tr_items.length;i++){
                var tr=items.tr_items[i];
                if(tr.id.trim()!=id.trim()){
                    tmp.push(tr);
                }
            }
            chrome.storage.sync.set({'tr_items':tmp},function(){
                
            });
        }
    });    
}
function clear_startup(){
    getStore('tr_items').then(function(items){
        if(Object.keys(items).length>0){
            var tmp=[];
             for(var i=0;i<items.tr_items.length;i++){
                var tr=items.tr_items[i];
                var min=(((tr.time)-new Date().valueOf())/1000)/60;
                if(min>=1){
                    tmp.push(tr);
                }
            }
            chrome.storage.sync.set({'tr_items':tmp},function(){
                
            });
        }
    });  
}
function set_alarm(data){
    if(Number(data.minutes)<=0){
        data.cm="Time Passed";
        notify(data,function(){
            clear_data(data.id);
        }); 
    }else{
        data.minutes=Math.ceil(data.minutes);
        chrome.alarms.create(data.id, {when: data.time});// periodInMinutes:Number(data.minutes)
        chrome.alarms.onAlarm.addListener(function(alarm_data){
            if(alarm_data.name.trim()==data.id.trim()){
                notify(data,function(){
                  /*  chrome.alarms.clear(data.id,function(){
                        clear_data(data.id);                       
                    });  */
                });
            }
        });
    }
}
function save_reminder(data){
    var fn=arguments.length>1?arguments[1]:"";
    getStore('tr_items').then(function(items){
        var item=Array();
        if(Object.keys(items).length>0){
            item=items.tr_items;
            item.push(data);
        }else{
           item.push(data);
        }
	    chrome.storage.sync.set({'tr_items':item},function(){
            if(fn!=""){
                fn();
            }
        });
    });    
}
function tn(msg){
    var id=arguments.length>1?arguments[1]:"test1";
    var options={
        "type":"basic",
        "iconUrl":"icon.png",
        "title":"Test",
        "message":msg,
        "contextMessage":"test cm",
    };  
    chrome.notifications.create(id,options);
}
function get_allb(){
    chrome.notifications.getAll(function(dat){
        tn(JSON.stringify(dat),"test2")
    });
    chrome.alarms.getAll(function(dat){
        
        tn(JSON.stringify(dat),'test3');
    });
    chrome.storage.sync.get('tr_items',function(items){        
        tn(JSON.stringify(items),'test4')
    });
}
function blink(){
    chrome.action.setIcon({path: 'icon_green.png'});
    setTimeout(function(){
        chrome.action.setIcon({path: 'icon.png'});
        setTimeout(function(){
            chrome.action.setIcon({path: 'icon_green.png'});
            setTimeout(function(){
                chrome.action.setIcon({path: 'icon.png'});
                setTimeout(function(){
                    chrome.action.setIcon({path: 'icon_green.png'});
                     setTimeout(function(){
                        chrome.action.setIcon({path: 'icon.png'});
                    },500);
                },500);
            },500);
        },500);
    },500);
}

function getStore(key){
    return new Promise(function(res,rej){
        chrome.storage.sync.get(key,function(data) {
           res(data);
        });
    });
}