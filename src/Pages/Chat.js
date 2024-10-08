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


function Chat() {

  const [userTextInput,setUserTextInput]=useState(""); // USER INPUT TEXT STATE
  const [avatarVideo,setAvatarVideo]=useState("");  // AVATAR VIDEO SOURCE STATE
  const [avatarProvider,setAvatarProvider]=useState("local"); // AVATAR PROVIDER (LOCAL, HEYGEN, AZURE)
  const [avatarConnectionStatus,setAvatarConnectionStatus]=useState("disconnected"); // AVATAR CONNECTION STATUS (connected,disconnected) WILL BE USEFUL FOR LIVE AVATAR CONNECTION MAINLY
  const [avatarStatus,setAvatarStatus]=useState("idle");  // AVATAR STATUS (IDLE, SPEAKING)
  const [avatarId,setAvatarId]=useState("default_avatar"); // AVATAR ID
  const avatarVideoRef=useRef(null); // VIDEO OBJECT REFERENCE
  const scrollBottomRef = useRef(null); // REFERENCE FOR THE LAST MESSAGE IN CHAT HISTORY USEFULL TO SCOLL TO BOTTOM ON EVERY NEW MESSAGE RECEIVED
  const [chatHistory,setChatHistory]=useState([]) // CHAT HISTORY STATE


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
      
      if (avatarVideoRef.current) {
        // Pause the video while switching the source
        avatarVideoRef.current.pause();
  
         setAvatarVideo(video?.video_url)
      }


    }catch (error) {
      console.error('Error fetching video and text:', error);
    }
    

  }

  // ON NEW CONNECTION STATUS EVENT HANDLE 
  useEffect(()=>{
    
    if(avatarConnectionStatus==="disconnected"){
      setAvatarVideo(undefined)
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


  useEffect(() => {
    const videoElement = avatarVideoRef.current;
   
    if (videoElement && avatarVideo) {
      // Add event listener to wait until the video can play through
      const handleCanPlayThrough = () => {
        // Play the video when it's fully ready
        videoElement.play();
      };

      videoElement.addEventListener('canplaythrough', handleCanPlayThrough);

      return () => {
        // Clean up the event listener
        videoElement.removeEventListener('canplaythrough', handleCanPlayThrough);
      };
    }
  }, [avatarVideo]); 

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

  // TRACKING WHEN THE VIDEO STOP PLAYING
  function handleVideoEnd(){
    setAvatarStatus("idle")
  }

  // UPDATING THE STATE OF INPUT ON CHANGE
  const handleUserTextInputChange=(e)=>{ 
    setUserTextInput(e.target.value)
  }
  
  // USER TEXT SUBMIT FORM 
  const handleUserFormSubmit= async (e)=>{ 
    e.preventDefault();
    if(avatarConnectionStatus ==="disconnected" || userTextInput ==="" ){
     return
    }

    
    let messages=[...chatHistory];
    const user_message=addMessage("user",userTextInput)
    messages.push(user_message)
    
    setUserTextInput('')

    let result=await handleUserQueryAPI(messages);
    
    if(result){
      setAvatarVideo(result?.video_url)
      addMessage("assistant",result?.text_response)
      setAvatarStatus("speaking")
    }


  }

  return (
 

 <Box display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"} flex={1} margin={0} padding={0} height={"100vh"} sx={{background:ThemeColors.background_gradient}} gap={2}>
 
 {/* AVATAR VIDEO SECTION */}
  
  <Box width={"80%"} height={"80%"} >

{avatarConnectionStatus ==="connected" &&
<Button id="start-session-btn" onClick={()=>{handleStopSession()}} variant='contained' sx={{background:ThemeColors.black,color:"white"}} startIcon={<StopIcon />}>Start Session</Button>}

{avatarConnectionStatus ==="disconnected" &&
<Button id="start-session-btn" onClick={()=>{handleStartSession()}} variant='contained' sx={{background:ThemeColors.black,color:"white"}} startIcon={<PlayArrowIcon />}>Start Session</Button>}


    
 <Grid container sx={{margin:0,padding:0}} height={"100%"}>


  <Grid size={6}>
  
  
  <Box display={"flex"} justifyContent={"center"} alignItems={"center"}  sx={{boxSizing: 'border-box',height:"100%"}} p={2}>
  
  
  <video id="avatar-video" ref={avatarVideoRef} width="500px" height="500px" src={`${avatarVideo}`} autoPlay muted={avatarStatus==="idle"} loop={avatarStatus==="idle"} onEnded={handleVideoEnd}></video>

  </Box>

  </Grid>

 {/* CHAT INPUT SECTION */}

  <Grid size={6} height={"100%"}>
  
  <Box display={"flex"}  sx={{boxSizing: 'border-box',height:"100%",borderRadius:"50px"}} p={3} component={Paper} height={"100%"}>
    

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
