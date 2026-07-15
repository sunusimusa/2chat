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

async function loadViewsChart(){

    try{

        const res = await fetch(
            "/api/shorts/analytics-chart/" + user.username
        );

        const data = await res.json();

        if(!data.success){

            return;

        }


        const labels = data.chart.map(
            item => item.day
        );


        const views = data.chart.map(
            item => item.views
        );


        const ctx =
        document.getElementById("viewsChart");


        new Chart(ctx,{

            type:"line",

            data:{

                labels:labels,

                datasets:[{

                    label:"Views",

                    data:views,

                    tension:0.4

                }]

            },

            options:{

                responsive:true,

                plugins:{

                    legend:{
                        display:true
                    }

                }

            }

        });


    }catch(err){

        console.log(err);

    }

}

loadViewsChart();

async function loadTopVideos(){


try{


const res = await fetch(
"/api/shorts/analytics/top/" + user.username
);


const data = await res.json();


if(!data.success) return;


const box =
document.getElementById("topVideos");


box.innerHTML="";


data.videos.forEach((video,index)=>{


const score =
(video.views || 0) +
(video.likes.length * 5) +
(video.watchTime || 0);



box.innerHTML += `


<div class="top-item">


<div class="rank">

${index==0?"🥇":
 index==1?"🥈":
 index==2?"🥉":
 "#"+(index+1)}

</div>


<video
src="${video.video}"
muted
playsinline>
</video>


<div class="details">


<h3>
@${video.username}
</h3>


<p>
${video.caption || "No caption"}
</p>


<span>
👁 ${video.views}
</span>


<span>
❤️ ${video.likes.length}
</span>


<span>
⏱ ${video.watchTime || 0}s
</span>


<h4>
🔥 Score: ${score}
</h4>


</div>


</div>


`;


});


}catch(err){

console.log(err);

}


}

loadTopVideos();

// ================= FOLLOWERS GROWTH =================

async function loadFollowersGrowth(){

    try{

        const res = await fetch(
            "/api/shorts/analytics/followers/" + user.username
        );

        const data = await res.json();


        if(!data.success){

            console.log(data.message);
            return;

        }


        // Total Followers

        document.getElementById(
            "totalFollowers"
        ).innerText = data.totalFollowers;



        const labels = data.growth.map(item => item.day);


        const followersData = data.growth.map(
            item => item.followers
        );



        const ctx = document
        .getElementById("followersChart")
        .getContext("2d");



        new Chart(ctx, {

            type:"line",

            data:{

                labels:labels,

                datasets:[{

                    label:"Followers",

                    data:followersData,

                    tension:0.4,

                    fill:true

                }]

            },


            options:{

                responsive:true,

                plugins:{

                    legend:{

                        display:true

                    }

                },


                scales:{

                    y:{

                        beginAtZero:true

                    }

                }

            }

        });



    }catch(err){

        console.log(err);

    }

}


loadFollowersGrowth();
