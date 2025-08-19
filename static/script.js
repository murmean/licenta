
document.addEventListener("DOMContentLoaded", () => {
    const textForm          = document.getElementById("textForm");
    const textInputEl       = document.getElementById("textInput");
    const fileInputEl       = document.getElementById("fileInput");
    const loadingSpinner = document.getElementById("loadingSpinner");

    const lowercaseCb       = document.getElementById("lowercase");
    const removePunctCb     = document.getElementById("remove_punct");
    const removeStopCb      = document.getElementById("remove_stopwords");
    const lemmatizeCb       = document.getElementById("lemmatize");

    const fileInfoBox       = document.getElementById("fileInfo");
    const fileNameSpan      = document.getElementById("fileName");
    const removeFileBtn     = document.getElementById("removeFileBtn");

    const resultsBox        = document.getElementById("results");
    const sentimentSpan     = document.getElementById("sentiment");
    const topicsUl          = document.getElementById("topics");
    const processedTextDiv  = document.getElementById("processedText");
    const downloadTextBtn   = document.getElementById("downloadTextBtn");

    const summarizeBtn      = document.getElementById("summarizeBtn");
    const summaryContainer  = document.getElementById("summaryContainer");
    const summaryTextP      = document.getElementById("summaryText");


    // Strip HTML tags (defensive) ---------------------------------
    function stripHtmlTags(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    }

    // Trigger download of processed text ------------------------
    function downloadProcessedText() {
        const rawText   = processedTextDiv.innerHTML; // could include highlights
        const cleanText = stripHtmlTags(rawText);

        const filename = `processed_text_${new Date().toISOString().replace(/:/g, "-")}.txt`;
        const blob     = new Blob([cleanText], { type: "text/plain;charset=utf-8" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Populate topics list --------------------------------------
    function renderTopics(topics) {
        topicsUl.innerHTML = "";
        topics.forEach(topic => {
            const li = document.createElement("li");
            li.classList.add("list-group-item");
            li.textContent = topic;
            topicsUl.appendChild(li);
        });
    }


    fileInputEl.addEventListener("change", (e) => {
        const file = e.target.files[0];

        if (!file) {
            // User cleared the dialog
            fileInfoBox.style.display = "none";
            return;
        }

        // Acceptable MIME types differ by browser
        const allowedTypes = [
            "text/plain",
            "text/csv",
            "application/vnd.ms-excel", // some browsers label .csv as Excel
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Unsupported file type! Please upload a .txt or .csv file.");
            fileInputEl.value = "";            // clear selection
            fileInfoBox.style.display = "none";
            return;
        }

        fileNameSpan.textContent = file.name;
        fileInfoBox.style.display = "flex";
    });

    removeFileBtn.addEventListener("click", () => {
        fileInputEl.value = "";
        fileInfoBox.style.display = "none";
    });

 textForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Show loading spinner
    loadingSpinner.style.display = "block";

    const formData = new FormData();
    formData.append("lowercase", lowercaseCb.checked);
    formData.append("remove_punct", removePunctCb.checked);
    formData.append("remove_stopwords", removeStopCb.checked);
    formData.append("lemmatize", lemmatizeCb.checked);

    const selectedFile = fileInputEl.files[0];
    const userText = textInputEl.value.trim();

    if (selectedFile) {
        formData.append("file", selectedFile);
    } else {
        formData.append("text", userText);
    }

    fetch("/analyze", { method: "POST", body: formData })
        .then(res => res.json())
        .then(data => {
            // Hide loading spinner
            loadingSpinner.style.display = "none";

            if (data.error) {
                alert(data.error);
                return;
            }

            resultsBox.style.display = "block";
            sentimentSpan.textContent = data.sentiment;
            processedTextDiv.textContent = data.processed_text;
            downloadTextBtn.style.display = "block";
            renderTopics(data.topics);
            summaryContainer.style.display = "none";
        })
        .catch(err => {
            // Hide loading spinner
            loadingSpinner.style.display = "none";
            console.error("Error during analysis", err);
            alert("An error occurred while analyzing the text.");
        });
});

    downloadTextBtn.addEventListener("click", downloadProcessedText);

    summarizeBtn.addEventListener("click", () => {
        const processed = processedTextDiv.textContent.trim();

        if (!processed) {
            alert("Please analyze some text before summarizing.");
            return;
        }
        loadingSpinner.style.display = "block"; // ⬅️ Show spinner
        const fd = new FormData();
        fd.append("text", processed);

        fetch("/summarize", { method: "POST", body: fd })
            .then(res => res.json())
            .then(data => {
                loadingSpinner.style.display = "none";
                if (data.error) {
                    alert(data.error);
                    return;
                }

                summaryTextP.textContent = data.summary;
                summaryContainer.style.display = "block";
            })
            .catch(err => {
                loadingSpinner.style.display = "none";
                console.error("Error during summarization", err);
                alert("An error occurred while summarizing the text.");
            });
    });
});
