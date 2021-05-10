try{
var version="2.2";
getStore('tr_items').then(function(items){   
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
setTimeout(function(){
    
},1000);
clear_startup();
chrome.notifications.onClicked.addListener(function(nid){
    chrome.notifications.clear(nid);
});
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    save_reminder(request,function(){
        set_alarm(request);
    });
    sendResponse({msg:"ok"});
});
}catch(e){
    console.log("err",e)
}
function notify(data) {
    var fn=arguments.length>1?arguments[1]:"";
    chrome.notifications.getPermissionLevel(function(pl){});
    var options={
        "type":"basic",
        "iconUrl":"icon.png",
        "title":data.title,
        "message":data.message,
        "contextMessage":data.cm,
        "requireInteraction":true
    };
    setSound();
    blink();
    chrome.notifications.create(data.id,options,function(did){
        if(fn!=""){
            fn();
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
        chrome.alarms.create(data.id, {periodInMinutes:Number(data.minutes)});
        chrome.alarms.onAlarm.addListener(function(alarm_data){
            if(alarm_data.name.trim()==data.id.trim()){
                notify(data,function(){
                    chrome.alarms.clear(data.id,function(){
                        clear_data(data.id);                       
                    });  
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
        "iconUrl":"rem.png",
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
    chrome.browserAction.setIcon({path: 'icon_green.png'});
    setTimeout(function(){
        chrome.browserAction.setIcon({path: 'icon.png'});
        setTimeout(function(){
            chrome.browserAction.setIcon({path: 'icon_green.png'});
            setTimeout(function(){
                chrome.browserAction.setIcon({path: 'icon.png'});
                setTimeout(function(){
                    chrome.browserAction.setIcon({path: 'icon_green.png'});
                     setTimeout(function(){
                        chrome.browserAction.setIcon({path: 'icon.png'});
                    },500);
                },500);
            },500);
        },500);
    },500);
}
function setSound(){
    var myAudio = new Audio();        
    myAudio.src = "ping.mp3"; 
    myAudio.play();       
}
function getStore(key){
    return new Promise(function(res,rej){
        chrome.storage.sync.get(key,function(data) {
           res(data);
        });
    });
}