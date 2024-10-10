import { InputLabel, ListItemAvatar, ListItemText, Paper, typographyClasses, useRadioGroup } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useEffect, useState,useRef } from 'react';
import { getAvatarIdleVideoAPI, handleUserQueryAPI, startSessionAPI ,getHeygenAccessTokenAPI} from '../Components/Api';
import { gradient_background, HeygenAvatars, HeyGenVoices, LocalAvatars, LocalVoices, ThemeColors } from '../Components/Constants';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { io } from 'socket.io-client';
import StreamingAvatar, {AvatarQuality, StreamingEvents, TaskType, VoiceEmotion} from "@heygen/streaming-avatar";
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select'

function Chat() {

  const [userTextInput,setUserTextInput]=useState(""); // USER INPUT TEXT STATE
  const [avatarIdleVideo,setAvatarIdleVideo]=useState(undefined);  // AVATAR IDLE VIDEO SOURCE STATE
  const [avatarProvider,setAvatarProvider]=useState("local"); // AVATAR PROVIDER (LOCAL, HEYGEN, AZURE)
  const [avatarConnectionStatus,setAvatarConnectionStatus]=useState("disconnected"); // AVATAR CONNECTION STATUS (connected,disconnected) WILL BE USEFUL FOR LIVE AVATAR CONNECTION MAINLY
  const [avatarStatus,setAvatarStatus]=useState("idle");  // AVATAR STATUS (IDLE, SPEAKING)
  const [avatarId,setAvatarId]=useState("lisa_casual_1080"); // AVATAR ID
  const [voiceId,setVoiceId]=useState("7306"); // AVATAR ID
  const scrollBottomRef = useRef(null); // REFERENCE FOR THE LAST MESSAGE IN CHAT HISTORY USEFULL TO SCOLL TO BOTTOM ON EVERY NEW MESSAGE RECEIVED
  const [chatHistory,setChatHistory]=useState([]) // CHAT HISTORY STATE
  
  
  const [videoQueue, setVideoQueue] = useState([]); // VIDEO QUEUE
  const [currentVideo, setCurrentVideo] = useState(null); // CURRENT VIDEO
  const [nextVideo, setNextVideo] = useState(null);  // State to hold the next video URL
  const avatarIdleVideoRef=useRef(null);
  const avatarVideoRef1=useRef(null); // VIDEO OBJECT REFERENCE
  const avatarVideoRef2=useRef(null); // VIDEO OBJECT REFERENCE
  const [currentVideoRef, setCurrentVideoRef] = useState(avatarVideoRef1);


  const [voices,setVoices]=useState(LocalVoices); // LIST OF VOICES
  const [avatars,setAvatars]=useState(LocalAvatars); // LIST OF AVATARS


  // HEYGEN AVATAR 
  const[heygenAvatar,setHeygenAvatar]=useState(); // HEYGEN STREAMING AVATAR OBJECT
  const heygenAvatarVideoRef=useRef(null); // HEYGEN VIDEO OBJECT
  const [heygenStream,setHeygenStream]=useState(undefined); // HEYGEN STREAM OBBJECT
  const [heygenSessionData, setHeygenSessionData] = useState(undefined); // HEYGEN AVATAR SESSION DATA


  // FUNCTION THAT TRACK CHANGE OF AVATAR PROVIDER
  const handleAvatarProviderChange = (event) => {
    setAvatarProvider(event.target.value);
  };

  // FUNCTION THAT TRACK CHANGE OF AVATAR PROVIDER
  const handleVoiceChange = (event) => {
    setVoiceId(event.target.value);
  };

  // FUNCTION THAT TRACK CHANGE OF AVATAR PROVIDER
  const handleAvatarIdChange = (event) => {
    setAvatarId(event.target.value);
  };
    

  // FUNCTION THAT EXECUTE BASED ON AVATAR PROVIDER CHANGES
  useEffect(()=>{
    
    if(avatarProvider==="local"){
      setAvatars(LocalAvatars)
      setVoices(LocalVoices)

     setAvatarId(LocalAvatars[0].id)
      setVoiceId(LocalVoices[0].id)

    } else if(avatarProvider==="heygen"){
      setAvatars(HeygenAvatars)
      setVoices(HeyGenVoices)

      setAvatarId(HeygenAvatars[0].id)
       setVoiceId(HeyGenVoices[0].id)
    }

  },[avatarProvider])
  
  // FUNCTION THAT EXECUTE BASED ON LOCAL AVATAR AND AVATAR ID CHANGE
  useEffect(()=>{
    
    if(avatarProvider==="local"){
      getAvatarIdleVideo(avatarId)
    } 

  },[avatarProvider,avatarId])
 
  // START SESSION FUNCTION FOR HEYGEN 
  async function startHeygenSession() {
    //setIsLoadingSession(true);
    const newToken = await getHeygenAccessTokenAPI();
    
     console.log(newToken);

    setHeygenAvatar(new StreamingAvatar({
      token: newToken,
    }))

  } 

  useEffect(()=>{

    if(heygenAvatar){
      console.log(heygenAvatar)

    heygenAvatar?.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
      console.log("heygenAvatar started talking", e);
    });
    heygenAvatar?.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
      console.log("heygenAvatar stopped talking", e);
    });
    heygenAvatar?.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log("Stream disconnected");
      setAvatarConnectionStatus("disconnected")
      endHeygenAvatarSession();
    });
    heygenAvatar?.on(StreamingEvents.STREAM_READY, (event) => {
      console.log(">>>>> Stream ready:", event.detail);
      setHeygenStream(event.detail);
      setAvatarConnectionStatus("connected")

    });
    heygenAvatar?.on(StreamingEvents.USER_START, (event) => {
      console.log(">>>>> User started talking:", event);
      //setIsUserTalking(true);
    });
    heygenAvatar?.on(StreamingEvents.USER_STOP, (event) => {
      console.log(">>>>> User stopped talking:", event);
      //setIsUserTalking(false);
    });
    
    async function startSession(){
      try {
        const res = await heygenAvatar?.createStartAvatar({
          quality: AvatarQuality.High,
          avatarName: avatarId,
          voice: {
            voiceId:voiceId,
            rate: 1, // 0.5 ~ 1.5
          },
          language: 'en',
        });
  
        setHeygenSessionData(res);
        // default to voice mode
        //await heygenAvatar?.startVoiceChat();
        //setChatMode("text_mode");
      } catch (error) {
        console.error("Error starting avatar session:", error);
      } finally {
        //setIsLoadingSession(false);
      }     
    }

    startSession()

    
  }
  },[heygenAvatar])

  async function handleHeygenAvatarSpeak(text) {
    //setIsLoadingRepeat(true);
    if (!heygenAvatar) {
      console.log("heygenAvatar API not initialized");
      return;
    }
    // speak({ text: text, task_type: TaskType.REPEAT })
    await heygenAvatar?.speak({ text: text,task_type: TaskType.REPEAT  }).catch((e) => {
      console.log(e.message);
    });
    //setIsLoadingRepeat(false);
  }
  async function handleHeygenAvatarInterrupt() {
    if (!heygenAvatar) {
      console.log("heygenAvatar API not initialized");
      return;
    }
    await heygenAvatar?.interrupt().catch((e) => {
        console.log(e.message);
      });
  }
  async function endHeygenAvatarSession() {
    console.log("END AVATAR")
    await heygenAvatar?.stopAvatar();
    setAvatarConnectionStatus("disconnected")
    setHeygenStream(undefined);
  }

  useEffect(() => {
    if (heygenStream && heygenAvatarVideoRef.current) {
      heygenAvatarVideoRef.current.srcObject = heygenStream;
      heygenAvatarVideoRef.current.onloadedmetadata = () => {
        heygenAvatarVideoRef.current.play();
      };
    }
  }, [heygenAvatarVideoRef, heygenStream]);


   // WEBSOCKET CODE 
   useEffect(() => {
    // Connect to the Socket.IO server
    const socket = io(process.env.REACT_APP_BACKEND_URL);

    // Handle connection event
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('video_chunk', (data) => {
      const videoBlob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(videoBlob);
      setVideoQueue((prevQueue) => [...prevQueue, url]);

    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

// Function to handle video end event


// Start playing the next video when the current one ends
useEffect(() => {
  if (videoQueue.length > 0 && !currentVideo) {
    setCurrentVideo(videoQueue[0]); // Start with the first video in the queue
    setNextVideo(videoQueue[1] || null); // Preload the next video
  }
}, [videoQueue, currentVideo]);


{/* 
useEffect(() => { 
  const videoElement = avatarVideoRef.current;

  const handleCanPlayThrough = () => {
    videoElement.play(); // Play the video when it's ready
  };

  const handleVideoEnd = () => {
    videoElement.pause(); 

    setVideoQueue((prevQueue) => {
      const newQueue = [...prevQueue];
      newQueue.shift(); // Remove the first video (FIFO)
  
      return newQueue; // Return the updated queue
    });  
    
    // Set the current video to the preloaded next video
    setCurrentVideo(videoQueue[1] || null); // Set current video to the next video in the queue
    setNextVideo(videoQueue[2] || null); // Preload the next video (the one after the next)
  };



  if (currentVideo) {
    videoElement.src = currentVideo; // Set the video source
    videoElement.load(); // Load the video

    videoElement.style.display = 'block'; // Show the video
    // Preload the next video if it exists
    if (nextVideo) {
      const nextVideoTemp = document.createElement('video');
      nextVideoTemp.src = nextVideo;
      nextVideoTemp.load();
    }

    videoElement.addEventListener('canplaythrough', handleCanPlayThrough);
    videoElement.addEventListener('ended', handleVideoEnd); // Add event listener for video end

    // Clean up the event listeners when the component unmounts or currentVideo changes
    return () => {
      videoElement.removeEventListener('canplaythrough', handleCanPlayThrough);
      videoElement.removeEventListener('ended', handleVideoEnd);
    };
  } else {
    if(nextVideo === null){
      videoElement.style.display = 'none'; // Hide the video if there is no current video

    }
    
  }
}, [currentVideo]); */}



useEffect(() => {


  const videoElement = currentVideoRef.current;
  const otherVideoRef =
    currentVideoRef === avatarVideoRef1 ? avatarVideoRef2 : avatarVideoRef1;
  const otherVideoElement = otherVideoRef.current;

  const handleCanPlayThrough = () => {
        // Show the current video element and hide the other
    videoElement.play(); // Play the video when it's ready
    videoElement.style.display = 'block';

  };

  const handleVideoEnd = () => {

    videoElement.pause();

    // Update the video queue
    setVideoQueue((prevQueue) => {
      const newQueue = [...prevQueue];
      newQueue.shift(); // Remove the first video (FIFO)
      return newQueue; // Return the updated queue
    });

    // Switch the video element
    setCurrentVideoRef((prevRef) =>
      prevRef === avatarVideoRef1 ? avatarVideoRef2 : avatarVideoRef1
    );

    // Set current and next videos from the queue
    setCurrentVideo(videoQueue[1] || null); // Set the current video to the next one
    setNextVideo(videoQueue[2] || null); // Preload the next video
  };

  if (currentVideo) {



    // Set and load the video for the current video element
    videoElement.src = currentVideo;
    videoElement.load();
    

    otherVideoElement.style.display = 'none'; // Hide the non-playing video

    // Preload the next video on the other (hidden) video element
    if (nextVideo) {
      otherVideoElement.src = nextVideo;
      otherVideoElement.load();
    }

    videoElement.addEventListener('canplaythrough', handleCanPlayThrough);
    videoElement.addEventListener('ended', handleVideoEnd);

    // Clean up the event listeners when the component unmounts or currentVideo changes
    return () => {
      videoElement.removeEventListener('canplaythrough', handleCanPlayThrough);
      videoElement.removeEventListener('ended', handleVideoEnd);
    };
  } else if (!nextVideo) {
    otherVideoElement.style.display = 'none'; // Hide the video if there are no videos
  } else if(!currentVideo){
    videoElement.style.display='none';


  
  }
}, [currentVideo, currentVideoRef]);


 
  
  // FUNCTION TO SCROLL AT THE BOTTOM OF CHAT HISTORY
  useEffect(() => {

    if(scrollBottomRef.current) {
      (scrollBottomRef.current.scrollIntoView({ behavior: 'smooth'}));
    }
      
    }, [chatHistory]);
  
  // FUNCTION TO APPEND A MESSAGE TO CHAT HISTORY
  function addMessage(role, content) {
    // Create a new message object
    const newMessage = {
        role: role,
        content: content,
    };

    // Update the chat history state
    setChatHistory((prevHistory) => [...prevHistory, newMessage]);
    return newMessage;
  } 

  // START SESSION BUTTON CLICK EVENT
  const handleStartSession= async ()=>{
     
    if(avatarProvider==="local"){
      getAvatarIdleVideo(avatarId)
      setAvatarStatus("idle")
      setAvatarConnectionStatus("connected")
    } 

    else if(avatarProvider==="heygen"){
      await startHeygenSession();
    }

  }

  // FUNCTION TO HANDLE LOCAL AVATAR STOP SESSION

  const hanldeStopLocalAvatar=async()=>{
    setAvatarIdleVideo(null)
    setVideoQueue([])
    setAvatarConnectionStatus("disconnected")
    setAvatarStatus("idle") 
  } 


  // STOP SESSION BUTTON CLICK EVENT
  const handleStopSession= async ()=>{
    
    if(avatarProvider==="local"){
      hanldeStopLocalAvatar()
    } else if(avatarProvider==="heygen"){
      await endHeygenAvatarSession();
    }
  
 

  }


  // FUNCTION THAT RETURNS THE IDLE VIDEO OF AVATAR (USEFUL FOR LOCAL AVATAR, AND OPTIONAL FOR LIVE AVATAR)
  async function getAvatarIdleVideo(avatarId){
    try{

      const video= await getAvatarIdleVideoAPI(avatarId)  
      setAvatarIdleVideo(video)

    }catch (error) {
      console.error('Error fetching video and text:', error);
    }
    

  }

  // ON NEW CONNECTION STATUS EVENT HANDLE 
  useEffect(()=>{
    
    if(avatarConnectionStatus==="disconnected"){
      setCurrentVideo(undefined)
      setAvatarIdleVideo(undefined)

    }


  },[avatarConnectionStatus])

 

  console.log("Chat History", chatHistory)



  // HANDLE EVENT WHEN THE AVATAR IS IN IDLE MODE
  useEffect(()=>{

  },[avatarConnectionStatus,avatarStatus])


  // UPDATING THE STATE OF INPUT ON CHANGE
  const handleUserTextInputChange=(e)=>{ 
    setUserTextInput(e.target.value)
  }
  
  // USER TEXT SUBMIT FORM 
  const handleUserFormSubmit= async (e)=>{ 
    e.preventDefault();
    console.log(videoQueue.length)
    // Check if the connection status is disconnected, the user input is empty, or the queue is empty
    if (
      avatarConnectionStatus === "disconnected" ||
      userTextInput === "" ||
      videoQueue.length !== 0 // Check if the queue is empty
    ) {
      return; // Exit the function if any condition is met
    }
    
    let messages=[...chatHistory];
    const user_message=addMessage("user",userTextInput)
    messages.push(user_message)
    
    setUserTextInput('')

    let result=await handleUserQueryAPI(messages,avatarProvider,avatarId,voiceId);
    
   
    
    if(result?.text_response){
      addMessage("assistant",result?.text_response)
      setAvatarStatus("speaking")

      if(avatarProvider==="heygen"){
        await handleHeygenAvatarSpeak(result?.text_response);
      }

    }

  


  }

  return (


 <Box display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"} flex={1} margin={0} padding={0} height={"100vh"} sx={{background:ThemeColors.background_gradient}} gap={2}>
 

 {/* AVATAR VIDEO SECTION */}
  
  <Box width={"80%"} height={"80%"} >

<Box display={"flex"}  alignItems={"center"} gap={2} >
{avatarConnectionStatus ==="connected" &&
<Button id="start-session-btn" onClick={()=>{handleStopSession()}} variant='contained' sx={{background:ThemeColors.black,color:"white"}} startIcon={<StopIcon />}>Stop Session</Button>}

{avatarConnectionStatus ==="disconnected" &&
<Button id="start-session-btn" onClick={()=>{handleStartSession()}} variant='contained' sx={{background:ThemeColors.black,color:"white"}} startIcon={<PlayArrowIcon />}>Start Session</Button>}

<FormControl sx={{ m: 1, minWidth: 120 }} size="small">
<InputLabel id="vatar-provider-label">Avatar Provider</InputLabel>

      <Select
        labelId="avatar-provider-label"
        id="avatar-provider-label-select"
        value={avatarProvider}
        label="Age"
        onChange={handleAvatarProviderChange}
      >
        <MenuItem value={"local"}>On Premises</MenuItem>
        <MenuItem value={"heygen"}>Heygen Streaming Avatar</MenuItem>
        <MenuItem value={"azure"}>Azure Streaming Avatar</MenuItem>
      </Select>
    </FormControl>

    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
<InputLabel id="vatar-provider-label">Avatars</InputLabel>

      <Select
        labelId="avatar-provider-label"
        id="avatar-provider-label-select"
        value={avatarId}
        label="Age"
        onChange={handleAvatarIdChange}
      >
          {avatars && avatars.map((avatar,index)=>(
          <MenuItem key={index} value={avatar.id}>{avatar.name}</MenuItem>
        ))}


      </Select>
    </FormControl>

    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
<InputLabel id="vatar-provider-label">Voices</InputLabel>

      <Select
        labelId="avatar-provider-label"
        id="avatar-provider-label-select"
        value={voiceId}
        label="Age"
        onChange={handleVoiceChange}
      >
          {voices && voices.map((voice,index)=>(
          <MenuItem key={index} value={voice.id}>{voice.name}</MenuItem>
        ))}

      </Select>
    </FormControl>




</Box>

    
 <Grid container sx={{margin:0,padding:0}} height={"100%"} >


  <Grid size={6} height={"100%"} p={1}>
  
  
  <Box display={"flex"} justifyContent={"center"} alignItems={"center"}  sx={{boxSizing: 'border-box',height:"100%",position:"relative"}} >
  

{avatarProvider==="local" &&
<>
<video id="avatar-video-idle" ref={avatarIdleVideoRef} src={avatarIdleVideo} style={{objectFit:"cover",borderRadius:"50px",position: "absolute", top: 0,left: 0,}} width="100%" height="100%" autoPlay muted loop preload='auto'></video>

<video id="avatar-video-speaking" ref={avatarVideoRef1} style={{objectFit:"cover",borderRadius:"50px",position: "absolute", top: 0,left: 0}} width="100%" height="100%" preload='auto' ></video>

<video id="avatar-video-speaking" ref={avatarVideoRef2} style={{objectFit:"cover",borderRadius:"50px",position: "absolute", top: 0,left: 0}} width="100%" height="100%" preload='auto' ></video>


{nextVideo && (
        <video style={{ display: 'none' }} src={nextVideo} preload="auto"></video>
      )}
</>
}

{avatarProvider==="heygen" &&
<>
<video id="avatar-video-idle" ref={heygenAvatarVideoRef} style={{objectFit:"cover",borderRadius:"50px",position: "absolute", top: 0,left: 0,}} width="100%" height="100%"></video>

</>
}


  </Box>

  </Grid>

 {/* CHAT INPUT SECTION */}

  <Grid size={6} height={"100%"} p={1}>
  
  <Box display={"flex"}  sx={{boxSizing: 'border-box',height:"100%",borderRadius:"50px"}} p={3} component={Paper} height={"100%"} >
    

    <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"} gap={2} flex={1} height={"100%"} >
    
     
    <List    sx={{
           width: '100%',
           overflow: 'auto',
           height: "100%",

         }} id="chat-window-messages">

          {chatHistory && chatHistory.map((message,index)=>
       
            <ListItem key={index} sx={{display:"flex",alignItems:"start",boxSizing: 'border-box',background: message.role==="user"? ThemeColors.grey : "transparent",marginY:"10px",borderRadius:"10px"}}>
        
            {message.role === "user" ? <ListItemAvatar  > <PersonIcon sx={{width:"30px", height:"30px",color:"white",background:ThemeColors.red,p:1,borderRadius:"10px"}} /> </ListItemAvatar>: <ListItemAvatar  > <SmartToyIcon sx={{width:"30px", height:"30px",color:"white",background:ThemeColors.yellow,p:1,borderRadius:"10px"}} /> </ListItemAvatar>}

            <ListItemText>{message.content}</ListItemText>     </ListItem>
 
  
          )}
                            
          <ListItem ref={scrollBottomRef}></ListItem>
                                   
    </List>
    
    
   <form id="user-text-input-form" onSubmit={(e)=>{handleUserFormSubmit(e)}}>

   <TextField value={userTextInput} onChange={(e)=>{handleUserTextInputChange(e)}} fullWidth={true} id="text-input" placeholder='Enter your Message here' label="Input" variant="filled"  />

   </form>

   </Box>


 
  </Box>

  </Grid>

</Grid>
</Box>

 </Box>    
 
);
}

export default Chat;
