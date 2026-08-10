let searchType = "shorts";


// ===============================
// ELEMENTS
// ===============================

const searchInput =
    document.getElementById("searchInput");

const results =
    document.getElementById("results");

const searchTitle =
    document.getElementById("searchTitle");

const clearSearch =
    document.getElementById("clearSearch");


// ===============================
// SWITCH SEARCH TYPE
// ===============================

function switchSearchType(type){

    searchType = type;

    const shortsTab =
        document.getElementById("shortsTab");

    const usersTab =
        document.getElementById("usersTab");


    shortsTab.classList.remove("active");
    usersTab.classList.remove("active");


    if(type === "shorts"){

        shortsTab.classList.add("active");

        searchTitle.innerText =
            "Search Shorts";

        searchInput.placeholder =
            "Search Shorts or #hashtag...";

    }else{

        usersTab.classList.add("active");

        searchTitle.innerText =
            "Search Users";

        searchInput.placeholder =
            "Search username...";

    }


    searchInput.focus();

}


// ===============================
// PERFORM SEARCH
// ===============================

async function performSearch(){

    const keyword =
        searchInput.value
        .trim()
        .replace(/^#/, "");


    if(!keyword){

        results.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-magnifying-glass"></i>

                <h3>
                    Type something to search
                </h3>

                <p>
                    Search for a user, Short or hashtag.
                </p>

            </div>

        `;

        return;

    }


    showLoading();


    if(searchType === "users"){

        await searchUsers(keyword);

    }else{

        await searchShorts(keyword);

    }

}


// ===============================
// SEARCH SHORTS
// ===============================

async function searchShorts(keyword){

    try{

        const res =
            await fetch(
                "/api/shorts/search/" +
                encodeURIComponent(keyword)
            );


        const data =
            await res.json();


        if(
            data.success &&
            Array.isArray(data.videos) &&
            data.videos.length
        ){

            renderShorts(data.videos);

        }else{

            showNoResults(
                "No Shorts found 😢"
            );

        }


    }catch(err){

        console.error(err);

        showError();

    }

}


// ===============================
// SEARCH USERS
// ===============================

async function searchUsers(keyword){

    try{

        const res =
            await fetch(
                "/api/users/search/" +
                encodeURIComponent(keyword)
            );


        const data =
            await res.json();


        if(
            data.success &&
            Array.isArray(data.users) &&
            data.users.length
        ){

            renderUsers(data.users);

        }else{

            showNoResults(
                "No users found 😢"
            );

        }


    }catch(err){

        console.error(err);

        showError();

    }

}


// ===============================
// RENDER SHORTS
// ===============================

function renderShorts(videos){

    let html = "";


    videos.forEach(video => {

        const id =
            video._id || "";


        const username =
            escapeHTML(
                video.username || "Unknown"
            );


        const caption =
            escapeHTML(
                video.caption || ""
            );


        const likes =
            Array.isArray(video.likes)
            ? video.likes.length
            : (video.likes || 0);


        const views =
            video.views || 0;


        const hashtags =
            Array.isArray(video.hashtags)
            ? video.hashtags
            : [];


        html += `

        <div
        class="video-card"
        onclick="openShort('${id}')">


            <div class="video-wrapper">

                <video
                src="${video.video}"
                muted
                playsinline
                preload="metadata"
                controls
                onclick="event.stopPropagation()">
                </video>

                <div class="play-icon">

                    <i class="fa-solid fa-play"></i>

                </div>

            </div>


            <div class="video-info">

                <h3>

                    <i class="fa-solid fa-user"></i>

                    @${username}

                </h3>


                <p class="caption">

                    ${caption}

                </p>


                <div class="video-stats">

                    <span>
                        ❤️ ${likes}
                    </span>

                    <span>
                        👁 ${views}
                    </span>

                </div>


                ${
                    hashtags.length
                    ? `
                    <div class="tags">

                        ${hashtags.map(tag => `

                            <span>
                                #${escapeHTML(tag)}
                            </span>

                        `).join("")}

                    </div>
                    `
                    : ""
                }

            </div>

        </div>

        `;

    });


    results.innerHTML = html;

}


// ===============================
// RENDER USERS
// ===============================

function renderUsers(users){

    let html = "";


    users.forEach(user => {

        const username =
            escapeHTML(
                user.username || ""
            );


        const name =
            escapeHTML(
                user.name ||
                user.displayName ||
                username
            );


        const bio =
            escapeHTML(
                user.bio || ""
            );


        const avatar =
    user.avatar && user.avatar.trim() !== ""
    ? user.avatar
    : "/images/default.png";

        html += `

        <div
        class="user-card"
        onclick="openProfile('${username}')">


            <img
            src="${avatar}"
            class="user-avatar"
            onerror="this.src='/images/default.png'">

            <div class="user-details">

                <h3>

                    @${username}

                </h3>


                <p class="user-name">

                    ${name}

                </p>


                ${
                    bio
                    ? `
                    <p class="user-bio">

                        ${bio}

                    </p>
                    `
                    : ""
                }

            </div>


            <i
            class="fa-solid fa-chevron-right user-arrow">
            </i>

        </div>

        `;

    });


    results.innerHTML = html;

}


// ===============================
// OPEN SHORT
// ===============================

function openShort(id){

    if(!id){
        return;
    }


    window.location.href =
        "/shorts.html?video=" +
        encodeURIComponent(id);

}


// ===============================
// OPEN PROFILE
// ===============================

function openProfile(username){

    if(!username){
        return;
    }


    window.location.href =
        "/profile.html?username=" +
        encodeURIComponent(username);

}


// ===============================
// LOADING
// ===============================

function showLoading(){

    results.innerHTML = `

        <div class="loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <p>
                Searching...
            </p>

        </div>

    `;

}


// ===============================
// NO RESULTS
// ===============================

function showNoResults(message){

    results.innerHTML = `

        <div class="empty-state">

            <i class="fa-regular fa-face-frown"></i>

            <h3>
                ${message}
            </h3>

            <p>
                Try another search.
            </p>

        </div>

    `;

}


// ===============================
// ERROR
// ===============================

function showError(){

    results.innerHTML = `

        <div class="empty-state error">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <h3>
                Search failed
            </h3>

            <p>
                Please try again.
            </p>

        </div>

    `;

}


// ===============================
// CLEAR
// ===============================

clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        results.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-magnifying-glass"></i>

                <h3>
                    Search 2Chat
                </h3>

                <p>
                    Find Shorts, hashtags and users.
                </p>

            </div>

        `;

        searchInput.focus();

    }
);


// ===============================
// ENTER TO SEARCH
// ===============================

searchInput.addEventListener(
    "keydown",
    event => {

        if(event.key === "Enter"){

            event.preventDefault();

            performSearch();

        }

    }
);


// ===============================
// HTML SAFETY
// ===============================

function escapeHTML(value){

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}
