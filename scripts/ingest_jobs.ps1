$jobs = @(
    @{
        title = "Software Engineer - AI"
        location = "Florida (Remote options)"
        description = "Build AI-enhanced retail and eCommerce experiences. Focus on personalized recommendations, search optimization, and predictive analysis. Requires 3+ years of experience and proficiency in full-stack JS."
    },
    @{
        title = "Software Engineer III"
        location = "Chicago, IL / Reston, VA"
        description = "Develop cutting-edge media platforms and microservices. Requires 3-5 years of experience in Go or Java, RESTful APIs, and CI/CD. Focus on high-availability backend systems."
    },
    @{
        title = "Mid-level Software Engineer (Java Full Stack)"
        location = "San Antonio, TX / Charlotte, NC"
        description = "Build next-gen investment solutions using Java, Go, and OpenShift. Requires 2+ years of experience in the full SDLC and strong collaborative skills."
    },
    @{
        title = "Software Development Engineer (SDE-I)"
        location = "Multiple US Locations"
        description = "Own the full lifecycle of code for scalable cloud services. Focus on GenAI tools to enhance productivity and building resilient distributed systems."
    },
    @{
        title = "Lead DNA MLOps & Data Science"
        location = "Summit, NJ"
        description = "Deliver scalable AI solutions and implement global MLOps models. Requires 5+ years of experience. Tools include Databricks, Snowflake, and robust ETL pipelines."
    },
    @{
        title = "Clinical Real World Data Scientist"
        location = "Toronto, ON"
        description = "Use AI and LLMs to evaluate real-world data (RWD) for biopharma research. Requires expertise in pharmaco-epidemiological methods and data assessment frameworks."
    },
    @{
        title = "Associate Data Science Analyst"
        location = "Rochester, MN"
        description = "Support clinical research through data mining, pattern analysis, and predictive modeling. Requires a quantitative degree and experience with genomic data or cloud computing."
    },
    @{
        title = "Data Scientist (MLOps)"
        location = "Warsaw, Poland (Remote)"
        description = "Support IT retail teams with AI forecasting models and Azure infrastructure. Focus on Databricks Apps, Streamlit, and MLOps initiatives."
    }
)

$json = $jobs | ConvertTo-Json
$url = "http://localhost:8080/api/public/ingest-real-jobs"

Write-Host "Sending ingestion request to $url..."
try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $json -ContentType "application/json"
    Write-Host "Successfully ingested $($response.Count) jobs!"
    $response | Format-Table id, title, location
} catch {
    Write-Error "Failed to ingest jobs: $_"
}
