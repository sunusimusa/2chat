const user = JSON.parse(localStorage.getItem("user"));

async function loadAnalytics(){

    try{

        const res = await fetch(
            "/api/shorts/analytics/" + user.username
        );

        const data = await res.json();

        if(!data.success){

            alert(data.message);

            return;

        }

        const a = data.analytics;

        document.getElementById("totalVideos").innerText =
            a.totalVideos;

        document.getElementById("totalViews").innerText =
            a.totalViews.toLocaleString();

        document.getElementById("totalLikes").innerText =
            a.totalLikes.toLocaleString();

        document.getElementById("totalComments").innerText =
            a.totalComments.toLocaleString();

        document.getElementById("totalShares").innerText =
            a.totalShares.toLocaleString();

        document.getElementById("totalSaves").innerText =
            a.totalSaves.toLocaleString();

        // Watch Time
        const totalSeconds = a.totalWatchTime || 0;

        const hours = Math.floor(totalSeconds / 3600);

        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        const seconds = totalSeconds % 60;

        document.getElementById("watchTime").innerText =
            `${hours}h ${minutes}m ${seconds}s`;

        // Engagement Rate
        let engagement = 0;

        if(a.totalViews > 0){

            engagement = (
                (
                    a.totalLikes +
                    a.totalComments +
                    a.totalShares +
                    a.totalSaves
                ) / a.totalViews
            ) * 100;

        }

        document.getElementById("engagement").innerText =
            engagement.toFixed(1) + "%";

        // Best Video
        if(a.topVideo){

            document.getElementById("bestVideo").src =
                a.topVideo.video;

            document.getElementById("bestCaption").innerHTML = `
<b>@${a.topVideo.username}</b><br><br>

${a.topVideo.caption || "No caption"}

<br><br>

👁 ${a.topVideo.views}

&nbsp;&nbsp;

❤️ ${a.topVideo.likes.length}

&nbsp;&nbsp;

💬 ${a.topVideo.comments.length}

&nbsp;&nbsp;

📤 ${a.topVideo.shares || 0}

&nbsp;&nbsp;

🔖 ${a.topVideo.saves || 0}

`;

        }

    }catch(err){

        console.log(err);

        alert("Failed to load analytics.");

    }

}

loadAnalytics();
