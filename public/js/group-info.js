const user =
JSON.parse(localStorage.getItem("user"));

const params =
new URLSearchParams(location.search);

const groupId =
params.get("id");

let currentGroup = null;

loadGroup();

async function loadGroup(){

    try{

        const res =
        await fetch("/api/groups/" + groupId);

        const data =
        await res.json();

        if(!data.success){

            alert(data.message);

            history.back();

            return;

        }

        currentGroup = data.group;

        renderGroup();

    }catch(err){

        console.error(err);

    }

}
