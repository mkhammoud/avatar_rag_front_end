import { InputLabel, ListItemAvatar, ListItemText, Paper, typographyClasses, useRadioGroup } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useEffect, useState,useRef } from 'react';
import { getAvatarIdleVideoAPI, handleUserQueryAPI, startSessionAPI } from '../Components/Api';
import { gradient_background, ThemeColors } from '../Components/Constants';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { io } from 'socket.io-client';


function Chat() {

  const [userTextInput,setUserTextInput]=useState(""); // USER INPUT TEXT STATE
  const [avatarIdleVideo,setAvatarIdleVideo]=useState(undefined);  // AVATAR IDLE VIDEO SOURCE STATE
  const [avatarProvider,setAvatarProvider]=useState("local"); // AVATAR PROVIDER (LOCAL, HEYGEN, AZURE)
  const [avatarConnectionStatus,setAvatarConnectionStatus]=useState("disconnected"); // AVATAR CONNECTION STATUS (connected,disconnected) WILL BE USEFUL FOR LIVE AVATAR CONNECTION MAINLY
  const [avatarStatus,setAvatarStatus]=useState("idle");  // AVATAR STATUS (IDLE, SPEAKING)
  const [avatarId,setAvatarId]=useState("default_avatar"); // AVATAR ID
  const avatarVideoRef=useRef(null); // VIDEO OBJECT REFERENCE
  const scrollBottomRef = useRef(null); // REFERENCE FOR THE LAST MESSAGE IN CHAT HISTORY USEFULL TO SCOLL TO BOTTOM ON EVERY NEW MESSAGE RECEIVED
  const [chatHistory,setChatHistory]=useState([]) // CHAT HISTORY STATE
  const [videoQueue, setVideoQueue] = useState([]); // VIDEO QUEUE
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // Track the current video index
  const avatarVideoRef1 = useRef(null); // Reference for the first video element
  const avatarVideoRef2 = useRef(null);

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

  useEffect(() => {
    if (videoQueue.length > 0) {
      setCurrentVideoIndex(0); // Start with the first video
    }
  }, [videoQueue]);

  useEffect(() => {
    const videoElement1 = avatarVideoRef1.current;
    const videoElement2 = avatarVideoRef2.current;

    const handleCanPlayThrough = (videoElement) => {
      videoElement.play(); // Play the video when it's ready
    };

    const handleVideoEnd = () => {
      // Move to the next video in the sequence
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % 2); // Alternate between 0 and 1
    };

    // Set the source of the current video element based on currentVideoIndex
    if (videoQueue.length > 0) {
      const currentVideoElement = currentVideoIndex === 0 ? videoElement1 : videoElement2;
      currentVideoElement.src = videoQueue[currentVideoIndex]; // Set the video source
      currentVideoElement.load(); // Load the video

      // Add event listeners for the current video element
      currentVideoElement.addEventListener('canplaythrough', () => handleCanPlayThrough(currentVideoElement));
      currentVideoElement.addEventListener('ended', handleVideoEnd);

      // Preload the next video element
      const nextVideoIndex = (currentVideoIndex + 1) % 2; // Alternate the next video index
      const nextVideoElement = nextVideoIndex === 0 ? videoElement1 : videoElement2;
      nextVideoElement.src = videoQueue[nextVideoIndex]; // Set the next video source
      nextVideoElement.load(); // Load the next video
    }

    // Cleanup event listeners on unmount
    return () => {
      videoElement1.removeEventListener('canplaythrough', () => handleCanPlayThrough(videoElement1));
      videoElement2.removeEventListener('canplaythrough', () => handleCanPlayThrough(videoElement2));
      videoElement1.removeEventListener('ended', handleVideoEnd);
      videoElement2.removeEventListener('ended', handleVideoEnd);
    };
  }, [currentVideoIndex, videoQueue]);

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
  
    const result=await startSessionAPI(avatarId,avatarProvider)

    if(result){
    setAvatarConnectionStatus("connected") 
    }

  }

  const handleStopSession= async ()=>{

    setAvatarConnectionStatus("disconnected")
    setAvatarStatus("idle") 
 

  }


  // FUNCTION THAT RETURNS THE IDLE VIDEO OF AVATAR (USEFUL FOR LOCAL AVATAR, AND OPTIONAL FOR LIVE AVATAR)
  async function getAvatarIdleVideo(avatarId){
    try{

      const video= await getAvatarIdleVideoAPI(avatarId)  
         setAvatarIdleVideo(video?.video_url)

    }catch (error) {
      console.error('Error fetching video and text:', error);
    }
    

  }

  // ON NEW CONNECTION STATUS EVENT HANDLE 
  useEffect(()=>{
    
    if(avatarConnectionStatus==="disconnected"){
      setAvatarIdleVideo(undefined)

    }

    else{
      if(avatarProvider==="local"){
        getAvatarIdleVideo(avatarId)
     }

    }
      
   

  },[avatarConnectionStatus])

  // FUNCTION WHEN WE WANT TO MAKE THE AVATAR IDLE
  function avatarIdle(){
      getAvatarIdleVideo(avatarId);
     setAvatarStatus("idle");
  }

  console.log("Chat History", chatHistory)



  // HANDLE EVENT WHEN THE AVATAR IS IN IDLE MODE
  useEffect(()=>{

    if(avatarConnectionStatus==="disconnected"){
      return
    }

    if(avatarStatus==="idle"){
      console.log("idle");
      avatarIdle();
    }

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

    let result=await handleUserQueryAPI(messages);
    
    if(result){
      addMessage("assistant",result?.text_response)
      setAvatarStatus("speaking")
    }


  }

  const handleNextVideoCanPlay = () => {
    // This can be used to add any logic when the next video is ready to play
  };

  return (
 

 <Box display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"} flex={1} margin={0} padding={0} height={"100vh"} sx={{background:ThemeColors.background_gradient}} gap={2}>
 
 {/* AVATAR VIDEO SECTION */}
  
  <Box width={"80%"} height={"80%"} >

{avatarConnectionStatus ==="connected" &&
<Button id="start-session-btn" onClick={()=>{handleStopSession()}} variant='contained' sx={{background:ThemeColors.black,color:"white"}} startIcon={<StopIcon />}>Start Session</Button>}

{avatarConnectionStatus ==="disconnected" &&
<Button id="start-session-btn" onClick={()=>{handleStartSession()}} variant='contained' sx={{background:ThemeColors.black,color:"white"}} startIcon={<PlayArrowIcon />}>Start Session</Button>}


    
 <Grid container sx={{margin:0,padding:0}} height={"100%"} >


  <Grid size={6} height={"100%"} p={1}>
  
  
  <Box display={"flex"} justifyContent={"center"} alignItems={"center"}  sx={{boxSizing: 'border-box',height:"100%",position:"relative"}} >
  

<video id="avatar-video-idle" src={avatarIdleVideo} style={{objectFit:"cover",borderRadius:"50px",position: "absolute", top: 0,left: 0,}} width="100%" height="100%" autoPlay muted loop preload='auto'></video>

<video id="avatar-video-speaking" ref={avatarVideoRef1} style={{display:"none",objectFit:"cover",borderRadius:"50px",position: "absolute", top: 0,left: 0}} width="100%" height="100%"  preload='auto' ></video>
<video id="avatar-video-speaking" ref={avatarVideoRef2} style={{display:"none",objectFit:"cover",borderRadius:"50px",position: "absolute", top: 0,left: 0}} width="100%" height="100%" preload='auto' ></video>

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
