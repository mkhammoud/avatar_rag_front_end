import { Paper } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { handleUserQuery } from '../Components/Api';

function Chat() {

  const [userTextInput,setUserTextInput]=useState("");
  const [avatarVideo,setAvatarVideo]=useState("");

  const handleUserTextInputChange=(e)=>{
    setUserTextInput(e.target.value)
  }

  const handleUserFormSubmit= async (e)=>{
    e.preventDefault();

    let result=await handleUserQuery(userTextInput);
    
    setAvatarVideo(result?.video_url)
    
    
  }

  return (
 

 <Box display={"flex"} justifyContent={"center"} alignItems={"center"} flex={1} margin={0} padding={0} minHeight={"100vh"}>
 
 {/* AVATAR VIDEO SECTION */}
 <Grid container sx={{margin:0,padding:0}} maxWidth={"1300px"}>
  
  <Grid size={6}>
  
  <Box display={"flex"} justifyContent={"center"} alignItems={"center"}  sx={{boxSizing: 'border-box',height:"100%"}} p={2}>
  

  <video width="100%" height="100%" src={`${avatarVideo}`} autoPlay muted></video>

  </Box>

  </Grid>

 {/* CHAT INPUT SECTION */}

  <Grid size={6}>
  
  <Box display={"flex"} justifyContent={"center"} alignItems={"center"}  sx={{boxSizing: 'border-box',height:"100%"}} p={2}>
    

    <Box display={"flex"} flexDirection={"column"} gap={2} flex={1}>
    
    

   <TextField fullWidth={true} id="text-input" label="output" variant="filled" multiline rows={5}  />
    
   <form id="user-text-input-form" onSubmit={(e)=>{handleUserFormSubmit(e)}}>

   <TextField value={userTextInput} onChange={(e)=>{handleUserTextInputChange(e)}} fullWidth={true} id="text-input" label="input" variant="filled" sx={{borderRadius:"50px"}} />

   </form>

   </Box>


 
  </Box>

  </Grid>

</Grid>

 </Box>    
 
);
}

export default Chat;
