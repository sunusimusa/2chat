const user = JSON.parse(localStorage.getItem("user"));

async function loadRequests(){

const res = await fetch(
`/api/friends/requests/${user.username}`
);

const data = await res.json();

let html = "";

data.requests.forEach(r=>{

html += `
<div style="border:1px solid #ccc;padding:10px;margin:10px;">

<h3>${r.sender}</h3>

<button onclick="accept('${r._id}')">
✅ Accept
</button>

<button onclick="reject('${r._id}')">
❌ Reject
</button>

</div>
`;

});

document.getElementById("requests").innerHTML = html;

}

async function accept(id){

await fetch("/api/friends/accept",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
requestId:id
})

});

loadRequests();

}

async function reject(id){

await fetch("/api/friends/reject",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
requestId:id
})

});

loadRequests();

}

loadRequests();
