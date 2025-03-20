document.getElementById("textForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    let formData = new FormData();
    formData.append("text", document.getElementById("textInput").value);
    formData.append("lowercase", document.getElementById("lowercase").checked ? "true" : "false");
    formData.append("remove_punct", document.getElementById("remove_punct").checked ? "true" : "false");
    formData.append("remove_stopwords", document.getElementById("remove_stopwords").checked ? "true" : "false");
    formData.append("lemmatize", document.getElementById("lemmatize").checked ? "true" : "false");

    try {
        let response = await fetch("/analyze", {
            method: "POST",
            body: formData
        });

        let data = await response.json();
        if (!data || data.error) {
            alert("Error processing the request: " + (data.error || "Unknown error"));
            return;
        }

        // Display sentiment
        document.getElementById("sentiment").textContent = data.sentiment.toFixed(2);

        // Hide Word Cloud (Commented Out)
        // if (data.wordcloud) {
        //     let wordcloudImage = document.getElementById("wordcloud");
        //     wordcloudImage.src = data.wordcloud + "?timestamp=" + new Date().getTime();
        //     wordcloudImage.style.display = "block";
        // }

        // Display improved topics
        let topicsList = document.getElementById("topics");
        topicsList.innerHTML = "";
        data.topics.forEach(topic => {
            let li = document.createElement("li");
            li.textContent = topic;
            topicsList.appendChild(li);
        });

        // Highlight keywords in processed text
        let processedText = data.processed_text;
        let keywords = data.keywords || [];

        keywords.forEach(keyword => {
            let regex = new RegExp(`\\b${keyword}\\b`, "gi");
            processedText = processedText.replace(regex, `<span class="highlight">${keyword}</span>`);
        });

        // Display processed text with highlights
        document.getElementById("processedText").innerHTML = processedText;
        document.getElementById("results").style.display = "block";

    } catch (error) {
        console.error("Error during analysis:", error);
        alert("An error occurred while processing the text.");
    }
});
