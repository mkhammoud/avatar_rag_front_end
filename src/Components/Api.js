const backend_url=process.env.REACT_APP_BACKEND_URL; // BACKEND URL
const HEYGEN_API_KEY = process.env.REACT_APP_HEYGEN_API_KEY;


// FUNCTION THAT WILL FETCH AZURE ICE INFORMATION

async function fetchAzureSessionDataAPI(){
  const response = await fetch(`https://${process.env.REACT_APP_AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`, {
    method: 'GET',
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.REACT_APP_AZURE_SPEECH_KEY,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    console.error('Error fetching token:', response.status, response.statusText);
  }
};

// FUNCTION THAT WILL INTERRUPT THE AVATAR 

async function getHeygenAccessTokenAPI(){
  try {
    if (!HEYGEN_API_KEY) {
      throw new Error("API key is missing from .env");
    }

    const res = await fetch(
      "https://api.heygen.com/v1/streaming.create_token",
      {
        method: "POST",
        headers: {
          "x-api-key": HEYGEN_API_KEY,
        },
      },
    );
    const data = await res.json();

    return data.data.token;
     
  } catch (error) {
    console.error("Error retrieving access token:", error);
  }
}

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
    formData.append("avatarProvider",avatarProvider) 
    
    const response= await fetch(`${backend_url}getIdleAvatar`, {
      method: 'POST',
      body: formData,
    });
  
    const blob = await response.blob();
    const videoUrl = URL.createObjectURL(blob);

    return videoUrl
  
  }catch (error) {
    console.error('Error fetching video and text:', error);
  }
  
  
  }
  


// FUNCTION THAT WILL TAKE THE USER INPUT 
async function handleUserQueryAPI(messages,avatarProvider,avatarId,voiceId){

try{
  console.log("SUBMITTING")
  console.log(JSON.stringify(messages))

  const formData= new FormData();
  formData.append("messages",JSON.stringify(messages))
  formData.append("avatarProvider",avatarProvider)
  formData.append("avatarId",avatarId)
  formData.append("voiceId",voiceId)
 
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

export {handleUserQueryAPI,startSessionAPI,getAvatarIdleVideoAPI,getHeygenAccessTokenAPI,fetchAzureSessionDataAPI}
