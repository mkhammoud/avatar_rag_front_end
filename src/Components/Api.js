const backend_url=process.env.REACT_APP_BACKEND_URL; // BACKEND URL


// FUNCTION THAT WILL INTERRUPT THE AVATAR 

async function interruptAvatar(avatar_id,avatar_provider){

  try{
   
    return true;
    
  }catch (error) {
    console.error('Error fetching video and text:', error);
  }
  
  }


// FUNCTION THAT WILL CONNECT TO AN AVATAR PROVIDER
async function startSessionAPI(avatar_id,avatar_provider){

  try{
   
    return true;
    
  }catch (error) {
    console.error('Error fetching video and text:', error);
  }
  
  }


// FUNCTION THAT WILL GET THE IDLE VIDEO OF AVATAR
async function getAvatarIdleVideoAPI(avatarId,avatarProvider){

  try{

    console.log(backend_url)  
    const formData= new FormData();
    formData.append("avatarId",avatarId)

    // MIGHT NOT BE NEEDED AS ONLY LOCAL VIDEO PROVIDER WILL HAVE A SEPERATE IDLE VIDEO (OR IT CAN BE USED IN ADDITIONAL TO STREAMING LIVE SERVER FOR COST SAVING)
    formData.append("avatarProvider",avatarProvider) 
    
    const response= await fetch(`${backend_url}getIdleAvatar`, {
      method: 'POST',
      body: formData,
    });
  
    const data= await response.json();
    return data
  
  }catch (error) {
    console.error('Error fetching video and text:', error);
  }
  
  
  }
  


// FUNCTION THAT WILL TAKE THE USER INPUT 
async function handleUserQueryAPI(messages){

try{
  console.log("SUBMITTING")
  console.log(JSON.stringify(messages))

  const formData= new FormData();
  formData.append("messages",JSON.stringify(messages))
 
  const response= await fetch(`${backend_url}handleUserQuery`, {
    method: 'POST',
    body: formData,
  });

  const data= await response.json();
  
  return data

}catch (error) {
  console.error('Error fetching video and text:', error);
}


}

export {handleUserQueryAPI,startSessionAPI,getAvatarIdleVideoAPI}
