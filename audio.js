var myAudio = new Audio();        
myAudio.src = "ping.mp3"; 
myAudio.play();   
myAudio.onended=function(){   
    console.log("window close")
    self.close();
}