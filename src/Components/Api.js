
const backend_url=process.env.REACT_APP_BACKEND_URL;

async function handleUserQuery(userTextInput){


try{
  console.log(backend_url)

  const formData= new FormData();
  formData.append("userTextInput",userTextInput)

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

export {handleUserQuery}
