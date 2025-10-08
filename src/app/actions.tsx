'use server'

const API_KEY = "E51F2766-8BEE42F2-ACFCF4BE-5D581033";

 
export async function postToSocialMedia() {

  const response = await fetch("https://api.ayrshare.com/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        // post: "Testing a social media API for a course project", // required
        platforms: ["instagram"], // required
        randomPost: true,
        randomMediaUrl: true
        // mediaUrls: ["https://img.ayrshare.com/012/gb.jpg"] //optional
      }),
    })
      .then((res) => res.json())
      .then((json) => console.log(json))
      .catch(console.error);
  // const result = await response.json();
  // return result; // where does this return to?
}
