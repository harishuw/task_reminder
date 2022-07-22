const $e = function(sel){
    return document.querySelector(sel);
};
const $ea = function(sel){
    return document.querySelectorAll(sel);
};

let cdilid=0;

let app = {
    init: function(){
        
    },
    setDate: function(form){
        let now=new Date();
        let nowhr=now.getHours();
        let nowmin=now.getMinutes();
        if(nowhr>12){
            form.ampm.value='pm';
            nowhr=nowhr-12;
        }
        form.mins.value=nowmin;
        form.hours.value=nowhr;    
        form.date.value=now.format("%y-%m-%d");       
    }
}

window.onload = function(){    
 
    const form = {
        "message": document.getElementById("message"),
        "type": document.getElementsByName("type")[1],
        "submit": document.getElementById("remind"),
        "inmin":  document.getElementById("minutes"),
        "date": document.getElementById("date"),
        "hours": document.getElementById("hours"),
        "mins": document.getElementById("mins"),
        "ampm": document.getElementById("apm"), 
    };  
    curtime();
    setInterval(curtime,1000);    
    if(typeof(form.submit) === 'undefined' || form.submit === null){
        return;
    }
    form.submit.onclick = function(e){
        let data = {};        
        data.title = "Task Reminder";
        data.message = form.message.value;
        if(data.message.trim() == ""){
            form.message.focus();
            return;
        }
        if(form.type.checked){

            data.date = form.date.value;
            if(data.date.trim() == ""){
                form.date.focus();
                return;
            }
            data.hours = Number(form.hours.value);
            var apm = form.ampm.value.trim();
            if(apm == "pm" && data.hours != 12){
                data.hours += 12;
            }else if(apm == "am" && data.hours == 12){
                data.hours = 0;
            }
            var time = new Date(data.date);
            time.setHours(data.hours);
            time.setMinutes(Number(form.mins.value));
            data.time = time.valueOf();
            data.minutes = ((data.time-new Date().valueOf())/1000)/60;           
        }else{
            data.minutes = form.inmin.value;
            if(data.minutes.trim()=="" || isNaN(data.minutes)){
                form.inmin.focus();
                return;
            }
            var time=new Date();
            time.setMinutes(time.getMinutes() + Number(data.minutes));
            data.time=time.valueOf();
        }
        data.id="task_rem" +data.time + new Date().valueOf();
        chrome.runtime.sendMessage(data,function(response) {
            $ea('#menus a')[1].click();
            reset_fields('#message','#minutes','#date');
            store_items();
            setTimeout(function(){
                 store_items();
            },1000)
            
        }); 
    };
    var mins="";
    for(var $i=0;$i<=59;$i++){
        var j=$i;
        if($i<10){j="0"+j;}
        mins+="<option value='"+$i+"'>"+j+"</option>"
    }
    var hrs="";
    for(var $i=1;$i<=12;$i++){
    var j=$i;
    if($i<10){j="0"+j;}
      hrs+="<option value='"+$i+"'>"+j+"</option>"
    }
    document.getElementById("mins").innerHTML=mins;
    document.getElementById("hours").innerHTML=hrs;
    var radios=document.getElementsByName("type");
    for(var i = 0;i < radios.length;i++){
        radios[i].onchange = function(){
            if(this.value.trim()==='mins'){
                ienable("minutes");
                idisable("mins","hours","apm","date");
            }else{
                idisable("minutes");
                ienable("mins","hours","apm","date");
            }
        };
    }
    app.setDate(form);
    var cl=$ea('#menus a');
    for(var i=0;i<cl.length;i++){
        cl[i].onclick=function(){
            for(var i=0;i<cl.length;i++){
                cl[i].classList.remove("active");
            }
            this.classList.add('active');
            var acttab=this.getAttribute('href');
            var tabi=$ea('.tabi');
            for(var i=0;i<tabi.length;i++){
                tabi[i].style.display="none";
            }
            $e(acttab).style.display="block";
        }; 
    };
    store_items();
    init_del();   
};
function remind(data) { 
  chrome.runtime.sendMessage(data,
    function(response) {
     
    });
}
function store_items(){   
    chrome.storage.sync.get('tr_items',function(items){
        var td="";
        if(Object.keys(items).length>0){
            for(var i=0;i<items.tr_items.length;i++){
                td+="<tr>";
                td+="<td>"+items.tr_items[i].message+"</td>";
                td+="<td>"+new Date(items.tr_items[i].time).format("%m/%d/%y %h:%min %APM")+" (<span class='remtime' data-time='"+items.tr_items[i].time+"'></span> )</td>";
                td+="<td><a class='btn btn-link del_tasks' data-id='"+items.tr_items[i].id+"'><i title='delete' class='glyphicon glyphicon-trash'></i></a>";
                td+"</tr>";
            }
        }
        if(td!=""){
            var $fdel="<a class='btn btn-link del_tasks' data-id='full'><i title='delete all' class='glyphicon glyphicon-trash'></i>";
            $e('#viewtasks table tbody').innerHTML=td;
            $ea('#viewtasks table thead th')[2].innerHTML=$fdel;
            init_del();
        }else{
            $e('#viewtasks table tbody').innerHTML="<tr><td colspan='3'>No Tasks</td></tr>";
        }
        $ea(".remtime").forEach(function(e,i){
            var tm=Number(e.dataset.time);
            if(tm){
                setInterval(function(){
                    remaining(tm,e);
                },1000);                
            }
        });
    });
}
function idisable(){
    for(var i=0;i<arguments.length;i++){
        document.getElementById(arguments[i]).setAttribute('disabled','disabled');
    }
    
}
function ienable(){
    for(var i=0;i<arguments.length;i++){
        document.getElementById(arguments[i]).removeAttribute('disabled');
    }
}
function clear_task(id){
    var fn=arguments.length>1?arguments[1]:"";
    if(id.trim()!="full"){
        chrome.storage.sync.get('tr_items',function(items){
            if(Object.keys(items).length>0){
                var tmp=[];
                 for(var i=0;i<items.tr_items.length;i++){
                    var tr=items.tr_items[i];
                     if(tr.id.trim()!=id.trim()){
                        tmp.push(tr);
                     }
                }
                chrome.storage.sync.set({'tr_items':tmp},function(){
                    if(fn!=""){
                        fn();
                    }
                });
            }
        });
    }else{
        chrome.storage.sync.clear(function(){
            if(fn!=""){
                fn();
            }
        });
    }
}
function init_del(){
    var ids=$ea('.del_tasks');
    for(var i=0;i<ids.length;i++){
        ids[i].onclick=function(){
            var did=this.getAttribute('data-id');
            cdilid=did
            $e('#delete_confirm').style.display="block";
        };
    }
    document.getElementById('confirm_delete').onclick=function(){
        clear_task(cdilid,function(){
            $e('#delete_confirm').style.display="none";
            store_items();
            chrome.notifications.clear(cdilid);
            
        });        
    };
    document.getElementById('confirm_delete_no').onclick=function(){
        $e('#delete_confirm').style.display="none";
    };
}

function reset_fields(){
    for(var i=0;i<arguments.length;i++){
        $e(arguments[i]).value="";
    }
}
function get_all(){
    chrome.notifications.getAll(function(dat){
        console.log(dat);       
    });
    chrome.alarms.getAll(function(dat){
        console.log(dat);
    });
    chrome.storage.sync.get('tr_items',function(items){
        console.log(items);
    });
}
try{
    Date.prototype.format=function(f){
        var dt=this;
        var formats={
            "m":dt.getMonth()+1,
            "d":dt.getDate(),
            "w":dt.getDay(),
            "y":dt.getFullYear(),
            "h":dt.getHours(),
            "min":dt.getMinutes(),
            "s":dt.getSeconds(),
            "ms":dt.getMilliseconds(),
            "t":dt.getTime(),
            "apm":dt.getHours() >= 12 ? 'pm' : 'am',
            "APM":dt.getHours() >= 12 ? 'PM' : 'AM'            
        };   
        if(f.search(/apm/i)>-1){
            formats['h'] = formats['h'] % 12;
            formats['h']  = formats['h']  ? formats['h']  : 12;
        }
        for(var fm in formats){            
            if(typeof formats[fm]=="number" && formats[fm]<10){
                formats[fm]="0"+formats[fm];
            }            
            f=f.replace("%"+fm,formats[fm]);
        }
        return f;
    };
}catch(e){
    console.log(e);
}
function curtime(){
    let dt = new Date();
    $e("#curtime").innerHTML = dt.format("%y-%m-%d %h:%min %APM");
}
function remaining(dt,id){
    var cdt=new Date().getTime();
    var tdt=new Date(dt).getTime();
    var bal=tdt-cdt;   
    var remdiv="";
    if(bal>0){
        var days = Math.floor(bal / (1000 * 60 * 60 * 24));
        var hours = Math.floor((bal % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((bal % (1000 * 60 * 60)) / (1000 * 60));     
        remdiv= (days>0?days+" Days ":"")+(hours>0?hours+" Hr ":"")+(minutes+" Min")+" Left"; 
    }  
    id.innerHTML=remdiv;
}