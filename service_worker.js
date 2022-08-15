try{   
    var app = {
        version: "3.1",
        saveItem: function(items){
            return chrome.storage.sync.set(items);
        },
        getItem: function(item){
            return chrome.storage.sync.get(item);
        },
        startUp: function(){
            app.getItem('tr_items').then(function(items){   
                if(Object.keys(items).length>0){
                    let del_ids = []; 
                    for(let i = 0; i < items.tr_items.length; i++){
                        let tr = items.tr_items[i];
                        let tm = tr.time;
                        let time = new Date().valueOf();     
                        if(tm > time){                            
                            app.setAlarm(tr);
                        }else{
                            tr.cm = "Time Passed";                                           
                            res = app.notify(tr).then(function(){                                                   
                            }).catch((err)=>{console.error(err)});  
                            del_ids.push(tr.id);                                  
                        }
                    }
                    if(del_ids){
                        app.delItems(del_ids);  
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
                let options = {
                    "type":"basic",
                    "iconUrl":"icon.png",
                    "title":data.title,
                    "message":data.message,
                    "contextMessage":data.cm,
                    "requireInteraction":true
                };           
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
                        if(rem){
                            res(rem);
                        }else{
                            rej(rem);
                        }
                    }                    
                });
            });
        },
        delItem: function(id){
            app.getItem("tr_items").then(function(items){
                if(Object.keys(items).length>0){                    
                    let tmp = items.tr_items.filter((data)=>{
                        return data.id != id;                       
                    });   
                    app.saveItem({'tr_items': tmp});                   
                }
            });    
        },
        delItems: function(ids){
            app.getItem("tr_items").then(function(items){
                if(Object.keys(items).length>0){                    
                    let tmp = items.tr_items.filter((data)=>{
                        return !ids.includes(data.id);
                    });                 
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
                "type":"progress",        
                "title":"Test",
                "message":msg,
                "contextMessage":"",
                "iconUrl":"icon.png",
                "id":msg+new Date().valueOf()  
            }
            app.notify(data);
        }
    };

    chrome.runtime.onInstalled.addListener(() => {        
      
        
    });    
    chrome.notifications.onClicked.addListener(function(nid){      
        chrome.notifications.clear(nid);        
    });
    chrome.notifications.onClosed.addListener((nid,b,c)=>{
        console.log(nid,b,c,"cleared");        
    });
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {  
      
        app.saveReminder(request).then(function(){
            sendResponse({msg:"ok1"});
        });
    });
    chrome.alarms.onAlarm.addListener(function(alarm_data){      
        app.findRem(alarm_data.name.trim()).then(function(data){           
            if(data.message){
                chrome.action.setIcon({path: 'icon_green.png'});
                app.notify(data).then(function(){
                    app.delItem(data.id);
                    chrome.action.setIcon({path: 'icon.png'});
                });         
            }                  
        });          
    });
    chrome.runtime.onStartup.addListener(() => {
        app.startUp();        
    });
    chrome.runtime.onSuspend.addListener(() => {
       
    });
    

}catch(e){
    console.log("err",e)
}