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

        // Display word cloud
        if (data.wordcloud) {
            let wordcloudImage = document.getElementById("wordcloud");
            wordcloudImage.src = data.wordcloud + "?timestamp=" + new Date().getTime();
            wordcloudImage.style.display = "block";
        }

        // Display topics
        let topicsList = document.getElementById("topics");
        topicsList.innerHTML = "";
        data.topics.forEach(topic => {
            let li = document.createElement("li");
            li.textContent = topic[1];
            topicsList.appendChild(li);
        });

        // Highlight important keywords
        let processedText = data.text;
        let keywords = data.keywords || [];
        keywords.forEach(keyword => {
            let regex = new RegExp(`\\b${keyword}\\b`, "gi");
            processedText = processedText.replace(regex, `<mark>${keyword}</mark>`);
        });

        // Display processed text with highlights
        document.getElementById("processedText").innerHTML = processedText;
        document.getElementById("results").style.display = "block";

    } catch (error) {
        console.error("Error during analysis:", error);
        alert("An error occurred while processing the text.");
    }
});
