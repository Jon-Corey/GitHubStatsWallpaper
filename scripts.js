// Lively Properties
var gitHubToken = "";
var refreshTime = 10;
var primaryColor = "#53FF8A";
var scale = 100;
// First Repo Lively Properties
var firstRepo = "";
var firstRepoMaxPrs = 30;
var firstRepoShowDraftPrs = true;
var firstRepoShowPrsAwaitingReview = true;
var firstRepoShowApprovedPrs = true;
var firstRepoShowLatestIssues = true;
var firstRepoMaxIssues = 30;
var firstRepoShowLatestReleases = true;
var firstRepoMaxReleases = 1;
// Second Repo Lively Properties
var secondRepo = "";
var secondRepoMaxPrs = 30;
var secondRepoShowDraftPrs = true;
var secondRepoShowPrsAwaitingReview = true;
var secondRepoShowApprovedPrs = true;
var secondRepoShowLatestIssues = true;
var secondRepoMaxIssues = 30;
var secondRepoShowLatestReleases = true;
var secondRepoMaxReleases = 1;
// Third Repo Lively Properties
var thirdRepo = "";
var thirdRepoMaxPrs = 30;
var thirdRepoShowDraftPrs = true;
var thirdRepoShowPrsAwaitingReview = true;
var thirdRepoShowApprovedPrs = true;
var thirdRepoShowLatestIssues = true;
var thirdRepoMaxIssues = 30;
var thirdRepoShowLatestReleases = true;
var thirdRepoMaxReleases = 1;

var timeInterval;
var renderTimeout;

/**
 * Renders the data on the screen. Meant to be run whenever the data needs to be updated.
 */
async function render() {
    clearInterval(timeInterval);
    clearTimeout(renderTimeout);

    // Theme
    if (primaryColor) {
        document.documentElement.style.setProperty('--primary-color', primaryColor);
    }
    if (scale) {
        document.documentElement.style.setProperty('--scale', `${scale}%`);
    }

    // Date
    document.getElementById("date-content").textContent = new Date().toLocaleDateString("en-US", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Time
    document.getElementById("time-content").textContent = new Date().toLocaleTimeString("en-US");
    timeInterval = setInterval(() => {
        document.getElementById("time-content").textContent = new Date().toLocaleTimeString("en-US");
    }, 1000)

    // Repo Headers
    document.getElementById("first-repo-header").innerText = firstRepo ? firstRepo : "[blank]";
    document.getElementById("second-repo-header").innerText = secondRepo ? secondRepo : "[blank]";;
    document.getElementById("third-repo-header").innerText = thirdRepo ? thirdRepo : "[blank]";;

    // First Repo
    if (firstRepo) {
        const firstRepoData = await getData(firstRepo, firstRepoMaxPrs, firstRepoShowDraftPrs, firstRepoShowPrsAwaitingReview, firstRepoShowApprovedPrs, firstRepoShowLatestIssues, firstRepoMaxIssues, firstRepoShowLatestReleases, firstRepoMaxReleases);
        const firstRepoContent = document.getElementById("first-repo-content");
        firstRepoContent.innerHTML = "";
        renderDataRecursive(firstRepoData, firstRepoContent);
    }
    else {
        document.getElementById("first-repo-content").innerHTML = "[blank]";
    }

    // Second Repo
    if (secondRepo) {
        const secondRepoData = await getData(secondRepo, secondRepoMaxPrs, secondRepoShowDraftPrs, secondRepoShowPrsAwaitingReview, secondRepoShowApprovedPrs, secondRepoShowLatestIssues, secondRepoMaxIssues, secondRepoShowLatestReleases, secondRepoMaxReleases);
        const secondRepoContent = document.getElementById("second-repo-content");
        secondRepoContent.innerHTML = "";
        renderDataRecursive(secondRepoData, secondRepoContent);
    }
    else {
        document.getElementById("second-repo-content").innerHTML = "[blank]";
    }

    // Third Repo
    if (thirdRepo) {
        const thirdRepoData = await getData(thirdRepo, thirdRepoMaxPrs, thirdRepoShowDraftPrs, thirdRepoShowPrsAwaitingReview, thirdRepoShowApprovedPrs, thirdRepoShowLatestIssues, thirdRepoMaxIssues, thirdRepoShowLatestReleases, thirdRepoMaxReleases);
        const thirdRepoContent = document.getElementById("third-repo-content");
        thirdRepoContent.innerHTML = "";
        renderDataRecursive(thirdRepoData, thirdRepoContent);
    }
    else {
        document.getElementById("third-repo-content").innerHTML = "[blank]";
    }

    // Render again in {refreshTime} minutes
    renderTimeout = setTimeout(render, refreshTime * 60000);
}

/**
 * Gets data about the specified repo.
 * @param {string} repo The repo to get data for (OWNER/REPO).
 * @param {number} maxPrs The maximum number of PRs to pull.
 * @param {boolean} showDraftPrs Should the Draft PRs section be shown.
 * @param {boolean} showPrsAwaitingReview Should the PRs Awaiting Review section be shown.
 * @param {boolean} showApprovedPrs Should the Approved PRs section be shown.
 * @param {boolean} showLatestIssues Should the Lastest Issues section be shown.
 * @param {number} maxIssues The maxiumum number of issues to pull.
 * @param {boolean} showLatestReleases Should the Latest Releases section be shown.
 * @param {number} maxReleases The maximum number of releases to pull.
 * @returns {object} An object with properties for each of the shown sections.
 */
async function getData(repo, maxPrs, showDraftPrs, showPrsAwaitingReview, showApprovedPrs, showLatestIssues, maxIssues, showLatestReleases, maxReleases) {
    let data = {};
    
    if (!repo) {
        return data;
    }

    // PR Data
    if (showDraftPrs === true || showPrsAwaitingReview === true || showApprovedPrs === true) {
        const prs = await makeRequest(`https://api.github.com/repos/${repo}/pulls?per_page=${maxPrs}`);

        let draftPrs = [];
        let awaitingReviewPrs = [];
        let approvedPrs = [];

        for (pr of prs) {
            let object = {};

            object[pr.title] = {};
            object[pr.title]["Id"] = `#${pr.number}`;
            object[pr.title]["User"] = pr.user.login?.toString();
            object[pr.title]["Created"] = pr.created_at?.toString();
            object[pr.title]["Reviewers"] = [];
            for (reviewer of pr.requested_reviewers) {
                object[pr.title]["Reviewers"].push(reviewer.login?.toString());
            }

            if (pr.draft === true) {
                draftPrs.push(object);
            }
            else if (pr.requested_reviewers.length == 0) {
                awaitingReviewPrs.push(object);
            }
            else if (showPrsAwaitingReview === true || showApprovedPrs === true) {
                const reviews = await makeRequest(`https://api.github.com/repos/${repo}/pulls/${pr.number}/reviews`);
                let allApproved = true;

                for (const review of reviews) {
                    if (review.state != "APPROVED") {
                        allApproved = false;
                    }
                }

                if (allApproved == true) {
                    approvedPrs.push(object);
                }
                else {
                    awaitingReviewPrs.push(object);
                }
            }
        }

        if (showDraftPrs === true) {
            data["Draft PRs"] = draftPrs;
        }
        if (showPrsAwaitingReview === true) {
            data["PRs Awaiting Review"] = awaitingReviewPrs;
        }
        if (showApprovedPrs === true) {
            data["Approved PRs"] = approvedPrs;
        }
    }

    // Issue Data
    if (showLatestIssues === true) {
        const issues = await makeRequest(`https://api.github.com/repos/${repo}/issues?per_page=${maxIssues}`);

        let latestIssues = [];

        for (issue of issues) {
            let object = {};
    
            object[issue.title] = {};
            object[issue.title]["Id"] = `#${issue.number}`;
            object[issue.title]["User"] = issue.user.login?.toString();
            object[issue.title]["Created"] = issue.created_at?.toString();
            if (issue.draft === true) {
                object[issue.title]["Draft"] = "true";
            }
    
            latestIssues.push(object);
        }

        data["Latest Issues"] = latestIssues;
    }

    // Release Data
    if (showLatestReleases === true) {
        const releases = await makeRequest(`https://api.github.com/repos/${repo}/releases?per_page=${maxReleases}`);

        let latestReleases = [];

        for (release of releases) {
            let object = {};
    
            object[release.tag_name] = {};
            object[release.tag_name]["Created"] = release.created_at?.toString();
            object[release.tag_name]["Body"] = release.body?.toString()?.trim()
                ?.replace(/&/g, '&amp;')
                ?.replace(/</g, '&lt;')
                ?.replace(/>/g, '&gt;')
                ?.replace(/"/g, '&quot;')
                ?.replace(/'/g, '&#39;')
                ?.replaceAll("\n", "<br>")
                ?.replaceAll("\r", "");
    
            latestReleases.push(object);
        }

        data["Latest Release"] = latestReleases;
    }

    return data;
}

/**
 * Gets data from the specified URL. Includes a GitHub authorization token in the request and handles errors.
 * @param {string} url The URL to fetch data from. Should include the base URL and the specific endpoint.
 * @returns {object} The object returned by the API request.
 */
async function makeRequest(url) {
    try {
        let requestOptions = {};
        if (gitHubToken) {
            requestOptions = {
                headers: {
                    "Authorization": `Bearer ${gitHubToken}`
                }
            }
        }

        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        return json;
    }
    catch (error) {
        console.error(error.message);
    }
}

/**
 * Renders the given data under the given element. Runs recursively in order to display all descendant properties.
 * @param {object} data The data to be rendered.
 * @param {HTMLElement} element The element to append to.
 */
function renderDataRecursive(data, element) {
    if (typeof data === "string") {
        element.innerHTML = `<i class="icon icon-right-caret"></i> ${data}`;
    }
    else if (data instanceof Array) {
        if (data.length == 0) {
            const ul = document.createElement("ul");
            ul.className = "no-items";

            renderDataRecursive("[none]", ul);

            element.appendChild(ul);
        }

        data.forEach(value => {
            if (typeof value === "string") {
                const ul = document.createElement("ul");

                renderDataRecursive(value, ul);

                element.appendChild(ul);
            }
            else {
                renderDataRecursive(value, element);
            }
        });
    }
    else {
        const ul = document.createElement("ul");
        for (const [key, value] of Object.entries(data)) {
            const li = document.createElement("li");

            if (typeof value === "string") {
                li.innerHTML = `<i class="icon icon-right-caret"></i> ${key}: ${value}`;
                ul.appendChild(li);
            }
            else if (typeof value === "object") {
                li.innerHTML = `<i class="icon icon-down-caret"></i> ${key}`;
                ul.appendChild(li);
                renderDataRecursive(value, li);
            }
        }
        element.appendChild(ul);
    }
}

/**
 * Used by Lively to set the values on properties.
 * @param {string} name The name of the property to set.
 * @param {string} val The value to set the property to.
 */
function livelyPropertyListener(name, val) {
    switch (name) {
        case "btnRefresh":
            render();
            break;
        case "gitHubToken":
            gitHubToken = val;
            break;
        case "refreshTime":
            refreshTime = val;
            break;
        case "primaryColor":
            primaryColor = val;
            break;
        case "scale":
            scale = val;
            break;
        case "firstRepo":
            firstRepo = val;
            break;
        case "firstRepoMaxPrs":
            firstRepoMaxPrs = val;
            break;
        case "firstRepoShowDraftPrs":
            firstRepoShowDraftPrs = val;
            break;
        case "firstRepoShowPrsAwaitingReview":
            firstRepoShowPrsAwaitingReview = val;
            break;
        case "firstRepoShowApprovedPrs":
            firstRepoShowApprovedPrs = val;
            break;
        case "firstRepoShowLatestIssues":
            firstRepoShowLatestIssues = val;
            break;
        case "firstRepoMaxIssues":
            firstRepoMaxIssues = val;
            break;
        case "firstRepoShowLatestReleases":
            firstRepoShowLatestReleases = val;
            break;
        case "firstRepoMaxReleases":
            firstRepoMaxReleases = val;
            break;
        case "secondRepo":
            secondRepo = val;
            break;
        case "secondRepoMaxPrs":
            secondRepoMaxPrs = val;
            break;
        case "secondRepoShowDraftPrs":
            secondRepoShowDraftPrs = val;
            break;
        case "secondRepoShowPrsAwaitingReview":
            secondRepoShowPrsAwaitingReview = val;
            break;
        case "secondRepoShowApprovedPrs":
            secondRepoShowApprovedPrs = val;
            break;
        case "secondRepoShowLatestIssues":
            secondRepoShowLatestIssues = val;
            break;
        case "secondRepoMaxIssues":
            secondRepoMaxIssues = val;
            break;
        case "secondRepoShowLatestReleases":
            secondRepoShowLatestReleases = val;
            break;
        case "secondRepoMaxReleases":
            secondRepoMaxReleases = val;
            break;
        case "thirdRepo":
            thirdRepo = val;
            break;
        case "thirdRepoMaxPrs":
            thirdRepoMaxPrs = val;
            break;
        case "thirdRepoShowDraftPrs":
            thirdRepoShowDraftPrs = val;
            break;
        case "thirdRepoShowPrsAwaitingReview":
            thirdRepoShowPrsAwaitingReview = val;
            break;
        case "thirdRepoShowApprovedPrs":
            thirdRepoShowApprovedPrs = val;
            break;
        case "thirdRepoShowLatestIssues":
            thirdRepoShowLatestIssues = val;
            break;
        case "thirdRepoMaxIssues":
            thirdRepoMaxIssues = val;
            break;
        case "thirdRepoShowLatestReleases":
            thirdRepoShowLatestReleases = val;
            break;
        case "thirdRepoMaxReleases":
            thirdRepoMaxReleases = val;
            break;
    }
}

// Delay first render until all parameters are set
setTimeout(render, 250);

// Render again to make sure
setTimeout(render, 1000);
