<script>

const user =
JSON.parse(localStorage.getItem("user"));

if(!user){
  location.href="/login.html";
}

document.getElementById(
"avatar"
).src =
user.avatar ||
"https://cdn-icons-png.flaticon.com/512/149/149071.png" 

document.getElementById("username")
.innerText = user.username;

document.getElementById("email")
.innerText = user.email;

document.getElementById("bio")
.innerText = user.bio || "No bio yet";

async function saveProfile(){

  const username =
  document.getElementById("newUsername").value;

  const bio =
  document.getElementById("newBio").value;

  const res = await fetch(
    "/api/auth/profile",
    {
      method:"PUT",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        email:user.email,
        username,
        bio
      })
    }
  );

  const data = await res.json();

  if(data.success){

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    alert("✅ Profile Updated");

    location.reload();

  }else{

    alert(data.message);

  }

}

function logout(){

  localStorage.clear();

  location.href="/login.html";

}

  function goHome(){

  location.href = "/home.html";

}

async function uploadAvatar(){

const file =
document.getElementById(
"avatarFile"
).files[0];

if(!file){
return alert(
"Select image"
);
}

const formData =
new FormData();

formData.append(
"avatar",
file
);

formData.append(
"email",
user.email
);

const res =
await fetch(
"/api/auth/avatar",
{
method:"POST",
body:formData
}
);

const data =
await res.json();

if(data.success){

user.avatar =
data.avatar;

localStorage.setItem(
"user",
JSON.stringify(user)
);

alert(
"✅ Avatar Updated"
);

location.reload();

}else{

alert(data.message);

}

}  

</scr
